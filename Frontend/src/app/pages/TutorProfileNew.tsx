import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { getCurrentUser, tutorAPI, instituteAPI } from '../utils/api';
import { toast } from 'sonner';
import { MEDIUMS, CLASS_TYPES, CLASS_FORMATS } from '../data/subjects';
import { getEffectiveCategories } from '../data/subjectsStore';
import { ArrowLeft, Plus, X, Video } from 'lucide-react';

// Convert a YouTube or Vimeo watch URL to an embeddable iframe src
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    // YouTube: youtube.com/watch?v=ID or youtu.be/ID or youtube.com/embed/ID
    const ytMatch =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/) ;
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    // Vimeo: vimeo.com/ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  } catch {
    // noop
  }
  return null;
}

interface SubjectSelection {
  category: string;
  subject: string;
  mediums: string[]; // english, sinhala, tamil
}

interface Qualification {
  title: string;
  photo: string; // base64 string
}

export function TutorProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    photo: '',
    hourlyRate: '',
    location: '',
    contactPhone: '',
    qualifications: [] as Qualification[],
    subjects: [] as SubjectSelection[],
    classTypes: [] as string[],
    classFormats: [] as string[],
    timetable: '',
    introVideoUrl: '',
    meetingLink: '',
    instituteId: 'none',
  });

  const [institutes, setInstitutes] = useState<any[]>([]);
  const [pendingJoinRequest, setPendingJoinRequest] = useState<any>(null);
  const [originalInstituteId, setOriginalInstituteId] = useState('none');

  const [newQualification, setNewQualification] = useState({ title: '', photo: '' });

  useEffect(() => {
    checkAuth();
    // Load institutes for dropdown
    instituteAPI.list().then(res => setInstitutes(res.institutes || [])).catch(() => {});
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        toast.error('Please login again');
        navigate('/tutor/login');
        return;
      }
      setUser(currentUser);
      // Pre-fill name from cached user while profile loads
      setFormData(prev => ({ ...prev, name: currentUser.user_metadata?.name || '' }));

      // Load existing profile from MongoDB via the authenticated /me/profile endpoint
      try {
        const profileResult = await tutorAPI.getMyProfile();
        if (profileResult?.profile) {
          const p = profileResult.profile;
          setFormData({
            name: p.name || p.fullName || currentUser.user_metadata?.name || '',
            bio: p.bio || '',
            photo: p.photoUrl || p.photo || '',
            hourlyRate: p.hourlyRate != null ? p.hourlyRate.toString() : '',
            location: p.location || '',
            contactPhone: p.contactPhone || '',
            qualifications: Array.isArray(p.qualifications) ? p.qualifications : [],
            subjects: Array.isArray(p.subjects) ? p.subjects : [],
            classTypes: Array.isArray(p.classTypes) ? p.classTypes : [],
            classFormats: Array.isArray(p.classFormats) ? p.classFormats : [],
            timetable: p.timetable || '',
            introVideoUrl: p.introVideoUrl || '',
            meetingLink: p.meetingLink || '',
            instituteId: p.instituteId || 'none',
          });
          setOriginalInstituteId(p.instituteId || 'none');
        }
        
        const joinReq = await instituteAPI.getMyJoinRequest().catch(() => null);
        if (joinReq?.request) {
          setPendingJoinRequest(joinReq.request);
        }
      } catch (profileError: any) {
        // Profile not found yet (e.g. brand-new tutor) — form stays blank, that's fine
        console.warn('Could not auto-fill profile (may be first time):', profileError?.message || profileError);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      toast.error('Authentication error. Please login again.');
      navigate('/tutor/login');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleQualificationPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewQualification({ ...newQualification, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddQualification = () => {
    if (!newQualification.title.trim()) {
      toast.error('Please enter qualification title');
      return;
    }

    setFormData({
      ...formData,
      qualifications: [...formData.qualifications, { ...newQualification }],
    });
    setNewQualification({ title: '', photo: '' });
  };

  const handleRemoveQualification = (index: number) => {
    const newQualifications = formData.qualifications.filter((_, i) => i !== index);
    setFormData({ ...formData, qualifications: newQualifications });
  };

  const toggleClassType = (type: string) => {
    const classTypes = formData.classTypes.includes(type)
      ? formData.classTypes.filter(t => t !== type)
      : [...formData.classTypes, type];
    setFormData({ ...formData, classTypes });
  };

  const toggleClassFormat = (format: string) => {
    const classFormats = formData.classFormats.includes(format)
      ? formData.classFormats.filter(f => f !== format)
      : [...formData.classFormats, format];
    setFormData({ ...formData, classFormats });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.classTypes.length === 0) {
        toast.error('Please select at least one class type');
        setLoading(false);
        return;
      }

      if (formData.classFormats.length === 0) {
        toast.error('Please select at least one class format');
        setLoading(false);
        return;
      }

      console.log('Submitting tutor profile...');
      const result = await tutorAPI.createProfile({
        name: formData.name,
        bio: formData.bio,
        photo: formData.photo,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        location: formData.location,
        contactPhone: formData.contactPhone,
        qualifications: formData.qualifications,
        subjects: formData.subjects,
        classTypes: formData.classTypes,
        classFormats: formData.classFormats,
        timetable: formData.timetable,
        introVideoUrl: formData.introVideoUrl,
        meetingLink: formData.meetingLink,
        instituteId: formData.instituteId === 'none' ? 'none' : originalInstituteId, // Don't allow forced overwrite of institute if they are joining
      });

      if (formData.instituteId !== 'none' && formData.instituteId !== originalInstituteId) {
        try {
          await instituteAPI.join(formData.instituteId);
          toast.success('Institute join request sent!');
        } catch (e: any) {
          toast.error(e.message || 'Failed to send institute join request.');
        }
      }

      console.log('Profile saved successfully:', result);
      toast.success('Profile saved successfully!');
      
      // Small delay to ensure user sees the success message
      setTimeout(() => {
        navigate('/tutor/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/tutor/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create/Update Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell students about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Profile Photo *</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', border: '3px solid rgba(14,165,233,0.35)', boxShadow: '0 0 0 2px rgba(14,165,233,0.12)' }}>
                    {formData.photo ? (
                      <img src={formData.photo} alt="Profile Photo" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{formData.name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 2MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell students about your teaching experience and approach..."
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (LKR) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="100"
                    required
                    placeholder="e.g., 2000"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    required
                    placeholder="e.g., +94 77 123 4567"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              {formData.instituteId === 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location(s) *</Label>
                  <Input
                    id="location"
                    required={formData.instituteId === 'none'}
                    placeholder="e.g., Colombo, Kandy"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">For physical classes - enter your teaching locations</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="timetable">Available Time Slots</Label>
                <Textarea
                  id="timetable"
                  placeholder="e.g., Weekdays: 4 PM - 8 PM, Weekends: 9 AM - 5 PM"
                  rows={3}
                  value={formData.timetable}
                  onChange={(e) => setFormData({ ...formData, timetable: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="introVideoUrl">Intro Video URL</Label>
                <Input
                  id="introVideoUrl"
                  type="url"
                  placeholder="e.g., https://youtube.com/watch?v=..."
                  value={formData.introVideoUrl}
                  onChange={(e) => setFormData({ ...formData, introVideoUrl: e.target.value })}
                />
                <p className="text-xs text-gray-500">Optional: Link to a YouTube/Vimeo intro video</p>
                {/* Live video preview */}
                {(() => {
                  const embedUrl = getEmbedUrl(formData.introVideoUrl);
                  return embedUrl ? (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <Video className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Video Preview</span>
                      </div>
                      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                        <iframe
                          src={embedUrl}
                          title="Intro Video Preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 'none' }}
                        />
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingLink">Online Meeting Link</Label>
                <Input
                  id="meetingLink"
                  type="url"
                  placeholder="e.g., https://meet.google.com/xxx-yyyy-zzz"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                />
                <p className="text-xs text-gray-500">Optional: Zoom, Google Meet, or Teams link for online classes</p>
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
              <CardDescription>Add your educational background and certifications with photos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Qualifications */}
              {formData.qualifications.length > 0 && (
                <div className="space-y-2">
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {qual.photo && (
                        <img src={qual.photo} alt="Qualification" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{qual.title}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveQualification(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Qualification */}
              <div className="space-y-3 border-t pt-4">
                <Label>Add Qualification</Label>
                <Input
                  placeholder="e.g., BSc in Mathematics, Teaching Certificate"
                  value={newQualification.title}
                  onChange={(e) => setNewQualification({ ...newQualification, title: e.target.value })}
                />
                <div className="flex items-center gap-4">
                  {newQualification.photo && (
                    <img src={newQualification.photo} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleQualificationPhotoUpload}
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: Upload certificate/degree photo</p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={handleAddQualification}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Qualification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle>Your Subjects</CardTitle>
              <CardDescription>Subjects you currently teach. Click "Edit Subjects" to add or remove.</CardDescription>
            </CardHeader>
            <CardContent>
              {formData.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.subjects.map((subj, index) => {
                    const categories = getEffectiveCategories();
                    const categoryLabel = categories.find(c => c.value === subj.category)?.label;
                    const mediumLabels = subj.mediums.map(m => MEDIUMS.find(med => med.value === m)?.label).join(', ');
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-800"
                      >
                        {categoryLabel} – {subj.subject}
                        {mediumLabels ? ` (${mediumLabels})` : ''}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No subjects added yet.</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tutor/add-subjects')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Edit Subjects
              </Button>
            </CardContent>
          </Card>


          {/* Class Types & Formats */}
          <Card>
            <CardHeader>
              <CardTitle>Class Types & Formats *</CardTitle>
              <CardDescription>Select how you conduct your classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Class Type</Label>
                <div className="flex flex-wrap gap-3">
                  {CLASS_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={formData.classTypes.includes(type.value)}
                        onCheckedChange={() => toggleClassType(type.value)}
                      />
                      <Label
                        htmlFor={`type-${type.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Class Format</Label>
                <div className="flex flex-wrap gap-3">
                  {CLASS_FORMATS.map((format) => (
                    <div key={format.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`format-${format.value}`}
                        checked={formData.classFormats.includes(format.value)}
                        onCheckedChange={() => toggleClassFormat(format.value)}
                      />
                      <Label
                        htmlFor={`format-${format.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {format.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Institute ── */}
          <Card>
            <CardHeader>
              <CardTitle>Institute</CardTitle>
              <CardDescription>Select an institute to send a join request, or choose "Independent" if you teach on your own.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institute">Institute Affiliation</Label>
                <select
                  id="institute"
                  value={formData.instituteId}
                  onChange={e => setFormData({ ...formData, instituteId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                  style={{ background: 'transparent', colorScheme: 'inherit' }}
                >
                  <option value="none">No Institute (Independent Tutor)</option>
                  {institutes.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
                {pendingJoinRequest && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(255,159,10,0.10)', border: '1px solid rgba(255,159,10,0.25)' }}>
                    <span style={{ color: '#FF9F0A' }}>⏳</span>
                    <p style={{ color: '#FF9F0A' }}>
                      Pending join request for <strong>{pendingJoinRequest.instituteName}</strong>. Waiting for manager approval.
                    </p>
                  </div>
                )}
                {originalInstituteId !== 'none' && formData.instituteId === originalInstituteId && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)' }}>
                    <span style={{ color: '#30D158' }}>✓</span>
                    <p style={{ color: '#30D158' }}>
                      You are already an approved tutor for <strong>{institutes.find(i => i.id === originalInstituteId)?.name || 'this institute'}</strong>.
                    </p>
                  </div>
                )}
                {formData.instituteId !== 'none' && formData.instituteId !== originalInstituteId && !pendingJoinRequest && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)' }}>
                    <span style={{ color: '#0A84FF' }}>ℹ</span>
                    <p style={{ color: '#0A84FF' }}>
                      Saving will send a new join request to this institute. You'll be notified when approved.
                    </p>
                  </div>
                )}
                {formData.instituteId === 'none' && !pendingJoinRequest && (
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    As an independent tutor, your own location will be shown on your profile.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/tutor/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}