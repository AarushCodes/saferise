import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';

interface WorkerProgress {
  worker_id: string;
  full_name: string;
  phone: string;
  is_certified: boolean;
  completed_lessons: number;
  total_lessons: number;
  completion_percentage: number;
}

export default function TrainingProgress() {
  const [workers, setWorkers] = useState<WorkerProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'certified' | 'in-progress'>('all');

  useEffect(() => {
    loadTrainingProgress();
  }, []);

  async function loadTrainingProgress() {
    try {
      // Get all workers
      const { data: workerProfiles, error: profileError } = await supabase
        .from('worker_profiles')
        .select(`
          id,
          is_certified,
          users!inner(full_name, phone)
        `);

      if (profileError) throw profileError;

      // Get training progress for all workers
      const workersWithProgress: WorkerProgress[] = await Promise.all(
        (workerProfiles || []).map(async (profile) => {
          const { data: progress, count } = await supabase
            .from('training_progress')
            .select('*', { count: 'exact' })
            .eq('worker_id', profile.id)
            .eq('completed', true);

          const totalLessons = 3; // We have 3 lessons
          const completedLessons = count || 0;
          const completionPercentage = Math.round((completedLessons / totalLessons) * 100);

          return {
            worker_id: profile.id,
            name: profile.users.full_name,
            phone: profile.users.phone,
            is_certified: profile.is_certified || completedLessons >= 3,
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
            completion_percentage: completionPercentage,
          };
        })
      );

      setWorkers(workersWithProgress);
    } catch (err) {
      console.error('Error loading training progress:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredWorkers = workers.filter(w => {
    if (filter === 'certified') return w.is_certified;
    if (filter === 'in-progress') return !w.is_certified;
    return true;
  });

  const certifiedCount = workers.filter(w => w.is_certified).length;
  const inProgressCount = workers.filter(w => !w.is_certified).length;
  const avgCompletion = workers.length > 0
    ? Math.round(workers.reduce((sum, w) => sum + w.completion_percentage, 0) / workers.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading training data...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Training Progress</h1>
              <p className="text-sm text-gray-600">Track worker certifications</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Certified Workers</p>
              <p className="text-3xl font-bold text-green-600">{certifiedCount}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Avg Completion</p>
              <p className="text-3xl font-bold text-purple-600">{avgCompletion}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All Workers
          </Button>
          <Button
            variant={filter === 'certified' ? 'primary' : 'secondary'}
            onClick={() => setFilter('certified')}
          >
            Certified
          </Button>
          <Button
            variant={filter === 'in-progress' ? 'primary' : 'secondary'}
            onClick={() => setFilter('in-progress')}
          >
            In Progress
          </Button>
        </div>
      </div>

      {/* Workers List */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {filteredWorkers.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Workers</h3>
                <p className="text-gray-600">
                  {filter === 'certified'
                    ? 'No workers have completed their training yet.'
                    : filter === 'in-progress'
                    ? 'All workers have completed their training.'
                    : 'No workers found.'}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWorkers.map((worker) => (
              <Card
                key={worker.worker_id}
                className={worker.is_certified ? 'bg-green-50 border-2 border-green-200' : ''}
              >
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">
                          {worker.is_certified ? '🏆' : '📚'}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{worker.name}</h3>
                          <p className="text-sm text-gray-600">{worker.phone}</p>
                        </div>
                      </div>

                      <div className="ml-12 space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            Progress: {worker.completed_lessons}/{worker.total_lessons} lessons
                          </span>
                          {worker.is_certified && (
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                              CERTIFIED
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              worker.is_certified ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${worker.completion_percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {worker.completion_percentage}% complete
                        </p>
                      </div>
                    </div>
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
