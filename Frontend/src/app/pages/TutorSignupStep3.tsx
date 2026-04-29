/**
 * TutorSignupSubjectsStep - Final signup step: Subjects & Qualifications.
 * Tutors select subjects, teaching medium, class types/formats, and qualifications
 * ONLY during signup. After profile creation they cannot change subjects.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { StepProgressIndicator } from '../components/StepProgressIndicator';
import { useTutorOnboarding } from '../contexts/TutorOnboardingContext';
import { registerTutor } from '../utils/tutorRegisterApi';
import { getEffectiveCategories, getEffectiveSubjectsByCategory } from '../data/subjectsStore';
import { MEDIUMS, CLASS_TYPES, CLASS_FORMATS } from '../data/subjects';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Basic Info' },
  { number: 3, label: 'Subjects & Qualifications' },
];

export function TutorSignupStep3() {
  const navigate = useNavigate();
  const { data, setData, resetData } = useTutorOnboarding();
  const [loading, setLoading] = useState(false);
  const [newQualification, setNewQualification] = useState({ title: '', photo: '' });
  const [newSubject, setNewSubject] = useState({
    category: '',
    subject: '',
    mediums: [] as string[],
  });

  const categories = getEffectiveCategories();
  const subjectsByCategory = getEffectiveSubjectsByCategory();

  useEffect(() => {
    if (!data.email) {
      navigate('/tutor/signup-step1');
    }
  }, [data.email, navigate]);

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
    setData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { ...newQualification }],
    }));
    setNewQualification({ title: '', photo: '' });
  };

  const handleRemoveQualification = (index: number) => {
    setData((prev) => ({
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
    const exists = data.subjects.some(
      (s) => s.category === newSubject.category && s.subject === newSubject.subject
    );
    if (exists) {
      toast.error('This subject is already added');
      return;
    }
    setData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { ...newSubject }],
    }));
    // Keep category selected so multiple subjects in same grade can be added quickly
    setNewSubject((prev) => ({ category: prev.category, subject: '', mediums: [] }));
  };

  const handleRemoveSubject = (index: number) => {
    setData((prev) => ({
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
    setData((prev) => ({
      ...prev,
      classTypes: prev.classTypes.includes(type)
        ? prev.classTypes.filter((t) => t !== type)
        : [...prev.classTypes, type],
    }));
  };

  const toggleClassFormat = (format: string) => {
    setData((prev) => ({
      ...prev,
      classFormats: prev.classFormats.includes(format)
        ? prev.classFormats.filter((f) => f !== format)
        : [...prev.classFormats, format],
    }));
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }
    if (data.classTypes.length === 0) {
      toast.error('Please select at least one class type');
      return;
    }
    if (data.classFormats.length === 0) {
      toast.error('Please select at least one class format');
      return;
    }

    setLoading(true);
    try {
      const result = await registerTutor({
        email: data.email,
        password: data.password,
        fullName: data.name,
        name: data.name,
        bio: data.bio,
        photo: data.photo,
        photoUrl: data.photo,
        hourlyRate: parseFloat(data.hourlyRate) || 0,
        location: data.location,
        contactPhone: data.contactPhone,
        timetable: data.timetable,
        qualifications: data.qualifications,
        subjects: data.subjects,
        classTypes: data.classTypes,
        classFormats: data.classFormats,
      });
      if (result.token && result.user) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      toast.success('Tutor profile submitted for admin approval.');
      resetData();
      navigate('/tutor/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit tutor profile');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableSubjects = newSubject.category ? (subjectsByCategory[newSubject.category] || []) : [];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 page-enter">
      <div className="w-full max-w-2xl">
        <StepProgressIndicator currentStep={3} steps={STEPS} />

        <form onSubmit={handleCreateProfile} className="space-y-6">
          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
              <CardDescription>Add your educational background and certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.qualifications.length > 0 && (
                <div className="space-y-2">
                  {data.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {qual.photo && (
                        <img src={qual.photo} alt="Qualification" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{qual.title}</p>
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveQualification(index)}>
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
              <CardDescription>Add subjects you teach with teaching mediums (cannot be changed after signup)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.subjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Subjects:</Label>
                  <div className="space-y-2">
                    {data.subjects.map((subj, index) => {
                      const categoryLabel = categories.find((c) => c.value === subj.category)?.label;
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
                          <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveSubject(index)}>
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
                        {categories.map((cat) => (
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
                        <Label htmlFor={`medium-${medium.value}`} className="text-sm font-normal cursor-pointer">
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
                        checked={data.classTypes.includes(type.value)}
                        onCheckedChange={() => toggleClassType(type.value)}
                      />
                      <Label htmlFor={`type-${type.value}`} className="text-sm font-normal cursor-pointer">
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
                        checked={data.classFormats.includes(format.value)}
                        onCheckedChange={() => toggleClassFormat(format.value)}
                      />
                      <Label htmlFor={`format-${format.value}`} className="text-sm font-normal cursor-pointer">
                        {format.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/tutor/signup-step2')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
