import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';


import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import TalentDashboard from './pages/TalentDashboard';
import TalentProfilePage from './pages/TalentProfilePage';
import TalentMediaPage from './pages/TalentMediaPage';
import TalentCastingsPage from './pages/TalentCastingsPage';
import TalentSchedulePage from './pages/TalentSchedulePage';
import TalentMessagesPage from './pages/TalentMessagesPage';
import TalentAccountPage from './pages/TalentAccountPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AddTalentModal from './components/modals/AddTalentModal';
import Toast from './components/shared/Toast';
import ProtectedRoute from './components/shared/ProtectedRoute';


export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout type="admin" />}>
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['talent']} />}>
            <Route element={<DashboardLayout type="talent" />}>
              <Route path="/talent" element={<TalentDashboard />} />
              <Route path="/talent/profile" element={<TalentProfilePage />} />
              <Route path="/talent/media" element={<TalentMediaPage />} />
              <Route path="/talent/castings" element={<TalentCastingsPage />} />
              <Route path="/talent/schedule" element={<TalentSchedulePage />} />
              <Route path="/talent/messages" element={<TalentMessagesPage />} />
              <Route path="/talent/account" element={<TalentAccountPage />} />
            </Route>
          </Route>
        </Routes>
        <AddTalentModal />
        <Toast />
      </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
