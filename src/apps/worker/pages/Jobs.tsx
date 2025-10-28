import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { formatDate } from '../../../shared/lib/utils';
import { Card, CardBody, Button, Select } from '../../../shared/components';
import type { JobStatus, ApplicationStatus } from '../../../shared/types/database';

interface Job {
  id: string;
  title: string;
  description: string;
  pay_rate: string;
  location_text: string;
  duration_days: number;
  start_date: string;
  requires_certification: boolean;
  status: JobStatus;
  created_at: string;
  posted_by_name?: string;
}

interface Application {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string;
  job: Job;
}

export default function Jobs() {
  const [activeTab, setActiveTab] = useState<'browse' | 'applications'>('browse');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterCertRequired, setFilterCertRequired] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest_pay' | 'nearest'>('newest');
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState('');
  const [isCertified, setIsCertified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [filterCertRequired, sortBy]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get worker profile
      const { data: workerProfile } = await supabase
        .from('worker_profiles')
        .select('id, is_certified')
        .eq('user_id', user.id)
        .single();

      if (workerProfile) {
        setWorkerId(workerProfile.id);
        setIsCertified(workerProfile.is_certified);
      }

      // Build query
      let query = supabase
        .from('jobs')
        .select(`
          *,
          users!jobs_posted_by_fkey(full_name)
        `)
        .eq('status', 'open');

      // Apply filters
      if (filterCertRequired) {
        query = query.eq('requires_certification', true);
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'highest_pay') {
        query = query.order('pay_rate', { ascending: false });
      }
      // Note: 'nearest' would require geolocation calc, skipping for now

      const { data: jobsData } = await query;

      if (jobsData) {
        const jobsWithNames = jobsData.map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          pay_rate: job.pay_rate,
          location_text: job.location_text,
          duration_days: job.duration_days,
          start_date: job.start_date,
          requires_certification: job.requires_certification,
          status: job.status,
          created_at: job.created_at,
          posted_by_name: job.users?.full_name || 'Unknown',
        }));
        setJobs(jobsWithNames);
      }

      // Get applications
      if (workerProfile) {
        const { data: appsData } = await supabase
          .from('job_applications')
          .select(`
            *,
            jobs(
              *,
              users!jobs_posted_by_fkey(full_name)
            )
          `)
          .eq('worker_id', workerProfile.id)
          .order('applied_at', { ascending: false });

        if (appsData) {
          const appsWithJobNames = appsData.map((app: any) => ({
            id: app.id,
            job_id: app.job_id,
            status: app.status,
            applied_at: app.applied_at,
            job: {
              id: app.jobs.id,
              title: app.jobs.title,
              description: app.jobs.description,
              pay_rate: app.jobs.pay_rate,
              location_text: app.jobs.location_text,
              duration_days: app.jobs.duration_days,
              start_date: app.jobs.start_date,
              requires_certification: app.jobs.requires_certification,
              status: app.jobs.status,
              created_at: app.jobs.created_at,
              posted_by_name: app.jobs.users?.full_name || 'Unknown',
            },
          }));
          setApplications(appsWithJobNames);
        }
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function applyToJob(jobId: string) {
    try {
      const { error } = await supabase.from('job_applications').insert([{
        job_id: jobId,
        worker_id: workerId,
        status: 'pending',
      }]);

      if (error) {
        console.error('Error applying to job:', error);
        alert('Failed to apply to job');
        return;
      }

      // Reload data
      loadData();
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to apply to job');
    }
  }

  const hasApplied = (jobId: string) => {
    return applications.some(app => app.job_id === jobId);
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/worker/home')} className="text-2xl">
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">Job Marketplace</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Browse Jobs
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Applications ({applications.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {activeTab === 'browse' ? (
          <>
            {/* Filters */}
            <Card>
              <CardBody>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Sort By"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      options={[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'highest_pay', label: 'Highest Pay' },
                        { value: 'nearest', label: 'Nearest' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={filterCertRequired}
                        onChange={(e) => setFilterCertRequired(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span className="font-medium text-gray-700">
                        Only show jobs requiring certification
                      </span>
                    </label>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Jobs List */}
            {jobs.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">💼</div>
                    <p className="text-gray-600">No jobs available at the moment</p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              jobs.map(job => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>📍 {job.location_text}</span>
                          <span>•</span>
                          <span>⏱️ {job.duration_days} days</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {job.pay_rate}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600">
                          Starts: {formatDate(job.start_date)}
                        </span>
                        {job.requires_certification && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            ✅ Certification Required
                          </span>
                        )}
                        <span className="text-gray-500">
                          by {job.posted_by_name}
                        </span>
                      </div>

                      {hasApplied(job.id) ? (
                        <Button variant="secondary" disabled size="sm">
                          Applied ✓
                        </Button>
                      ) : job.requires_certification && !isCertified ? (
                        <Button variant="ghost" disabled size="sm">
                          Certification Required
                        </Button>
                      ) : (
                        <Button onClick={() => applyToJob(job.id)} size="sm">
                          Apply
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            {/* Applications List */}
            {applications.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-gray-600">You haven't applied to any jobs yet</p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              applications.map(app => (
                <Card key={app.id}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {app.job.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>📍 {app.job.location_text}</span>
                          <span>•</span>
                          <span>{app.job.pay_rate}</span>
                          <span>•</span>
                          <span>⏱️ {app.job.duration_days} days</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3 text-sm">
                      {app.job.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Applied: {formatDate(app.applied_at)}
                      </span>

                      {app.status === 'accepted' && (
                        <Button size="sm">
                          📞 Contact Employer
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-around">
          <button
            onClick={() => navigate('/worker/home')}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => navigate('/worker/jobs')}
            className="flex flex-col items-center text-blue-600"
          >
            <span className="text-2xl">💼</span>
            <span className="text-xs mt-1">Jobs</span>
          </button>
          <button
            onClick={() => navigate('/worker/training')}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="text-2xl">📚</span>
            <span className="text-xs mt-1">Training</span>
          </button>
          <button
            onClick={() => navigate('/worker/profile')}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
