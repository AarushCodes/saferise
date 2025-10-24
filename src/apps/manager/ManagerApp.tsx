import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { supabase } from '../../shared/lib/supabase';
import ManagerOnboarding from './pages/ManagerOnboarding';
import ManagerProfileSetup from './pages/ManagerProfileSetup';
import ManagerDashboard from './pages/ManagerDashboard';
import CheckIns from './pages/CheckIns';
import Incidents from './pages/Incidents';
import Alerts from './pages/Alerts';
import TrainingProgress from './pages/TrainingProgress';
import Reports from './pages/Reports';
import JobManagement from './pages/JobManagement';
import WorkerDirectory from './pages/WorkerDirectory';

export default function ManagerApp() {
  const { user, userRole, loading } = useAuth();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  useEffect(() => {
    checkProfile();
  }, [user]);

  async function checkProfile() {
    if (!user) {
      setProfileExists(null);
      return;
    }

    try {
      const { data } = await supabase
        .from('manager_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfileExists(!!data);
    } catch (err) {
      console.error('Error checking profile:', err);
      setProfileExists(false);
    }
  }

  if (loading || (user && profileExists === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show onboarding
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<ManagerOnboarding />} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Routes>
    );
  }

  // If authenticated but profile not complete, show profile setup
  if (profileExists === false) {
    return (
      <Routes>
        <Route path="/complete-profile" element={<ManagerProfileSetup />} />
        <Route path="*" element={<Navigate to="/manager/complete-profile" replace />} />
      </Routes>
    );
  }

  if (userRole && userRole !== 'manager') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">This portal is for managers only</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/complete-profile" element={<ManagerProfileSetup />} />
      <Route path="/" element={<ManagerDashboard />} />
      <Route path="/check-ins" element={<CheckIns />} />
      <Route path="/incidents" element={<Incidents />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/training" element={<TrainingProgress />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/jobs" element={<JobManagement />} />
      <Route path="/workers" element={<WorkerDirectory />} />
      <Route path="*" element={<Navigate to="/manager" replace />} />
    </Routes>
  );
}
