export function sendBookingAlert(type, booking, userContext = {}) {
  const tutorName = userContext.tutorName || 'Tutor';
  const studentName = userContext.studentName || 'Student';
  
  console.log('--------------------------------------------------');
  console.log(`[ALERT: ${type}]`);
  
  if (type === 'NEW_BOOKING_REQUEST') {
    console.log(`📧 Email to Tutor: You have a new booking request from ${studentName} for a ${booking.classFormat} ${booking.classType} class on ${new Date(booking.dateTime).toLocaleString()}.`);
    console.log(`📱 SMS to Tutor: New class booking request from ${studentName}. Check your dashboard to accept or reject.`);
  } 
  else if (type === 'BOOKING_ACCEPTED') {
    console.log(`📧 Email to Student: Great news! ${tutorName} has accepted your booking request for ${new Date(booking.dateTime).toLocaleString()}.`);
    if (booking.classFormat === 'Online' && booking.meetingLink) {
      console.log(`🔗 Meeting Link included in email: ${booking.meetingLink}`);
    }
    console.log(`📱 SMS to Student: ${tutorName} accepted your booking. Check dashboard to pay securely.`);
  }
  else if (type === 'BOOKING_REJECTED') {
    console.log(`📧 Email to Student: Unfortunately, ${tutorName} is unable to accept your booking for ${new Date(booking.dateTime).toLocaleString()}.`);
    console.log(`📱 SMS to Student: Your booking with ${tutorName} was declined. Try booking another time slot or tutor.`);
  }
  else if (type === 'PAYMENT_SUCCESS') {
    console.log(`📧 Email to Student: Payment successful for your upcoming class with ${tutorName}. Receipt attached.`);
    console.log(`📧 Email to Tutor: ${studentName} has successfully paid for the upcoming ${booking.classFormat} class.`);
    console.log(`📱 SMS to Student: Payment confirmed! See you in class.`);
    console.log(`📱 SMS to Tutor: Payment received for upcoming booking id: ${booking.id.slice(0,6)}`);
  }

  console.log('--------------------------------------------------');
}
