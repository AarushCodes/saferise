import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';
import { formatDate } from '../../../shared/lib/utils';

interface SafetyAlert {
  id: string;
  worker_id: string;
  status: 'unresponded' | 'safe' | 'emergency';
  location_lat: number | null;
  location_lng: number | null;
  location_text: string | null;
  response_time: number | null;
  responded_at: string | null;
  created_at: string;
  worker_profiles: {
    user_id: string;
    users: {
      full_name: string;
      phone: string;
    };
  };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'emergency'>('active');

  useEffect(() => {
    loadAlerts();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('safety_alerts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'safety_alerts'
      }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  async function loadAlerts() {
    try {
      let query = supabase
        .from('safety_alerts')
        .select(`
          *,
          worker_profiles!inner(
            user_id,
            users!inner(full_name, phone)
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.in('status', ['unresponded', 'emergency']);
      } else if (filter === 'emergency') {
        query = query.eq('status', 'emergency');
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({
          status: 'safe',
          responded_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      loadAlerts();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      alert('Failed to acknowledge alert');
    }
  }

  const activeAlertCount = alerts.filter(a => a.status === 'unresponded' || a.status === 'emergency').length;
  const emergencyCount = alerts.filter(a => a.status === 'emergency').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading alerts...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Safety Alerts</h1>
              <p className="text-sm text-gray-600">Real-time worker safety monitoring</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold text-yellow-600">{activeAlertCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Emergencies</p>
              <p className="text-3xl font-bold text-red-600">{emergencyCount}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Today</p>
              <p className="text-3xl font-bold text-green-600">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'active' ? 'primary' : 'secondary'}
            onClick={() => setFilter('active')}
          >
            Active Alerts
          </Button>
          <Button
            variant={filter === 'emergency' ? 'primary' : 'secondary'}
            onClick={() => setFilter('emergency')}
          >
            Emergencies Only
          </Button>
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All Alerts
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {alerts.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Alerts</h3>
                <p className="text-gray-600">
                  {filter === 'active'
                    ? 'No active safety alerts at this time.'
                    : filter === 'emergency'
                    ? 'No emergency alerts at this time.'
                    : 'No safety alerts have been recorded.'}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={
                  alert.status === 'emergency'
                    ? 'bg-red-50 border-2 border-red-500'
                    : alert.status === 'unresponded'
                    ? 'bg-yellow-50 border-2 border-yellow-500'
                    : 'border-2 border-green-200'
                }
              >
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">
                          {alert.status === 'emergency' ? '🚨' : alert.status === 'unresponded' ? '⚠️' : '✅'}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {alert.worker_profiles.users.full_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {alert.worker_profiles.users.phone}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 ml-12">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            alert.status === 'emergency'
                              ? 'bg-red-600 text-white'
                              : alert.status === 'unresponded'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-green-600 text-white'
                          }`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-semibold">Time:</span>
                          <span>{formatDate(alert.created_at)}</span>
                        </div>

                        {alert.location_text && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">Location:</span>
                            <span>📍 {alert.location_text}</span>
                          </div>
                        )}

                        {alert.responded_at && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">Responded:</span>
                            <span>{formatDate(alert.responded_at)}</span>
                            {alert.response_time && (
                              <span className="text-sm">({alert.response_time}s)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {(alert.status === 'unresponded' || alert.status === 'emergency') && (
                      <Button
                        variant="primary"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Mark as Safe
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
