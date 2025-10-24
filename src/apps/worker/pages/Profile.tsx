import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { supabase } from '../../../shared/lib/supabase';
import { Button, Card, CardBody, Input } from '../../../shared/components';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user) return;

    try {
      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Get worker profile
      const { data: workerData } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!workerData) {
        // Profile doesn't exist, redirect to setup
        navigate('/worker/complete-profile');
        return;
      }

      setProfile({ ...userData, ...workerData });
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      // Store PIN in users table (hashed would be better for production)
      const { error: updateError } = await supabase
        .from('users')
        .update({ pin: pin })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setShowPinSetup(false);
      setPin('');
      setConfirmPin('');
      setError('');
      alert('✅ PIN set successfully! Use it to sign in next time.');
      loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/worker/home" className="text-2xl">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Photo & Name */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl">
                  👤
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.full_name || 'No name set'}</h2>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Profile Details */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="text-gray-900">{profile.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Experience</label>
                <p className="text-gray-900">{profile.experience} years</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Certification Status</label>
                <p className={`font-semibold ${profile.is_certified ? 'text-green-600' : 'text-orange-600'}`}>
                  {profile.is_certified ? '✓ Certified' : '○ Not Certified'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* PIN Setup */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Quick Sign-In PIN</h3>
              {profile.pin && !showPinSetup && (
                <span className="text-green-600 text-sm font-semibold">✓ Set</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Set a 4-digit PIN for faster sign-in instead of email verification
            </p>

            {showPinSetup ? (
              <div className="space-y-3">
                <Input
                  type="password"
                  label="New PIN (4 digits)"
                  placeholder="0000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
                <Input
                  type="password"
                  label="Confirm PIN"
                  placeholder="0000"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSetPin} className="flex-1">
                    Save PIN
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowPinSetup(false);
                      setPin('');
                      setConfirmPin('');
                      setError('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowPinSetup(true)} variant="secondary" className="w-full">
                {profile.pin ? 'Change PIN' : 'Set Up PIN'}
              </Button>
            )}
          </CardBody>
        </Card>

        {/* Sign Out */}
        <Button onClick={signOut} variant="danger" className="w-full">
          Sign Out
        </Button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-around">
          <Link to="/worker/home" className="flex flex-col items-center text-gray-600">
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
          <Link to="/worker/profile" className="flex flex-col items-center text-blue-600">
            <span className="text-2xl">👤</span>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
