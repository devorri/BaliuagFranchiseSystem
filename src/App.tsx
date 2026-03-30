import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeedbackPage } from './pages/FeedbackPage';

// Operator pages
import { OperatorDashboard } from './pages/operator/OperatorDashboard';
import { ApplicationForm } from './pages/operator/ApplicationForm';
import { MyApplications } from './pages/operator/MyApplications';
import { PaymentPage } from './pages/operator/PaymentPage';
import { ProfilePage } from './pages/operator/ProfilePage';
import { ReceiptsPage } from './pages/operator/ReceiptsPage';
import { StatusTracker } from './pages/operator/StatusTracker';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ApplicationReview } from './pages/admin/ApplicationReview';
import { FranchiseRegistry } from './pages/admin/FranchiseRegistry';
import { DriverMonitoring } from './pages/admin/DriverMonitoring';
import { FeeManagement } from './pages/admin/FeeManagement';
import { FeedbackReview } from './pages/admin/FeedbackReview';
import { Reports } from './pages/admin/Reports';

// Passenger pages
import { PassengerDashboard } from './pages/passenger/PassengerDashboard';
import { PassengerFeedback } from './pages/passenger/PassengerFeedback';
import { PassengerProfile } from './pages/passenger/PassengerProfile';
import { DriverPublicProfile } from './pages/DriverPublicProfile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/driver/:driverId" element={<DriverPublicProfile />} />

            {/* Operator Routes */}
            <Route path="/dashboard" element={<DashboardLayout requiredRole="operator" />}>
              <Route index element={<OperatorDashboard />} />
              <Route path="apply" element={<ApplicationForm />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="payments" element={<PaymentPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="receipts" element={<ReceiptsPage />} />
              <Route path="status" element={<StatusTracker />} />
            </Route>

            {/* Passenger Routes */}
            <Route path="/passenger" element={<DashboardLayout requiredRole="passenger" />}>
              <Route index element={<PassengerDashboard />} />
              <Route path="scan" element={<PassengerDashboard />} />
              <Route path="feedback" element={<PassengerFeedback />} />
              <Route path="feedback/:driverId" element={<PassengerFeedback />} />
              <Route path="history" element={<PassengerDashboard />} />
              <Route path="profile" element={<PassengerProfile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="applications" element={<ApplicationReview />} />
              <Route path="franchises" element={<FranchiseRegistry />} />
              <Route path="drivers" element={<DriverMonitoring />} />
              <Route path="fees" element={<FeeManagement />} />
              <Route path="feedback" element={<FeedbackReview />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
