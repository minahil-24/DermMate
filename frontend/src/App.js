import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import Onboarding from './pages/Onboarding'


// Patient Pages
import PatientDashboard from './pages/Patient/PatientDashboard'
import ComplaintSelection from './pages/Patient/ComplaintSelection'
import Questionnaire from './pages/Patient/Questionnaire'
import ImageUpload from './pages/Patient/ImageUpload'
import AIDetection from './pages/Patient/AIDetection'
import DermatologistSearch from './pages/Patient/DermatologistSearch'
import AppointmentBooking from './pages/Patient/AppointmentBooking'
import PreAppointmentSubmission from './pages/Patient/PreAppointmentSubmission'
import FollowUp from './pages/Patient/FollowUp'
import MedicalRecords from './pages/Patient/MedicalRecords'
import TreatmentPlan from './pages/Patient/TreatmentPlan'
import Notifications from './pages/Patient/Notifications'
import ClinicsDiscovery from './pages/Patient/ClinicsDiscovery'
import PatientProfile from './pages/Patient/PatientProfile'
import PatientCases from './pages/Patient/PatientCases'
import PatientAppointments from './pages/Patient/PatientAppointments'
import Payment from './pages/Patient/Payment'
import AlopeciaDetection from './pages/Patient/AlopeciaDetection'

// Dermatologist Pages
import DermatologistDashboard from './pages/Dermatologist/DermatologistDashboard'
import CertificationUpload from './pages/Dermatologist/CertificationUpload'
import DermatologistAppointments from './pages/Dermatologist/DermatologistAppointments'
import PatientCaseViewer from './pages/Dermatologist/PatientCaseViewer'
import ImageManagement from './pages/Dermatologist/ImageManagement'
import ClinicalNotes from './pages/Dermatologist/ClinicalNotes'
import TreatmentPlanning from './pages/Dermatologist/TreatmentPlanning'
import FollowUpScheduling from './pages/Dermatologist/FollowUpScheduling'
import DermatologistNotifications from './pages/Dermatologist/DermatologistNotifications'
import DermatologistProfile from './pages/Dermatologist/DermatologistProfile'
import PatientChat from './pages/Dermatologist/PatientChat'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import DermatologistVerification from './pages/admin/DermatologistVerification'
import AIModelManagement from './pages/admin/AIModelManagement'
import ReportsAnalytics from './pages/admin/ReportsAnalytics'
import BroadcastNotifications from './pages/admin/BroadcastNotifications'
import SystemRevenue from './pages/admin/SystemRevenue'

// System Pages
import ImageValidation from './pages/system/ImageValidation'
import MultiAngleValidation from './pages/system/MultiAngleValidation'
import CaseStructuring from './pages/system/CaseStructuring'
import AIInference from './pages/system/AIInference'
import SpeechToText from './pages/system/SpeechToText'
import ReminderAutomation from './pages/system/ReminderAutomation'
import ActivityLogs from './pages/system/ActivityLogs'
import SystemReports from './pages/system/SystemReports'

function App() {
  const { isAuthenticated, role } = useAuthStore()

  // Zustand persist middleware handles localStorage automatically
  // No need for manual localStorage checking

  return (
    <Router>
      <Routes>
        {/* Redirect */}
        <Route path="/" element={<Navigate to={isAuthenticated ? `/dashboard/${role}` : '/login'} replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          {/* Patient Routes */}
          <Route
            path="/dashboard/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/complaint"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <ComplaintSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/questionnaire"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Questionnaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/upload"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <ImageUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/alopecia-detection"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AlopeciaDetection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/ai-detection"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AIDetection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/dermatologists"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DermatologistSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointment-booking"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AppointmentBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/pre-appointment"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PreAppointmentSubmission />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/follow-up"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <FollowUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/records"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MedicalRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/treatment"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <TreatmentPlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/notifications"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/clinics"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <ClinicsDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/cases"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientCases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/payment"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientAppointments />
              </ProtectedRoute>
            }
          />

          {/* Dermatologist Routes */}
          <Route
            path="/dashboard/dermatologist"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <DermatologistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/certification"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <CertificationUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/appointments"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <DermatologistAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/cases"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <PatientCaseViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/pcases/:id"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <PatientChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dermatologist/images"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <ImageManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/notes"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <ClinicalNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/treatment"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <TreatmentPlanning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/follow-up"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <FollowUpScheduling />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/notifications"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <DermatologistNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/profile"
            element={
              <ProtectedRoute allowedRoles={['dermatologist']}>
                <DermatologistProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DermatologistVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-models"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AIModelManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportsAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BroadcastNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-revenue"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemRevenue />
              </ProtectedRoute>
            }
          />


          {/* System Routes */}
          <Route
            path="/system/image-validation"
            element={<ImageValidation />}
          />
          <Route
            path="/system/multi-angle"
            element={<MultiAngleValidation />}
          />
          <Route
            path="/system/case-structuring"
            element={<CaseStructuring />}
          />
          <Route
            path="/system/ai-inference"
            element={<AIInference />}
          />
          <Route
            path="/system/speech-to-text"
            element={<SpeechToText />}
          />
          <Route
            path="/system/reminders"
            element={<ReminderAutomation />}
          />
          <Route
            path="/system/logs"
            element={<ActivityLogs />}
          />
          <Route
            path="/system/reports"
            element={<SystemReports />}
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
