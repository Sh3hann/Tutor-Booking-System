/**
 * TutorAddSubjects - Subject management for tutors
 * Tutors assign subjects they teach (Maths, Science, ICT, etc.) per category/stream.
 * Uses SUBJECT_CATEGORIES and SUBJECTS_BY_CATEGORY from subjects.ts.
 * See docs/CATEGORIES_SUBJECTS_FLOW.md for full flow.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { getCurrentUser, tutorAPI } from '../utils/api';
import { toast } from 'sonner';
import { MEDIUMS, CLASS_TYPES, CLASS_FORMATS } from '../data/subjects';
import { getEffectiveCategories, getEffectiveSubjectsByCategory } from '../data/subjectsStore';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface SubjectSelection {
  category: string;
  subject: string;
  mediums: string[];
}

interface Qualification {
  title: string;
  photo: string;
}

export function TutorAddSubjects() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

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
  });

  const [newQualification, setNewQualification] = useState({ title: '', photo: '' });
  const [newSubject, setNewSubject] = useState({
    category: '',
    subject: '',
    mediums: [] as string[],
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/tutor/login');
        return;
      }

      const result = await tutorAPI.getMyProfile();
      const profile = result?.profile;

      if (profile) {
        setFormData({
          name: profile.name || '',
          bio: profile.bio || '',
          photo: profile.photoUrl || '',
          hourlyRate: profile.hourlyRate?.toString() || '',
          location: profile.location || '',
          contactPhone: profile.contactPhone || '',
          qualifications: profile.qualifications || [],
          subjects: profile.subjects || [],
          classTypes: profile.classTypes || [],
          classFormats: profile.classFormats || [],
          timetable: profile.timetable || '',
        });
      } else {
        setFormData((prev) => ({ ...prev, name: user.user_metadata?.name || '' }));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      const user = await getCurrentUser();
      if (user) {
        setFormData((prev) => ({ ...prev, name: user.user_metadata?.name || '' }));
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleQualificationPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Certificate must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewQualification((prev) => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddQualification = () => {
    if (!newQualification.title.trim()) {
      toast.error('Please enter qualification title');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { ...newQualification }],
    }));
    setNewQualification({ title: '', photo: '' });
  };

  const handleRemoveQualification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const handleAddSubject = () => {
    if (!newSubject.category || !newSubject.subject) {
      toast.error('Please select both category and subject');
      return;
    }

    if (newSubject.mediums.length === 0) {
      toast.error('Please select at least one teaching medium');
      return;
    }

    const exists = formData.subjects.some(
      (s) => s.category === newSubject.category && s.subject === newSubject.subject
    );

    if (exists) {
      toast.error('This subject is already added');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { ...newSubject }],
    }));

    setNewSubject({ category: '', subject: '', mediums: [] });
  };

  const handleRemoveSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const toggleMedium = (medium: string) => {
    setNewSubject((prev) => ({
      ...prev,
      mediums: prev.mediums.includes(medium)
        ? prev.mediums.filter((m) => m !== medium)
        : [...prev.mediums, medium],
    }));
  };

  const toggleClassType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      classTypes: prev.classTypes.includes(type)
        ? prev.classTypes.filter((t) => t !== type)
        : [...prev.classTypes, type],
    }));
  };

  const toggleClassFormat = (format: string) => {
    setFormData((prev) => ({
      ...prev,
      classFormats: prev.classFormats.includes(format)
        ? prev.classFormats.filter((f) => f !== format)
        : [...prev.classFormats, format],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    if (formData.classTypes.length === 0) {
      toast.error('Please select at least one class type');
      return;
    }

    if (formData.classFormats.length === 0) {
      toast.error('Please select at least one class format');
      return;
    }

    setLoading(true);

    try {
      await tutorAPI.createProfile({
        name: formData.name,
        bio: formData.bio,
        photo: formData.photo,
        photoUrl: formData.photo,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        location: formData.location,
        contactPhone: formData.contactPhone,
        qualifications: formData.qualifications,
        subjects: formData.subjects,
        classTypes: formData.classTypes,
        classFormats: formData.classFormats,
        timetable: formData.timetable,
      });

      toast.success('Subjects updated successfully!');
      navigate('/tutor/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update subjects');
    } finally {
      setLoading(false);
    }
  };

  const effectiveCategories = getEffectiveCategories();
  const effectiveSubjectsByCategory = getEffectiveSubjectsByCategory();
  const availableSubjects = newSubject.category ? effectiveSubjectsByCategory[newSubject.category] || [] : [];

  if (loadingProfile) {
    return (
      <div className="min-h-screen ">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/tutor/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-white">Edit Subjects</h1>
        </div>

        <p className="text-white/70 mb-8">
          Manage your teaching subjects, qualifications, and class formats.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
              <CardDescription>Add your educational background and certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-3 border-t pt-4">
                <Label>Add Qualification</Label>
                <Input
                  placeholder="Degree/Certification Title"
                  value={newQualification.title}
                  onChange={(e) => setNewQualification((prev) => ({ ...prev, title: e.target.value }))}
                />
                <div className="flex items-center gap-4">
                  {newQualification.photo && (
                    <img src={newQualification.photo} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <Input type="file" accept="image/*" onChange={handleQualificationPhotoUpload} />
                    <p className="text-xs text-white/50 mt-1">Optional: Upload certificate</p>
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
              <CardTitle>Subjects *</CardTitle>
              <CardDescription>Add subjects you teach with teaching mediums</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.subjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Subjects:</Label>
                  <div className="space-y-2">
                    {formData.subjects.map((subj, index) => {
                      const categoryLabel = effectiveCategories.find((c) => c.value === subj.category)?.label;
                      const mediumLabels = subj.mediums
                        .map((m) => MEDIUMS.find((med) => med.value === m)?.label)
                        .join(', ');
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">
                              {categoryLabel} - {subj.subject}
                            </p>
                            <p className="text-sm text-white/70">Mediums: {mediumLabels}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveSubject(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t pt-4">
                <Label>Add New Subject</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade Level / Category</Label>
                    <Select
                      value={newSubject.category}
                      onValueChange={(value) => setNewSubject({ category: value, subject: '', mediums: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {effectiveCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={newSubject.subject}
                      onValueChange={(value) => setNewSubject((prev) => ({ ...prev, subject: value }))}
                      disabled={!newSubject.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubjects.map((subj) => (
                          <SelectItem key={subj} value={subj}>
                            {subj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Teaching Medium *</Label>
                  <div className="flex flex-wrap gap-3">
                    {MEDIUMS.map((medium) => (
                      <div key={medium.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`medium-${medium.value}`}
                          checked={newSubject.mediums.includes(medium.value)}
                          onCheckedChange={() => toggleMedium(medium.value)}
                        />
                        <Label
                          htmlFor={`medium-${medium.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {medium.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="button" variant="outline" onClick={handleAddSubject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </div>
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

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/tutor/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
