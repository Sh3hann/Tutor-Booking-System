import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { StepProgressIndicator } from '../components/StepProgressIndicator';
import { useTutorOnboarding } from '../contexts/TutorOnboardingContext';
import { toast } from 'sonner';

const STEPS = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Basic Info' },
  { number: 3, label: 'Subjects & Qualifications' },
];

export function TutorSignupStep1() {
  const navigate = useNavigate();
  const { data, setData } = useTutorOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = 'Full Name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Please enter a valid email';
    if (!data.password) newErrors.password = 'Password is required';
    else if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setData({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
    navigate('/tutor/signup-step2');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 page-enter">
      <div className="w-full max-w-md">
        <StepProgressIndicator currentStep={1} steps={STEPS} />

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tutor Sign Up</CardTitle>
            <CardDescription>Create your tutor account to start teaching</CardDescription>
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
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => setData({ email: e.target.value })}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={data.password}
                  onChange={(e) => setData({ password: e.target.value })}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Next
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link to="/tutor/login" className="text-indigo-600 hover:underline">
                Login
              </Link>
            </div>
            <div className="mt-2 text-center">
              <Link to="/" className="text-sm text-white/70 hover:underline">
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
