import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';

interface Worker {
  id: string;
  full_name: string;
  phone: string;
  experience_level: 'beginner' | 'intermediate' | 'expert';
  skills: string[];
  photo_url: string;
  is_certified: boolean;
  is_available: boolean;
}

export default function WorkerDirectory() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'certified' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  async function loadWorkers() {
    try {
      const { data, error } = await supabase
        .from('worker_profiles')
        .select(`
          id,
          experience_level,
          skills,
          photo_url,
          is_certified,
          is_available,
          users!inner(full_name, phone)
        `);

      if (error) throw error;

      const formattedWorkers: Worker[] = (data || []).map(profile => ({
        id: profile.id,
        name: profile.users.full_name,
        phone: profile.users.phone,
        experience_level: profile.experience_level,
        skills: profile.skills || [],
        photo_url: profile.photo_url,
        is_certified: profile.is_certified,
        is_available: profile.is_available,
      }));

      setWorkers(formattedWorkers);
    } catch (err) {
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         w.phone.includes(searchTerm);
    const matchesFilter = filter === 'all' ||
                         (filter === 'certified' && w.is_certified) ||
                         (filter === 'available' && w.is_available);
    return matchesSearch && matchesFilter;
  });

  const certifiedCount = workers.filter(w => w.is_certified).length;
  const availableCount = workers.filter(w => w.is_available).length;

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
              <p className="text-sm text-gray-600">View all registered workers</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Workers</p>
              <p className="text-3xl font-bold text-blue-600">{workers.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Certified</p>
              <p className="text-3xl font-bold text-green-600">{certifiedCount}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-3xl font-bold text-purple-600">{availableCount}</p>
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
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'certified' ? 'primary' : 'secondary'}
              onClick={() => setFilter('certified')}
            >
              Certified
            </Button>
            <Button
              variant={filter === 'available' ? 'primary' : 'secondary'}
              onClick={() => setFilter('available')}
            >
              Available
            </Button>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.map((worker) => (
              <Card
                key={worker.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedWorker(worker)}
              >
                <CardBody>
                  <div className="text-center">
                    <img
                      src={worker.photo_url}
                      alt={worker.name}
                      className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                    />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{worker.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{worker.phone}</p>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        worker.experience_level === 'expert' ? 'bg-purple-100 text-purple-800' :
                        worker.experience_level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {worker.experience_level.toUpperCase()}
                      </span>
                      {worker.is_certified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          CERTIFIED
                        </span>
                      )}
                      {worker.is_available && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {worker.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {worker.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                        {worker.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{worker.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
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
                <img
                  src={selectedWorker.photo_url}
                  alt={selectedWorker.name}
                  className="w-32 h-32 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-2xl font-bold text-gray-900">{selectedWorker.name}</h3>
                <p className="text-gray-600">{selectedWorker.phone}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Experience Level:</label>
                  <p className="text-gray-900 capitalize">{selectedWorker.experience_level}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Status:</label>
                  <div className="flex gap-2 mt-1">
                    {selectedWorker.is_certified && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                        Certified
                      </span>
                    )}
                    {selectedWorker.is_available && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                        Available for Work
                      </span>
                    )}
                    {!selectedWorker.is_available && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>

                {selectedWorker.skills.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Skills:</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedWorker.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
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
