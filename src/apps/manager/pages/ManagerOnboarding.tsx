import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Button, Input, Card, CardBody } from '../../../shared/components';

export default function ManagerOnboarding() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: mode === 'signup' },
      });

      if (authError) throw authError;
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send sign-in link');
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardBody className="p-8 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a sign-in link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Click the link in the email to sign in to your manager dashboard.
                The link will expire in 60 minutes.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setEmailSent(false);
                  setLoading(false);
                }}
                className="w-full"
              >
                Use Different Email
              </Button>
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
          <p className="text-lg text-gray-600">Manager Dashboard</p>
        </div>

        <Card>
          <CardBody className="p-8">
            <div className="flex gap-2 mb-6">
              <Button
                variant={mode === 'signin' ? 'primary' : 'secondary'}
                onClick={() => setMode('signin')}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                variant={mode === 'signup' ? 'primary' : 'secondary'}
                onClick={() => setMode('signup')}
                className="flex-1"
              >
                Sign Up
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email Address"
                placeholder="manager@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
                disabled={!email}
              >
                {mode === 'signin' ? 'Send Sign In Link' : 'Create Account'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                {mode === 'signin'
                  ? "We'll send you a secure link to sign in"
                  : "We'll send you a link to complete your profile"}
              </p>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600">
                Looking for the worker portal?{' '}
                <a href="/worker" className="text-blue-600 hover:underline">
                  Go to Worker Portal →
                </a>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
