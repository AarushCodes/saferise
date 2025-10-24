import { useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { Button, Input, Card, CardBody } from '../../../shared/components';

export default function OnboardingEmail() {
  const [mode, setMode] = useState<'email' | 'pin'>('pin');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (authError) throw authError;

      setEmailSent(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send sign-in link');
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Find user by PIN
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('pin', pin)
        .eq('role', 'worker')
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        setError('Invalid PIN. Please try again or use email sign-in.');
        setLoading(false);
        return;
      }

      // Send magic link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: userData.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (authError) throw authError;

      setEmail(userData.email);
      setEmailSent(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with PIN');
      setLoading(false);
    }
  };

  // If email sent, show confirmation
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">SafeRise</h1>
            <p className="text-lg text-gray-600">Worker Portal</p>
          </div>

          <Card>
            <CardBody className="p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
                <p className="text-gray-600 mb-2">We sent a sign-in link to:</p>
                <p className="font-semibold text-gray-900 mb-6">{email || 'your email'}</p>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Click the link in the email to sign in
                  </p>
                  <p className="text-xs text-blue-700">
                    The link will automatically sign you in and take you to the app
                  </p>
                </div>

                <button
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Use a different email or PIN
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SafeRise</h1>
          <p className="text-lg text-gray-600">Worker Portal</p>
        </div>

        <Card>
          <CardBody className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome!</h2>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('pin');
                  setError('');
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'pin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔢 PIN Sign-In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('email');
                  setError('');
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'email'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📧 Email Sign-In
              </button>
            </div>

            {mode === 'pin' ? (
              <>
                <p className="text-gray-600 mb-6">
                  Enter your 4-digit PIN for quick access
                </p>

                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <Input
                    type="password"
                    label="PIN"
                    placeholder="0000"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    required
                    error={error}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={loading}
                    disabled={pin.length !== 4}
                  >
                    Sign In with PIN
                  </Button>
                </form>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Don't have a PIN? Set it up in your profile after signing in with email
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Enter your email to get started. We'll send you a sign-in link.
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    error={error}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={loading}
                    disabled={!email}
                  >
                    Send Sign-In Link
                  </Button>
                </form>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  New users will be automatically registered
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
