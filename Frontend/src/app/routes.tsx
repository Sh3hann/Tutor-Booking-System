import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { StudentSignup } from "./pages/StudentSignup";
import { StudentLogin } from "./pages/StudentLogin";
import { StudentDashboard } from "./pages/StudentDashboard";
import { TutorSignupStep1 } from "./pages/TutorSignupStep1";
import { TutorSignupStep2 } from "./pages/TutorSignupStep2";
import { TutorSignupStep3 } from "./pages/TutorSignupStep3";
import { TutorLogin } from "./pages/TutorLogin";
import { TutorDashboard } from "./pages/TutorDashboard";
import { TutorProfile } from "./pages/TutorProfileNew";
import { TutorCategories } from "./pages/TutorCategories";
import { TutorAddSubjects } from "./pages/TutorAddSubjects";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminAccountsPage } from "./pages/AdminAccountsPage";
import { AdminSubjectsPage } from "./pages/AdminSubjectsPage";
import { AdminTutorsPage } from "./pages/AdminTutorsPage";
import { AdminTutorRequestsPage } from "./pages/AdminTutorRequestsPage";
import { AdminReviewsPage } from "./pages/AdminReviewsPage";
import { AdminQuizzesPage } from "./pages/AdminQuizzesPage";
import { SearchTutors } from "./pages/SearchTutors";
import { ChatPage } from "./pages/ChatPage";
import { ConversationsPage } from "./pages/ConversationsPage";
import { ChatTutorsPage } from "./pages/ChatTutorsPage";
import { TutorRequestsPage } from "./pages/TutorRequestsPage";
import { TutorPlansPage } from "./pages/TutorPlansPage";
import { TutorSubscribePage } from "./pages/TutorSubscribePage";
import { ChatRequestListener } from "./components/ChatRequestListener";
import { TutorPublicProfile } from "./pages/TutorPublicProfile";
import { StudentBookingsPage } from "./pages/StudentBookingsPage";
import { StudentBookingHistoryPage } from "./pages/StudentBookingHistoryPage";
import { TutorBookingsPage } from "./pages/TutorBookingsPage";
import { TutorBookingHistoryPage } from "./pages/TutorBookingHistoryPage";
import { TutorFinancialsPage } from "./pages/TutorFinancialsPage";
import { AdminFinancialsPage } from "./pages/AdminFinancialsPage";
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { BrainQuizPage } from "./pages/BrainQuizPage";
import { ChatBotWidget } from "./components/chatbot/ChatBotWidget";
import { TutorLearningMaterialsPage } from "./pages/TutorLearningMaterialsPage";
import { StudentLearningPage } from "./pages/StudentLearningPage";
import { AdminInstitutesPage } from "./pages/AdminInstitutesPage";
import { InstitutePage } from "./pages/InstitutePage";
import { InstitutesListPage } from "./pages/InstitutesListPage";
import { InstituteSettingsPage } from "./pages/InstituteSettingsPage";
import { InstituteRegisterPage } from "./pages/InstituteRegisterPage";
import { InstituteLogin } from "./pages/InstituteLogin";
import { InstituteDashboard } from "./pages/InstituteDashboard";

function RootLayout() {
  return (
    <>
      <ChatRequestListener />
      <ChatBotWidget />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", Component: LandingPage },
      // ── Student ──
      { path: "/student/signup", Component: StudentSignup },
      { path: "/student/login", Component: StudentLogin },
      { path: "/student/dashboard", Component: StudentDashboard },
      { path: "/student/search", Component: SearchTutors },
      { path: "/student/bookings", Component: StudentBookingsPage },
      { path: "/student/booking-history", Component: StudentBookingHistoryPage },
      { path: "/student/profile", Component: StudentProfilePage },
      { path: "/student/quiz", Component: BrainQuizPage },
      { path: "/student/tutor/:tutorId", Component: TutorPublicProfile },
      { path: "/student/tutors", Component: ChatTutorsPage },
      { path: "/student/learning/:tutorId", Component: StudentLearningPage },
      // Chat routes: by tutor ID (opens or creates a thread)
      { path: "/student/chat/tutor/:tutorId", Component: ChatPage },
      { path: "/student/chat/:tutorId", Component: ChatPage },
      { path: "/student/conversations", Component: ConversationsPage },
      // ── Shared chat thread route ──
      { path: "/chat/:threadId", Component: ChatPage },
      // ── Tutor ──
      { path: "/tutor/signup", element: <Navigate to="/tutor/signup-step1" replace /> },
      { path: "/tutor/signup-step1", Component: TutorSignupStep1 },
      { path: "/tutor/signup-step2", Component: TutorSignupStep2 },
      { path: "/tutor/signup-step3", Component: TutorSignupStep3 },
      { path: "/tutor/login", Component: TutorLogin },
      { path: "/tutor/dashboard", Component: TutorDashboard },
      { path: "/tutor/profile", Component: TutorProfile },
      { path: "/tutor/add-subjects", Component: TutorAddSubjects },
      { path: "/tutor/categories", Component: TutorCategories },
      { path: "/tutor/requests", Component: TutorRequestsPage },
      { path: "/tutor/bookings", Component: TutorBookingsPage },
      { path: "/tutor/booking-history", Component: TutorBookingHistoryPage },
      { path: "/tutor/financials", Component: TutorFinancialsPage },
      { path: "/tutor/plans", Component: TutorPlansPage },
      { path: "/tutor/subscribe", Component: TutorSubscribePage },
      { path: "/tutor/materials", Component: TutorLearningMaterialsPage },
      { path: "/tutor/chat/:tutorId", Component: ChatPage },
      { path: "/tutor/conversations", Component: ConversationsPage },
      // ── Admin ──
      { path: "/admin/login", Component: AdminLogin },
      { path: "/admin/dashboard", Component: AdminDashboard },
      { path: "/admin/accounts", Component: AdminAccountsPage },
      { path: "/admin/subjects", Component: AdminSubjectsPage },
      { path: "/admin/tutors", element: <Navigate to="/admin/accounts" replace /> },
      { path: "/admin/tutor-requests", Component: AdminTutorRequestsPage },
      { path: "/admin/reviews", Component: AdminReviewsPage },
      { path: "/admin/financials", Component: AdminFinancialsPage },
      { path: "/admin/quizzes", Component: AdminQuizzesPage },
      { path: "/admin/institutes", Component: AdminInstitutesPage },
      // ── Public Institutes ──
      { path: "/institutes",               Component: InstitutesListPage },
      { path: "/institute/register",        Component: InstituteRegisterPage },
      { path: "/institute/login",           Component: InstituteLogin },
      { path: "/institute/dashboard",       Component: InstituteDashboard },
      { path: "/institute/:id",             Component: InstitutePage },
      { path: "/institute/:id/settings",    Component: InstituteSettingsPage },
      // ── 404 Fallback ──
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);