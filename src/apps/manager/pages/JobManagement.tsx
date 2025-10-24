import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';
import { formatDate } from '../../../shared/lib/utils';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  pay_rate: string;
  status: 'open' | 'in_progress' | 'completed';
  required_workers: number;
  created_at: string;
  application_count: number;
}

export default function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Get application counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact' })
            .eq('job_id', job.id);

          return {
            ...job,
            application_count: count || 0,
          };
        })
      );

      setJobs(jobsWithCounts);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter(j => filter === 'all' || j.status === filter);

  const openCount = jobs.filter(j => j.status === 'open').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading jobs...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
              <p className="text-sm text-gray-600">Manage job postings</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-3xl font-bold text-blue-600">{jobs.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-3xl font-bold text-green-600">{openCount}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{inProgressCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-600">{completedCount}</p>
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
            All Jobs
          </Button>
          <Button
            variant={filter === 'open' ? 'primary' : 'secondary'}
            onClick={() => setFilter('open')}
          >
            Open
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'primary' : 'secondary'}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </Button>
          <Button
            variant={filter === 'completed' ? 'primary' : 'secondary'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💼</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Jobs</h3>
                <p className="text-gray-600">
                  {filter === 'all'
                    ? 'No jobs have been posted yet.'
                    : `No ${filter.replace('_', ' ')} jobs found.`}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💼</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">📍 {job.location}</p>
                        </div>
                      </div>

                      <div className="ml-9 space-y-2">
                        <p className="text-sm text-gray-700">{job.description}</p>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            💰 {job.pay_rate}
                          </span>
                          <span className="text-gray-600">
                            👷 {job.required_workers} workers needed
                          </span>
                          <span className="text-gray-600">
                            📝 {job.application_count} applications
                          </span>
                        </div>

                        <p className="text-xs text-gray-500">
                          Posted {formatDate(job.created_at)}
                        </p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'open' ? 'bg-green-100 text-green-800' :
                      job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </span>
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
