import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Button, Input, Card, CardBody } from '../../../shared/components';

export default function OnboardingOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const useMagicLink = location.state?.useMagicLink || false;

  if (!email) {
    navigate('/worker');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await verifyOTP(email, otp);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // On successful verification, navigate to profile setup
      navigate('/worker/complete-profile');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SafeRise</h1>
          <p className="text-lg text-gray-600">Worker Portal</p>
        </div>

        <Card>
          <CardBody className="p-8">
            {useMagicLink ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">📧</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
                  <p className="text-gray-600 mb-2">
                    We sent a sign-in link to:
                  </p>
                  <p className="font-semibold text-gray-900 mb-6">{email}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      Click the link in the email to sign in. The link will automatically redirect you to the app.
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Note: If you received a 6-digit code instead of a link, enter it below:
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    label="Verification Code (optional)"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    error={error}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={loading}
                    disabled={otp.length !== 6}
                  >
                    Verify Code
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify Email</h2>
                <p className="text-gray-600 mb-6">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    label="Verification Code"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                    error={error}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={loading}
                    disabled={otp.length !== 6}
                  >
                    Verify & Continue
                  </Button>
                </form>
              </>
            )}

            <button
              onClick={() => navigate('/worker')}
              className="text-sm text-blue-600 hover:underline mt-4 w-full text-center"
            >
              Use a different email
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
