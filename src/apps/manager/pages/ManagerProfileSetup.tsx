import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { supabase } from '../../../shared/lib/supabase';
import { Button, Input, Card, CardBody } from '../../../shared/components';

export default function ManagerProfileSetup() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/manager');
      return;
    }
    setCheckingProfile(false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Not authenticated');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Creating manager user record...');
      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          phone: phone,
          role: 'manager',
        });

      if (userError) {
        console.error('User error:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      console.log('Creating manager profile...');
      // Create manager profile
      const { error: profileError } = await supabase
        .from('manager_profiles')
        .insert({
          user_id: user.id,
          company_name: company,
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('Manager profile created successfully, navigating...');

      // Force a full page reload to ensure auth state is refreshed
      window.location.href = '/manager';
    } catch (err: any) {
      console.error('Full error:', err);
      setError(err.message || 'Failed to create profile');
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Checking profile...</div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h2>
            <p className="text-gray-600 mb-2">
              Welcome to SafeRise! Let's set up your manager profile.
            </p>
            <p className="text-sm text-blue-600 mb-6 font-medium">
              ⏱️ This takes about 1 minute
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                label="Full Name"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                type="tel"
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <Input
                type="text"
                label="Company Name"
                placeholder="ABC Construction Ltd"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
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
                disabled={!fullName || !phone || !company}
              >
                Complete Setup
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
