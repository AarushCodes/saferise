import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Button } from '../../../shared/components';
import { FallAlertModal } from '../../../shared/components/FallAlertModal';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useFallDetection } from '../../../shared/hooks/useFallDetection';
import { supabase } from '../../../shared/lib/supabase';

export default function WorkerHome() {
  const { user, signOut } = useAuth();
  const { isMonitoring, startMonitoring, stopMonitoring, showAlert, dismissAlert, triggerEmergency, setWorkerId: setFallDetectionWorkerId, sosStatus, cancelSOS } = useFallDetection();
  const [workerId, setWorkerId] = useState('');
  const [todayCheckIn, setTodayCheckIn] = useState<any>(null);
  const [trainingComplete, setTrainingComplete] = useState(false);

  useEffect(() => {
    loadWorkerProfile();
    loadTodayCheckIn();
    loadTrainingStatus();
  }, [user]);

  async function loadWorkerProfile() {
    if (!user) return;

    const { data } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setWorkerId(data.id);
      // Set worker ID in fall detection context for manual SOS
      setFallDetectionWorkerId(data.id);
    } else {
      // Profile doesn't exist - redirect to complete onboarding
      console.warn('Worker profile not found');
    }
  }

  async function loadTodayCheckIn() {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: profile } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) return;

    const { data } = await supabase
      .from('daily_check_ins')
      .select('*')
      .eq('worker_id', profile.id)
      .gte('created_at', today.toISOString())
      .maybeSingle();

    setTodayCheckIn(data);
  }

  async function loadTrainingStatus() {
    if (!user) return;

    const { data: profile } = await supabase
      .from('worker_profiles')
      .select('id, is_certified')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) return;

    // Check if all 3 lessons are completed
    const { data: progress, count } = await supabase
      .from('training_progress')
      .select('*', { count: 'exact' })
      .eq('worker_id', profile.id)
      .eq('completed', true);

    setTrainingComplete((count || 0) >= 3 || profile.is_certified);
  }

  async function handleToggleMonitoring() {
    if (isMonitoring) {
      await stopMonitoring();
    } else {
      if (!workerId) {
        alert('Please complete your profile first by going back to /worker/profile');
        return;
      }
      await startMonitoring(workerId);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fall Alert Modal */}
      <FallAlertModal
        isOpen={showAlert}
        onSafe={dismissAlert}
        onEmergency={triggerEmergency}
      />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SafeRise</h1>
            <p className="text-sm text-gray-600">Good morning! 👷</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* SOS Status Display */}
        {sosStatus !== 'standby' && (
          <Card className={sosStatus === 'emergency' ? 'bg-red-100 border-2 border-red-500 animate-pulse' : 'bg-yellow-100 border-2 border-yellow-500'}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {sosStatus === 'emergency' ? '🚨' : '⚠️'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {sosStatus === 'emergency' ? 'SOS: EMERGENCY ACTIVE' : 'SOS: Alerting...'}
                    </h3>
                    <p className="text-sm text-gray-700">
                      {sosStatus === 'emergency'
                        ? 'Emergency alert sent. Siren playing. Help is on the way.'
                        : 'Sending emergency alert...'}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={cancelSOS}
                >
                  Cancel SOS
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Fall Detection Toggle */}
        <Card className={isMonitoring ? 'bg-green-50 border-2 border-green-500' : 'bg-blue-50 border-2 border-blue-200'}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {isMonitoring ? '🟢' : '⏸️'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {isMonitoring ? 'Safety Monitoring Active' : 'Start Your Work Shift'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isMonitoring
                      ? 'Fall detection is monitoring your safety'
                      : 'Enable fall detection when you start work'}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                variant={isMonitoring ? 'danger' : 'primary'}
                onClick={handleToggleMonitoring}
              >
                {isMonitoring ? 'End Work' : 'Start Work'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Manual SOS Button */}
        <Card className="bg-red-50 border-2 border-red-300">
          <CardBody>
            <div className="text-center py-3">
              <Button
                size="lg"
                variant="danger"
                className="w-full text-xl py-6"
                onClick={() => triggerEmergency()}
              >
                🚨 EMERGENCY SOS
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Press if you need immediate help
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Daily Check-In Card */}
        <Card className={todayCheckIn ? 'bg-green-50 border-2 border-green-200' : ''}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  📋 Today's Safety Check
                </h3>
                {todayCheckIn ? (
                  <p className="text-sm text-green-600 font-semibold">✓ Completed today</p>
                ) : (
                  <p className="text-sm text-gray-600">Complete your daily check-in</p>
                )}
              </div>
              {todayCheckIn ? (
                <Button variant="secondary" disabled>
                  ✓ Done
                </Button>
              ) : (
                <Link to="/worker/check-in">
                  <Button>Start Check-In</Button>
                </Link>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Training Progress Card */}
        <Card className={trainingComplete ? 'bg-green-50 border-2 border-green-200' : ''}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  🎓 Safety Certification
                </h3>
                {trainingComplete ? (
                  <p className="text-sm text-green-600 font-semibold">✓ All lessons completed!</p>
                ) : (
                  <p className="text-sm text-gray-600">Complete 3 lessons to get certified</p>
                )}
              </div>
              <Link to="/worker/training">
                <Button variant="secondary">
                  {trainingComplete ? 'View Training →' : 'Start Training →'}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Jobs Card */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  💼 Job Marketplace
                </h3>
                <p className="text-sm text-gray-600">Find construction jobs near you</p>
              </div>
              <Link to="/worker/jobs">
                <Button variant="secondary">Browse Jobs →</Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Report Incident Button */}
        <Link to="/worker/incident">
          <Card className="bg-orange-50 border-2 border-orange-200 hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="text-center py-4">
                <h3 className="text-xl font-bold text-orange-700">
                  ⚠️ Report Safety Issue
                </h3>
                <p className="text-sm text-orange-600 mt-1">
                  Tap to report a near-miss or unsafe condition
                </p>
              </div>
            </CardBody>
          </Card>
        </Link>

        {/* Incident History Card */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  📋 Incident History
                </h3>
                <p className="text-sm text-gray-600">View your reported safety issues</p>
              </div>
              <Link to="/worker/incident-history">
                <Button variant="secondary">View History →</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-around">
          <Link to="/worker/home" className="flex flex-col items-center text-blue-600">
            <span className="text-2xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/worker/jobs" className="flex flex-col items-center text-gray-600">
            <span className="text-2xl">💼</span>
            <span className="text-xs mt-1">Jobs</span>
          </Link>
          <Link to="/worker/training" className="flex flex-col items-center text-gray-600">
            <span className="text-2xl">📚</span>
            <span className="text-xs mt-1">Training</span>
          </Link>
          <Link to="/worker/profile" className="flex flex-col items-center text-gray-600">
            <span className="text-2xl">👤</span>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
