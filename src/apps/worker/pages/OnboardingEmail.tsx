import { useState } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Button, Input, Card, CardBody } from '../../../shared/components';

export default function OnboardingEmail() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await signIn(email, password);

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account first');
        } else {
          setError(authError.message);
        }
        setLoading(false);
      }
      // If successful, auth state change will handle navigation
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signUp(email, password);

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
      } else {
        // Show success message
        setSignupSuccess(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  // If signup successful, show confirmation
  if (signupSuccess) {
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
                <p className="text-gray-600 mb-2">We sent a confirmation link to:</p>
                <p className="font-semibold text-gray-900 mb-6">{email}</p>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Click the link in the email to confirm your account
                  </p>
                  <p className="text-xs text-blue-700">
                    Once confirmed, you can sign in with your email and password
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSignupSuccess(false);
                    setMode('signin');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Back to sign in
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {mode === 'signin' ? 'Welcome Back!' : 'Create Account'}
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'signin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  mode === 'signup'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {mode === 'signin' ? (
              <>
                <p className="text-gray-600 mb-6">
                  Sign in with your email and password
                </p>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    type="password"
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                    disabled={!email || !password}
                  >
                    Sign In
                  </Button>
                </form>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Create a new account to get started
                </p>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    type="password"
                    label="Password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <Input
                    type="password"
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
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
                    disabled={!email || !password || !confirmPassword}
                  >
                    Create Account
                  </Button>
                </form>

                <p className="text-sm text-gray-500 mt-4 text-center">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
