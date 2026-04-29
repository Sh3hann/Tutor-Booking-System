import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { StepProgressIndicator } from '../components/StepProgressIndicator';
import { useTutorOnboarding } from '../contexts/TutorOnboardingContext';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Basic Info' },
  { number: 3, label: 'Subjects & Qualifications' },
];

export function TutorSignupStep2() {
  const navigate = useNavigate();
  const { data, setData } = useTutorOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data.email) {
      navigate('/tutor/signup-step1');
    }
  }, [data.email, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = 'Full Name is required';
    if (!data.photo) newErrors.photo = 'Profile Photo is required';
    if (!data.hourlyRate.trim()) newErrors.hourlyRate = 'Hourly Rate is required';
    else if (isNaN(parseFloat(data.hourlyRate)) || parseFloat(data.hourlyRate) < 0) {
      newErrors.hourlyRate = 'Please enter a valid hourly rate';
    }
    if (!data.contactPhone.trim()) newErrors.contactPhone = 'Contact Phone is required';
    if (!data.location.trim()) newErrors.location = 'Location(s) is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setData({ photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    navigate('/tutor/signup-step3');
  };

  const handleBack = () => {
    navigate('/tutor/signup-step1');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 page-enter">
      <div className="w-full max-w-2xl">
        <StepProgressIndicator currentStep={2} steps={STEPS} />

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Basic Information</CardTitle>
            <CardDescription>Tell students about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNext} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={data.name}
                  onChange={(e) => setData({ name: e.target.value })}
                  className={errors.name ? 'border-red-500' : ''}
                />
                <p className="text-xs text-white/50">Auto-filled from Step 1</p>
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={data.email} disabled className="bg-white/5" />
                <p className="text-xs text-white/50">Stored from Step 1 (not editable)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Profile Photo *</Label>
                <div className="flex items-center gap-4">
                  {data.photo && (
                    <img src={data.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className={errors.photo ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-white/50 mt-1">Maximum file size: 2MB</p>
                  </div>
                </div>
                {errors.photo && <p className="text-sm text-red-500">{errors.photo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell students about your teaching experience and approach..."
                  rows={4}
                  value={data.bio}
                  onChange={(e) => setData({ bio: e.target.value })}
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
                    value={data.hourlyRate}
                    onChange={(e) => setData({ hourlyRate: e.target.value })}
                    className={errors.hourlyRate ? 'border-red-500' : ''}
                  />
                  {errors.hourlyRate && <p className="text-sm text-red-500">{errors.hourlyRate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    required
                    placeholder="e.g., +94 77 123 4567"
                    value={data.contactPhone}
                    onChange={(e) => setData({ contactPhone: e.target.value })}
                    className={errors.contactPhone ? 'border-red-500' : ''}
                  />
                  {errors.contactPhone && <p className="text-sm text-red-500">{errors.contactPhone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location(s) *</Label>
                <Input
                  id="location"
                  required
                  placeholder="e.g., Colombo, Kandy"
                  value={data.location}
                  onChange={(e) => setData({ location: e.target.value })}
                  className={errors.location ? 'border-red-500' : ''}
                />
                <p className="text-xs text-white/50">For physical classes - enter your teaching locations</p>
                {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timetable">Available Time Slots</Label>
                <Textarea
                  id="timetable"
                  placeholder="e.g., Weekdays: 4 PM - 8 PM, Weekends: 9 AM - 5 PM"
                  rows={3}
                  value={data.timetable}
                  onChange={(e) => setData({ timetable: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Next
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
