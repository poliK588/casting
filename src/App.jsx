import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';


import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TalentDashboard from './pages/TalentDashboard';
import TalentProfilePage from './pages/TalentProfilePage';
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
          
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout type="admin" />}>
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['talent']} />}>
            <Route element={<DashboardLayout type="talent" />}>
              <Route path="/talent" element={<TalentDashboard />} />
              <Route path="/talent/profile" element={<TalentProfilePage />} />
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
