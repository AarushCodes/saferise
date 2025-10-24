import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';
import { formatDate } from '../../../shared/lib/utils';

interface Incident {
  id: string;
  worker_id: string;
  type: 'near-miss' | 'unsafe-condition';
  photo_url: string;
  voice_note_url: string | null;
  location_text: string | null;
  created_at: string;
  status?: string;
  worker_profiles: {
    users: {
      full_name: string;
      phone: string;
    };
  };
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'near-miss' | 'unsafe-condition'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [typeFilter]);

  async function loadIncidents() {
    try {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          worker_profiles!inner(
            users!inner(full_name, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIncidents(data || []);
    } catch (err) {
      console.error('Error loading incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  const nearMissCount = incidents.filter(i => i.type === 'near-miss').length;
  const unsafeCount = incidents.filter(i => i.type === 'unsafe-condition').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
              <p className="text-sm text-gray-600">Review and manage safety incidents</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-3xl font-bold text-blue-600">{incidents.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Near-Miss</p>
              <p className="text-3xl font-bold text-yellow-600">{nearMissCount}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Unsafe Conditions</p>
              <p className="text-3xl font-bold text-orange-600">{unsafeCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <Button
            variant={typeFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter('all')}
          >
            All Incidents
          </Button>
          <Button
            variant={typeFilter === 'near-miss' ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter('near-miss')}
          >
            Near-Miss
          </Button>
          <Button
            variant={typeFilter === 'unsafe-condition' ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter('unsafe-condition')}
          >
            Unsafe Conditions
          </Button>
        </div>
      </div>

      {/* Incidents List */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {incidents.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Incidents</h3>
                <p className="text-gray-600">
                  {typeFilter === 'all'
                    ? 'No incidents have been reported yet.'
                    : typeFilter === 'near-miss'
                    ? 'No near-miss incidents reported.'
                    : 'No unsafe condition incidents reported.'}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card
                key={incident.id}
                className={incident.type === 'unsafe-condition' ? 'bg-orange-50' : 'bg-yellow-50'}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <img
                      src={incident.photo_url}
                      alt="Incident"
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">
                              {incident.type === 'near-miss' ? '⚠️' : '🚧'}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900">
                              {incident.type === 'near-miss' ? 'Near-Miss Incident' : 'Unsafe Condition'}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600">
                            Reported by {incident.worker_profiles.users.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {incident.worker_profiles.users.phone}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Under Review
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {formatDate(incident.created_at)}
                        </p>

                        {incident.location_text && (
                          <p className="text-sm text-gray-600">
                            📍 {incident.location_text}
                          </p>
                        )}

                        {incident.voice_note_url && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">🎤 Voice Note:</p>
                            <audio controls className="w-full max-w-md" src={incident.voice_note_url} />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedIncident(incident)}
                        className="text-blue-600 text-sm hover:underline mt-2"
                      >
                        View Full Details →
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
                  <label className="text-sm font-semibold text-gray-700">Reported By:</label>
                  <p className="text-gray-900">{selectedIncident.worker_profiles.users.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedIncident.worker_profiles.users.phone}</p>
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
    </div>
  );
}
