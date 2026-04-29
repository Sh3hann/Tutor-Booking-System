import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data/store-mongo.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendBookingAlert } from '../utils/notifications.js';

export const bookingsRouter = Router();

// POST /api/bookings - Create new booking
bookingsRouter.post('/', authMiddleware, async (req, res) => {
  try {
    if ((req.user?.role || '').toLowerCase() !== 'student') {
      return res.status(403).json({ error: 'Only students can book classes' });
    }
    
    const {
      tutorId,
      subject,
      classType,
      classFormat,
      dateTime,
      price,
      grade,
      preferredDate,
      preferredTime,
      duration,
      notes,
    } = req.body;
    
    if (!tutorId || !dateTime) {
      return res.status(400).json({ error: 'tutorId and dateTime are required' });
    }

    const users = await store.users.get();
    const student = users.find(u => u.id === req.user.id);
    const tutor = users.find(u => u.id === tutorId);

    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const booking = {
      id: uuidv4(),
      studentId: req.user.id,
      tutorId,
      subject: subject || 'General',
      grade: grade || '',
      preferredDate: preferredDate || '',
      preferredTime: preferredTime || '',
      duration: duration || '',
      notes: notes || '',
      classType: classType || 'Individual',
      classFormat: classFormat || 'Online',
      dateTime: new Date(dateTime).toISOString(),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      price: price || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bookings = await store.bookings.get() || [];
    bookings.push(booking);
    await store.bookings.set(bookings);

    // Trigger mocked alert
    sendBookingAlert('NEW_BOOKING_REQUEST', booking, { studentName: student?.fullName });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:id - Update a pending booking request (student only)
bookingsRouter.put('/:id', authMiddleware, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'student') return res.status(403).json({ error: 'Only students can edit booking requests' });

    const { id } = req.params;
    const allBookings = await store.bookings.get() || [];
    const index = allBookings.findIndex(b => b.id === id);
    if (index === -1 || allBookings[index].studentId !== req.user.id) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = allBookings[index];
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Accepted bookings cannot be edited' });
    }

    const {
      subject,
      grade,
      preferredDate,
      preferredTime,
      duration,
      notes,
      classType,
      classFormat,
      dateTime,
    } = req.body || {};

    // Basic validation for required fields
    const nextSubject = (subject ?? booking.subject ?? '').toString().trim();
    const nextDateTime = dateTime ? new Date(dateTime).toISOString() : booking.dateTime;
    if (!nextSubject) return res.status(400).json({ error: 'subject is required' });
    if (!nextDateTime) return res.status(400).json({ error: 'dateTime is required' });

    allBookings[index] = {
      ...booking,
      subject: nextSubject,
      grade: (grade ?? booking.grade ?? '').toString(),
      preferredDate: (preferredDate ?? booking.preferredDate ?? '').toString(),
      preferredTime: (preferredTime ?? booking.preferredTime ?? '').toString(),
      duration: (duration ?? booking.duration ?? '').toString(),
      notes: (notes ?? booking.notes ?? '').toString(),
      classType: (classType ?? booking.classType ?? '').toString(),
      classFormat: (classFormat ?? booking.classFormat ?? '').toString(),
      dateTime: nextDateTime,
      updatedAt: new Date().toISOString(),
    };

    await store.bookings.set(allBookings);
    res.json({ success: true, booking: allBookings[index] });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// GET /api/bookings/student - Get bookings for student
bookingsRouter.get('/student', authMiddleware, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'student') return res.status(403).json({ error: 'Not authorized' });

    const bookings = (await store.bookings.get() || []).filter(b => b.studentId === req.user.id);
    
    const users = await store.users.get();
    const allTutors = await store.tutors.get() || [];
    const withNames = bookings.map(b => {
      const tutor = users.find(u => u.id === b.tutorId);
      // Always try current tutor profile first for meeting link (overrides stale/bad stored links)
      let meetingLink = '';
      if (b.classFormat === 'Online' && b.paymentStatus === 'PAID') {
        // Try findByUserId (tutor's userId field) and fallback to id match
        const tutorProfile = allTutors.find(t => t.userId === b.tutorId) ||
                             allTutors.find(t => t.id === b.tutorId);
        let profileLink = tutorProfile?.meetingLink || '';
        // Normalize URL
        if (profileLink && !profileLink.startsWith('http')) {
          profileLink = 'https://meet.google.com/' + profileLink.replace(/^\//, '');
        }
        meetingLink = profileLink || b.meetingLink || '';
        // Don't use broken fallback URLs
        if (meetingLink === 'https://meet.google.com/new') meetingLink = '';
      }
      return { ...b, meetingLink, tutorName: tutor ? tutor.fullName : 'Unknown Tutor' };
    });

    res.json({ bookings: withNames });
  } catch (err) {
    console.error('Get student bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/tutor - Get bookings for tutor
bookingsRouter.get('/tutor', authMiddleware, async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'tutor') return res.status(403).json({ error: 'Not authorized' });

    const bookings = (await store.bookings.get() || []).filter(b => b.tutorId === req.user.id);
    
    const users = await store.users.get();
    const withNames = bookings.map(b => {
      const student = users.find(u => u.id === b.studentId);
      return { 
        ...b, 
        studentName: student ? student.fullName : 'Unknown Student',
        studentDetails: student ? {
          age: student.age,
          grade: student.grade,
          parentName: student.parentName,
          parentContact: student.parentContact,
          contactNumber: student.contactNumber,
          email: student.email
        } : null 
      };
    });

    res.json({ bookings: withNames });
  } catch (err) {
    console.error('Get tutor bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PATCH /api/bookings/:id/accept - Accept booking request (tutor only)
bookingsRouter.patch('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'tutor') return res.status(403).json({ error: 'Only tutors can accept booking requests' });

    const allBookings = await store.bookings.get() || [];
    const index = allBookings.findIndex(b => b.id === id);
    if (index === -1 || allBookings[index].tutorId !== req.user.id) {
       return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = allBookings[index];
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be accepted' });
    }

    booking.status = 'ACCEPTED';
    booking.updatedAt = new Date().toISOString();

    if (booking.classFormat === 'Online') {
      // Try to get the tutor's current meeting link
      const tutorProfile = await store.tutors.findByUserId(req.user.id).catch(() => null)
                        || await store.tutors.getById(req.user.id).catch(() => null);
      let link = tutorProfile?.meetingLink || '';
      if (link && !link.startsWith('http')) {
        link = 'https://meet.google.com/' + link.replace(/^\//, '');
      }
      // Only store if we have a real link — otherwise leave empty so GET route fetches it live
      booking.meetingLink = (link && link !== 'https://meet.google.com/new') ? link : '';
    }

    await store.bookings.set(allBookings);

    const users = await store.users.get();
    const tutor = users.find(u => u.id === req.user.id);

    sendBookingAlert('BOOKING_ACCEPTED', booking, { tutorName: tutor?.fullName });

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Accept booking error:', err);
    res.status(500).json({ error: 'Failed to accept booking' });
  }
});

// PATCH /api/bookings/:id/reject - Reject booking request (tutor only, status update)
bookingsRouter.patch('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'tutor') return res.status(403).json({ error: 'Only tutors can reject booking requests' });

    const allBookings = await store.bookings.get() || [];
    const index = allBookings.findIndex(b => b.id === id);
    if (index === -1 || allBookings[index].tutorId !== req.user.id) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = allBookings[index];
    if (booking.status !== 'PENDING') return res.status(400).json({ error: 'Only pending bookings can be rejected' });

    booking.status = 'REJECTED';
    booking.updatedAt = new Date().toISOString();

    await store.bookings.set(allBookings);

    const users = await store.users.get();
    const tutor = users.find(u => u.id === req.user.id);
    sendBookingAlert('BOOKING_REJECTED', booking, { tutorName: tutor?.fullName });

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

// PATCH /api/bookings/:id/cancel - Cancel pending booking request (student only, status update)
bookingsRouter.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const role = (req.user?.role || '').toLowerCase();
    if (role !== 'student') return res.status(403).json({ error: 'Only students can cancel booking requests' });

    const allBookings = await store.bookings.get() || [];
    const index = allBookings.findIndex(b => b.id === id);
    if (index === -1 || allBookings[index].studentId !== req.user.id) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = allBookings[index];
    if (booking.status !== 'PENDING') return res.status(400).json({ error: 'Only pending bookings can be cancelled' });

    booking.status = 'CANCELLED';
    booking.updatedAt = new Date().toISOString();

    await store.bookings.set(allBookings);
    res.json({ success: true, booking });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// POST /api/bookings/:id/pay - Mock Payment integration
bookingsRouter.post('/:id/pay', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can pay' });

    const allBookings = await store.bookings.get() || [];
    const index = allBookings.findIndex(b => b.id === id);
    if (index === -1 || allBookings[index].studentId !== req.user.id) {
       return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = allBookings[index];
    if (booking.status !== 'ACCEPTED') return res.status(400).json({ error: 'Can only pay for accepted bookings' });
    if (booking.paymentStatus === 'PAID') return res.status(400).json({ error: 'Already paid' });

    booking.paymentStatus = 'PAID';
    booking.paidAt = new Date().toISOString();

    await store.bookings.set(allBookings);

    const users = await store.users.get();
    const student = users.find(u => u.id === req.user.id);
    const tutor = users.find(u => u.id === booking.tutorId);

    sendBookingAlert('PAYMENT_SUCCESS', booking, { studentName: student?.fullName, tutorName: tutor?.fullName });

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Pay booking error:', err);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// GET /api/bookings/earnings - Tutor dashboard financials
bookingsRouter.get('/earnings', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ error: 'Not authorized' });

    const bookings = (await store.bookings.get() || []).filter(b => b.tutorId === req.user.id && b.paymentStatus === 'PAID');
    
    const totalEarnings = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const completedCount = bookings.filter(b => !!b.completedAt).length;

    const users = await store.users.get();
    const withNames = bookings.map(b => {
      const student = users.find(u => u.id === b.studentId);
      return { ...b, studentName: student ? student.fullName : 'Unknown Student' };
    });

    res.json({ totalEarnings, completedCount, paidBookings: withNames });
  } catch (err) {
    console.error('Get earnings error:', err);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// PUT /api/bookings/:id/done - Mark booking as completed
bookingsRouter.put('/:id/done', authMiddleware, async (req, res) => {
  try {
    const roleStr = (req.user?.role || '').toLowerCase();
    if (!roleStr.includes('tutor')) return res.status(403).json({ error: 'Only tutors can mark done' });

    const allBookings = await store.bookings.get() || [];
    const index = allBookings.findIndex(b => b.id === req.params.id
      && (b.tutorId === req.user.id || roleStr.includes('tutor')));
    if (index === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (allBookings[index].paymentStatus !== 'PAID') {
      return res.status(400).json({ error: 'Student payment is required before completing' });
    }

    allBookings[index].completedAt = new Date().toISOString();
    await store.bookings.set(allBookings);

    res.json({ success: true, booking: allBookings[index] });
  } catch (err) {
    console.error('Mark done error:', err);
    res.status(500).json({ error: 'Failed to mark as done' });
  }
});
