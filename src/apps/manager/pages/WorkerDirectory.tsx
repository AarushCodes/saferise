import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button, Input } from '../../../shared/components';
import { formatDate } from '../../../shared/lib/utils';

interface Worker {
  id: string;
  user_id: string;
  experience: '0-1' | '1-3' | '3-5' | '5+';
  is_certified: boolean;
  last_active: string;
  full_name: string;
  phone: string;
  photo_url: string | null;
  check_in_compliance?: number;
  incident_count?: number;
  alert_count?: number;
}

export default function WorkerDirectory() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCertified, setFilterCertified] = useState<boolean | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  async function loadWorkers() {
    try {
      const { data, error } = await supabase
        .from('worker_profiles')
        .select('id, user_id, experience, is_certified, last_active')
        .order('last_active', { ascending: false });

      if (error) {
        console.error('Error loading workers:', error);
        throw error;
      }

      console.log('Raw worker profiles:', data);

      // Get user details for each worker
      const workersWithUserInfo = await Promise.all(
        (data || []).map(async (profile: any) => {
          const { data: user } = await supabase
            .from('users')
            .select('full_name, phone, photo_url')
            .eq('id', profile.user_id)
            .single();

          if (!user) return null;

          return {
            id: profile.id,
            user_id: profile.user_id,
            experience: profile.experience,
            is_certified: profile.is_certified,
            last_active: profile.last_active,
            full_name: user.full_name || 'Unknown',
            phone: user.phone || 'N/A',
            photo_url: user.photo_url,
          };
        })
      );

      const validWorkers = workersWithUserInfo.filter((w) => w !== null);
      console.log('Valid workers with user info:', validWorkers);
      setWorkers(validWorkers as Worker[]);
    } catch (err) {
      console.error('Error loading workers:', err);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkerDetails(workerId: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get check-in compliance for last 30 days
      const { count: checkInCount } = await supabase
        .from('daily_check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', workerId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get incident count
      const { count: incidentCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', workerId);

      // Get alert count
      const { count: alertCount } = await supabase
        .from('safety_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', workerId);

      // Calculate check-in compliance (assuming 30 working days)
      const compliance = checkInCount ? Math.round((checkInCount / 30) * 100) : 0;

      return {
        check_in_compliance: compliance,
        incident_count: incidentCount || 0,
        alert_count: alertCount || 0,
      };
    } catch (err) {
      console.error('Error loading worker details:', err);
      return {
        check_in_compliance: 0,
        incident_count: 0,
        alert_count: 0,
      };
    }
  }

  async function handleWorkerClick(worker: Worker) {
    const details = await loadWorkerDetails(worker.id);
    setSelectedWorker({ ...worker, ...details });
  }

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone.includes(searchTerm);
    const matchesCertified = filterCertified === null || w.is_certified === filterCertified;
    return matchesSearch && matchesCertified;
  });

  const certifiedCount = workers.filter((w) => w.is_certified).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading workers...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Worker Directory</h1>
              <p className="text-sm text-gray-600">Searchable table of all workers</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Workers</p>
              <p className="text-3xl font-bold text-blue-600">{workers.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Certified</p>
              <p className="text-3xl font-bold text-green-600">{certifiedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <Button
              variant={filterCertified === null ? 'primary' : 'secondary'}
              onClick={() => setFilterCertified(null)}
            >
              All
            </Button>
            <Button
              variant={filterCertified === true ? 'primary' : 'secondary'}
              onClick={() => setFilterCertified(true)}
            >
              Certified Only
            </Button>
            <Button
              variant={filterCertified === false ? 'primary' : 'secondary'}
              onClick={() => setFilterCertified(false)}
            >
              Not Certified
            </Button>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {filteredWorkers.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👷</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Workers Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search.' : 'No workers match the selected filter.'}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Worker
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cert Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {worker.photo_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={worker.photo_url}
                                  alt={worker.full_name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                  {worker.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{worker.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{worker.phone}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {worker.experience} years
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {worker.is_certified ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              ✓ Certified
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Not Certified
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(worker.last_active)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleWorkerClick(worker)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Worker Profile</h2>
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="text-center mb-6">
                {selectedWorker.photo_url ? (
                  <img
                    src={selectedWorker.photo_url}
                    alt={selectedWorker.full_name}
                    className="w-32 h-32 rounded-full mx-auto mb-3 object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto mb-3 bg-gray-300 flex items-center justify-center text-3xl text-gray-600 font-semibold">
                    {selectedWorker.full_name.charAt(0)}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900">{selectedWorker.full_name}</h3>
                <p className="text-gray-600">{selectedWorker.phone}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Experience:</label>
                  <p className="text-gray-900">{selectedWorker.experience} years</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Certification Status:</label>
                  <div className="mt-1">
                    {selectedWorker.is_certified ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                        ✓ Certified
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                        Not Certified
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Last Active:</label>
                  <p className="text-gray-900">{formatDate(selectedWorker.last_active)}</p>
                </div>

                {selectedWorker.check_in_compliance !== undefined && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Safety Record (Last 30 Days)</h4>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Check-in Compliance:</label>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              selectedWorker.check_in_compliance >= 80
                                ? 'bg-green-600'
                                : selectedWorker.check_in_compliance >= 60
                                ? 'bg-yellow-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${selectedWorker.check_in_compliance}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {selectedWorker.check_in_compliance}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Incidents Reported:</label>
                      <p className="text-gray-900">{selectedWorker.incident_count}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Safety Alerts:</label>
                      <p className="text-gray-900">{selectedWorker.alert_count}</p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedWorker(null)}
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
