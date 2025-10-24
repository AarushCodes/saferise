import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { getCurrentLocation } from '../../../shared/lib/utils';
import { Button, Card, CardBody } from '../../../shared/components';
import type { IncidentType } from '../../../shared/types/database';

export default function IncidentReport() {
  const [type, setType] = useState<IncidentType>('near-miss');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Auto-stop after 30 seconds
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoFile) {
      setError('Please add a photo');
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
      const photoExt = photoFile.name.split('.').pop();
      const photoName = `incident-${Date.now()}.${photoExt}`;
      const photoPath = `incidents/${photoName}`;

      const { error: photoError } = await supabase.storage
        .from('photos')
        .upload(photoPath, photoFile);

      if (photoError) throw photoError;

      const { data: { publicUrl: photoUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(photoPath);

      // Upload voice note if exists
      let voiceUrl = null;
      if (audioBlob) {
        const voiceName = `incident-${Date.now()}.webm`;
        const voicePath = `incidents/${voiceName}`;

        const { error: voiceError } = await supabase.storage
          .from('voice-notes')
          .upload(voicePath, audioBlob);

        if (voiceError) throw voiceError;

        const { data: { publicUrl } } = supabase.storage
          .from('voice-notes')
          .getPublicUrl(voicePath);

        voiceUrl = publicUrl;
      }

      // Get location
      const location = await getCurrentLocation();

      // Save incident
      const { error: insertError } = await supabase
        .from('incidents')
        .insert({
          worker_id: workerProfile.id,
          type: type,
          photo_url: photoUrl,
          voice_note_url: voiceUrl,
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          location_text: location?.text || null,
        });

      if (insertError) throw insertError;

      // Success! Show confirmation and navigate
      alert('✅ Safety issue reported successfully!\n\nYour report has been sent to the safety team. You can view its status in your incident history.');

      // Navigate back to home
      navigate('/worker/home');
    } catch (err: any) {
      setError(err.message || 'Failed to submit incident report');
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
            <h1 className="text-xl font-bold text-gray-900">Report Safety Issue</h1>
            <p className="text-xs text-gray-600">Help keep everyone safe</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Type Selection */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Type of Issue</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('near-miss')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  type === 'near-miss'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="text-3xl mb-2">⚠️</div>
                <div className="font-semibold">Near-Miss</div>
                <div className="text-xs text-gray-600 mt-1">
                  Almost happened
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('unsafe-condition')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  type === 'unsafe-condition'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="text-3xl mb-2">🚧</div>
                <div className="font-semibold">Unsafe Condition</div>
                <div className="text-xs text-gray-600 mt-1">
                  Hazard present
                </div>
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Photo <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Take a photo of the issue
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

        {/* Voice Note */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Voice Note <span className="text-gray-500 text-sm">(Optional)</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Record up to 30 seconds to describe the issue
            </p>

            {audioBlob ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Recording saved</div>
                    <div className="text-sm text-gray-600">{recordingTime} seconds</div>
                  </div>
                  <audio src={URL.createObjectURL(audioBlob)} controls className="max-w-xs" />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={deleteRecording}
                  className="w-full"
                >
                  Delete Recording
                </Button>
              </div>
            ) : isRecording ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4 p-6 bg-red-50 rounded-lg">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="text-lg font-bold text-gray-900">
                    Recording... {recordingTime}s / 30s
                  </div>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={stopRecording}
                  className="w-full"
                >
                  Stop Recording
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={startRecording}
                className="w-full"
              >
                🎤 Start Recording
              </Button>
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
          variant="danger"
          isLoading={loading}
          disabled={!photoFile}
        >
          Submit Report
        </Button>
      </form>
    </div>
  );
}
