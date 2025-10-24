import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { supabase } from '../../shared/lib/supabase';
import { FallDetectionProvider } from '../../shared/hooks/useFallDetection';
import OnboardingEmail from './pages/OnboardingEmail';
import OnboardingProfile from './pages/OnboardingProfile';
import WorkerHome from './pages/WorkerHome';
import DailyCheckIn from './pages/DailyCheckIn';
import IncidentReport from './pages/IncidentReport';
import IncidentHistory from './pages/IncidentHistory';
import Training from './pages/Training';
import LessonDetail from './pages/LessonDetail';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';

export default function WorkerApp() {
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
        .from('worker_profiles')
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
        <Route path="/" element={<OnboardingEmail />} />
        <Route path="*" element={<Navigate to="/worker" replace />} />
      </Routes>
    );
  }

  // If authenticated but profile not complete, show profile setup
  if (profileExists === false) {
    return (
      <Routes>
        <Route path="/complete-profile" element={<OnboardingProfile />} />
        <Route path="*" element={<Navigate to="/worker/complete-profile" replace />} />
      </Routes>
    );
  }

  // If authenticated but not a worker, show error
  if (userRole && userRole !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">This portal is for workers only</p>
        </div>
      </div>
    );
  }

  return (
    <FallDetectionProvider>
      <Routes>
        <Route path="/complete-profile" element={<OnboardingProfile />} />
        <Route path="/home" element={<WorkerHome />} />
        <Route path="/check-in" element={<DailyCheckIn />} />
        <Route path="/incident" element={<IncidentReport />} />
        <Route path="/incident-history" element={<IncidentHistory />} />
        <Route path="/training" element={<Training />} />
        <Route path="/training/:lessonId" element={<LessonDetail />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Navigate to="/worker/home" replace />} />
        <Route path="*" element={<Navigate to="/worker/home" replace />} />
      </Routes>
    </FallDetectionProvider>
  );
}
