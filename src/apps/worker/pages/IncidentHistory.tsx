import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody } from '../../../shared/components';
import { formatDate } from '../../../shared/lib/utils';

interface Incident {
  id: string;
  type: string;
  photo_url: string;
  voice_note_url: string | null;
  location_text: string | null;
  created_at: string;
  status?: string;
}

export default function IncidentHistory() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [user]);

  async function loadIncidents() {
    if (!user) return;

    try {
      // Get worker profile
      const { data: profile } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      // Get incidents
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('worker_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIncidents(data || []);
    } catch (err) {
      console.error('Error loading incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/worker/home" className="text-2xl">
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Incident History</h1>
            <p className="text-xs text-gray-600">Your reported safety issues</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {incidents.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Incidents Reported</h3>
                <p className="text-gray-600 mb-4">
                  You haven't reported any safety issues yet.
                </p>
                <Link to="/worker/incident">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    Report an Issue
                  </button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Incident Photo */}
                    <div className="flex-shrink-0">
                      <img
                        src={incident.photo_url}
                        alt="Incident"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Incident Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">
                              {incident.type === 'near-miss' ? '⚠️' : '🚧'}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900">
                              {incident.type === 'near-miss' ? 'Near-Miss' : 'Unsafe Condition'}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(incident.created_at)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Under Review
                        </span>
                      </div>

                      {incident.location_text && (
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {incident.location_text}
                        </p>
                      )}

                      {incident.voice_note_url && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">🎤 Voice Note:</p>
                          <audio controls className="w-full max-w-md" src={incident.voice_note_url} />
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="text-blue-600 text-sm hover:underline mt-2"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Type:</label>
                  <p className="text-gray-900">
                    {selectedIncident.type === 'near-miss' ? '⚠️ Near-Miss' : '🚧 Unsafe Condition'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Date Reported:</label>
                  <p className="text-gray-900">{formatDate(selectedIncident.created_at)}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Status:</label>
                  <p className="text-yellow-600 font-semibold">Under Review</p>
                </div>

                {selectedIncident.location_text && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Location:</label>
                    <p className="text-gray-900">📍 {selectedIncident.location_text}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Photo:</label>
                  <img
                    src={selectedIncident.photo_url}
                    alt="Incident"
                    className="w-full rounded-lg"
                  />
                </div>

                {selectedIncident.voice_note_url && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Voice Note:
                    </label>
                    <audio controls className="w-full" src={selectedIncident.voice_note_url} />
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
          <Link to="/worker/profile" className="flex flex-col items-center text-gray-600">
            <span className="text-2xl">👤</span>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
