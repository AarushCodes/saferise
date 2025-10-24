import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { supabase } from '../../../shared/lib/supabase';
import { Button, Input, Select, Card, CardBody } from '../../../shared/components';
import type { ExperienceLevel } from '../../../shared/types/database';

export default function OnboardingProfile() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('0-1');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/worker');
      return;
    }
    setCheckingProfile(false);
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Not authenticated');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let photoUrl = '';

      // Upload photo if provided
      if (photoFile) {
        console.log('Uploading photo...');
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
        console.log('Photo uploaded:', photoUrl);
      }

      console.log('Creating user record...');
      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          phone: phone,
          role: 'worker',
          photo_url: photoUrl,
        });

      if (userError) {
        console.error('User error:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      console.log('Creating worker profile...');
      // Create worker profile
      const { error: profileError } = await supabase
        .from('worker_profiles')
        .insert({
          user_id: user.id,
          experience: experience,
          is_certified: false,
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('Profile created successfully, navigating...');

      // Force a full page reload to ensure auth state is refreshed
      window.location.href = '/worker/home';
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
          <p className="text-lg text-gray-600">Complete Your Profile</p>
        </div>

        <Card>
          <CardBody className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h2>
            <p className="text-gray-600 mb-2">
              Welcome to SafeRise! To get started, please complete your profile.
            </p>
            <p className="text-sm text-blue-600 mb-6 font-medium">
              ⏱️ This takes about 2 minutes
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl">
                      👤
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 inline-block">
                      Choose Photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <Input
                type="text"
                label="Full Name"
                placeholder="Rajesh Kumar"
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

              <Select
                label="Years of Experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                options={[
                  { value: '0-1', label: '0-1 years' },
                  { value: '1-3', label: '1-3 years' },
                  { value: '3-5', label: '3-5 years' },
                  { value: '5+', label: '5+ years' },
                ]}
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
                disabled={!fullName || !phone}
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
