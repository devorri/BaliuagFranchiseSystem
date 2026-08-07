import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeedbackPage } from './pages/FeedbackPage';

// Driver pages
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverRequirements } from './pages/driver/DriverRequirements';
import { DriverInspection } from './pages/driver/DriverInspection';
import { DriverPayment } from './pages/driver/DriverPayment';
import { DriverTodaStatus } from './pages/driver/DriverTodaStatus';

// TODA President pages
import { TodaDashboard } from './pages/toda/TodaDashboard';
import { TodaApprovals } from './pages/toda/TodaApprovals';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ApplicationReview } from './pages/admin/ApplicationReview';
import { FranchiseRegistry } from './pages/admin/FranchiseRegistry';
import { PenaltyManagement } from './pages/admin/PenaltyManagement';
import { Reports } from './pages/admin/Reports';

// Operator pages
import { OperatorDashboard } from './pages/operator/OperatorDashboard';
import { SubmitRequirements } from './pages/operator/SubmitRequirements';
import { GCashPaymentModal } from './pages/operator/GCashPaymentModal';
import { FranchiseRenewal } from './pages/operator/FranchiseRenewal';
import { SMSNotifications } from './pages/operator/SMSNotifications';

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

            {/* Driver Routes */}
            <Route path="/driver" element={<DashboardLayout requiredRole="driver" />}>
              <Route index element={<DriverDashboard />} />
              <Route path="requirements" element={<DriverRequirements />} />
              <Route path="inspection" element={<DriverInspection />} />
              <Route path="payment" element={<DriverPayment />} />
              <Route path="toda-status" element={<DriverTodaStatus />} />
            </Route>

            {/* TODA President Routes */}
            <Route path="/toda" element={<DashboardLayout requiredRole="toda_president" />}>
              <Route index element={<TodaDashboard />} />
              <Route path="approvals" element={<TodaApprovals />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="applications" element={<ApplicationReview />} />
              <Route path="franchises" element={<FranchiseRegistry />} />
              <Route path="penalties" element={<PenaltyManagement />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Operator Routes */}
            <Route path="/dashboard" element={<DashboardLayout requiredRole="operator" />}>
              <Route index element={<OperatorDashboard />} />
              <Route path="requirements" element={<SubmitRequirements />} />
              <Route path="gcash-payment" element={<GCashPaymentModal />} />
              <Route path="renewal" element={<FranchiseRenewal />} />
              <Route path="sms-notifications" element={<SMSNotifications />} />
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
