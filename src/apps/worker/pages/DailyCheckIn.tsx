import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { getCurrentLocation } from '../../../shared/lib/utils';
import { Button, Card, CardBody } from '../../../shared/components';

export default function DailyCheckIn() {
  const [wearingPPE, setWearingPPE] = useState(false);
  const [scaffoldingSecure, setScaffoldingSecure] = useState(false);
  const [weatherSafe, setWeatherSafe] = useState(false);
  const [feelingAlert, setFeelingAlert] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

    if (!photoFile) {
      setError('Please take a photo');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get worker profile
      const { data: workerProfile, error: profileError } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!workerProfile) {
        throw new Error('Profile not found. Please complete onboarding first.');
      }

      // Upload photo
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `checkin-${Date.now()}.${fileExt}`;
      const filePath = `check-ins/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // Get location
      const location = await getCurrentLocation();

      // Save check-in
      const { error: insertError } = await supabase
        .from('daily_check_ins')
        .insert({
          worker_id: workerProfile.id,
          wearing_ppe: wearingPPE,
          scaffolding_secure: scaffoldingSecure,
          weather_safe: weatherSafe,
          feeling_alert: feelingAlert,
          photo_url: publicUrl,
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          location_text: location?.text || null,
        });

      if (insertError) throw insertError;

      // Success! Navigate back to home
      navigate('/worker/home');
    } catch (err: any) {
      setError(err.message || 'Failed to submit check-in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/worker/home')} className="text-2xl">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daily Safety Check</h1>
            <p className="text-xs text-gray-600">Takes 30 seconds</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Safety Questions */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Safety Checklist</h2>

            <div className="space-y-4">
              {/* Toggle 1 */}
              <label className="flex items-center justify-between py-3 border-b cursor-pointer">
                <span className="text-gray-800">👷 Wearing helmet & vest?</span>
                <button
                  type="button"
                  onClick={() => setWearingPPE(!wearingPPE)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    wearingPPE ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      wearingPPE ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {/* Toggle 2 */}
              <label className="flex items-center justify-between py-3 border-b cursor-pointer">
                <span className="text-gray-800">🏗️ Scaffolding secure?</span>
                <button
                  type="button"
                  onClick={() => setScaffoldingSecure(!scaffoldingSecure)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    scaffoldingSecure ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      scaffoldingSecure ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {/* Toggle 3 */}
              <label className="flex items-center justify-between py-3 border-b cursor-pointer">
                <span className="text-gray-800">☁️ Weather safe to work?</span>
                <button
                  type="button"
                  onClick={() => setWeatherSafe(!weatherSafe)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    weatherSafe ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      weatherSafe ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {/* Toggle 4 */}
              <label className="flex items-center justify-between py-3 cursor-pointer">
                <span className="text-gray-800">💪 Feeling alert?</span>
                <button
                  type="button"
                  onClick={() => setFeelingAlert(!feelingAlert)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    feelingAlert ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      feelingAlert ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Take a Photo</h2>
            <p className="text-sm text-gray-600 mb-4">
              Take a photo of your PPE or work area
            </p>

            {photoPreview ? (
              <div className="space-y-3">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <label className="block">
                  <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 inline-block cursor-pointer w-full text-center">
                    Retake Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <span className="text-4xl mb-2 block">📸</span>
                  <span className="text-gray-600">Tap to take photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </CardBody>
        </Card>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={loading}
          disabled={!photoFile}
        >
          Submit Check-In ✓
        </Button>
      </form>
    </div>
  );
}
