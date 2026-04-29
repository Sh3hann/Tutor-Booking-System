import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ChatAuthProvider } from './contexts/ChatAuthContext';
import { TutorOnboardingProvider } from './contexts/TutorOnboardingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useEffect } from 'react';
import { adminAPI } from './utils/api';
import { setMasterSubjects } from './data/subjectsStore';

export default function App() {
  useEffect(() => {
    // Fetch latest master subjects from backend on app load
    adminAPI.getPublicSubjects().then((data: any) => {
      if (data && data.categories && data.subjectsByCategory) {
        setMasterSubjects(data);
      }
    }).catch(err => {
      console.error('Failed to sync master subjects', err);
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatAuthProvider>
          <TutorOnboardingProvider>
            <RouterProvider router={router} />
            <Toaster />
          </TutorOnboardingProvider>
        </ChatAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}