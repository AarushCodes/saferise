import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';
import { formatDate } from '../../../shared/lib/utils';

interface CheckIn {
  id: string;
  worker_id: string;
  wearing_ppe: boolean;
  scaffolding_secure: boolean;
  weather_safe: boolean;
  feeling_alert: boolean;
  feeling?: string;
  sleep_hours?: number;
  concerns?: string | null;
  photo_url: string;
  location_text: string | null;
  created_at: string;
  worker_profiles: {
    users: {
      full_name: string;
      phone: string;
    };
  };
}

export default function CheckIns() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);

  useEffect(() => {
    loadCheckIns();
  }, [dateFilter]);

  async function loadCheckIns() {
    try {
      let query = supabase
        .from('daily_check_ins')
        .select(`
          *,
          worker_profiles!inner(
            users!inner(full_name, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setCheckIns(data || []);
    } catch (err) {
      console.error('Error loading check-ins:', err);
    } finally {
      setLoading(false);
    }
  }

  const allSafeCount = checkIns.filter(c =>
    c.wearing_ppe && c.scaffolding_secure && c.weather_safe && c.feeling_alert
  ).length;
  const concernCount = checkIns.filter(c => c.concerns && c.concerns.trim() !== '').length;
  const safetyIssues = checkIns.filter(c =>
    !c.wearing_ppe || !c.scaffolding_secure || !c.weather_safe || !c.feeling_alert
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading check-ins...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Daily Check-Ins</h1>
              <p className="text-sm text-gray-600">Monitor worker health and safety</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Check-Ins</p>
              <p className="text-3xl font-bold text-blue-600">{checkIns.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">All Safe</p>
              <p className="text-3xl font-bold text-green-600">{allSafeCount}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Safety Issues</p>
              <p className="text-3xl font-bold text-orange-600">{safetyIssues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <Button
            variant={dateFilter === 'today' ? 'primary' : 'secondary'}
            onClick={() => setDateFilter('today')}
          >
            Today
          </Button>
          <Button
            variant={dateFilter === 'week' ? 'primary' : 'secondary'}
            onClick={() => setDateFilter('week')}
          >
            This Week
          </Button>
          <Button
            variant={dateFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setDateFilter('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Check-Ins List */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {checkIns.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Check-Ins</h3>
                <p className="text-gray-600">
                  No check-ins found for the selected time period.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {checkIns.map((checkIn) => {
              const hasSafetyIssues = !checkIn.wearing_ppe || !checkIn.scaffolding_secure || !checkIn.weather_safe || !checkIn.feeling_alert;
              return (
              <Card
                key={checkIn.id}
                className={hasSafetyIssues || checkIn.concerns ? 'bg-orange-50 border-2 border-orange-300' : ''}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <img
                      src={checkIn.photo_url}
                      alt="Check-in"
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {checkIn.worker_profiles.users.full_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {checkIn.worker_profiles.users.phone}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(checkIn.created_at)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{checkIn.wearing_ppe ? '✅' : '❌'}</span>
                            <span className="text-sm text-gray-700">PPE</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{checkIn.scaffolding_secure ? '✅' : '❌'}</span>
                            <span className="text-sm text-gray-700">Scaffolding</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{checkIn.weather_safe ? '✅' : '❌'}</span>
                            <span className="text-sm text-gray-700">Weather</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{checkIn.feeling_alert ? '✅' : '❌'}</span>
                            <span className="text-sm text-gray-700">Feeling Alert</span>
                          </div>
                        </div>

                        {checkIn.location_text && (
                          <p className="text-sm text-gray-600 mt-2">
                            📍 {checkIn.location_text}
                          </p>
                        )}

                        {checkIn.concerns && (
                          <div className="mt-2 p-3 bg-orange-100 rounded-lg">
                            <p className="text-sm font-semibold text-orange-800 mb-1">
                              ⚠️ Concerns Reported:
                            </p>
                            <p className="text-sm text-orange-900">{checkIn.concerns}</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedCheckIn(checkIn)}
                        className="text-blue-600 text-sm hover:underline mt-2"
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Check-In Details</h2>
                <button
                  onClick={() => setSelectedCheckIn(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Worker:</label>
                  <p className="text-gray-900">{selectedCheckIn.worker_profiles.users.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedCheckIn.worker_profiles.users.phone}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Date:</label>
                  <p className="text-gray-900">{formatDate(selectedCheckIn.created_at)}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Safety Checklist:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
                      <span className="text-xl">{selectedCheckIn.wearing_ppe ? '✅' : '❌'}</span>
                      <span className="text-sm">👷 Wearing PPE</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
                      <span className="text-xl">{selectedCheckIn.scaffolding_secure ? '✅' : '❌'}</span>
                      <span className="text-sm">🏗️ Scaffolding Secure</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
                      <span className="text-xl">{selectedCheckIn.weather_safe ? '✅' : '❌'}</span>
                      <span className="text-sm">🌤️ Weather Safe</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-gray-50">
                      <span className="text-xl">{selectedCheckIn.feeling_alert ? '✅' : '❌'}</span>
                      <span className="text-sm">💪 Feeling Alert</span>
                    </div>
                  </div>
                </div>

                {selectedCheckIn.location_text && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Location:</label>
                    <p className="text-gray-900">📍 {selectedCheckIn.location_text}</p>
                  </div>
                )}

                {selectedCheckIn.concerns && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Concerns:</label>
                    <div className="p-3 bg-orange-50 rounded-lg mt-1">
                      <p className="text-orange-900">{selectedCheckIn.concerns}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Photo:</label>
                  <img
                    src={selectedCheckIn.photo_url}
                    alt="Check-in"
                    className="w-full rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={() => setSelectedCheckIn(null)}
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
