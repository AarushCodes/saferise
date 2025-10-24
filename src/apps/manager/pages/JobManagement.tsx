import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button, Input, TextArea, Select } from '../../../shared/components';
import { formatDate } from '../../../shared/lib/utils';
import { useAuth } from '../../../shared/hooks/useAuth';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  pay_rate: string;
  status: 'open' | 'in_progress' | 'completed';
  required_workers: number;
  duration_days: number;
  start_date: string;
  requires_certification: boolean;
  created_at: string;
  application_count?: number;
}

interface Applicant {
  id: string;
  job_id: string;
  worker_id: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applied_at: string;
  worker_name: string;
  worker_phone: string;
  worker_photo: string | null;
  experience: string;
  is_certified: boolean;
  check_in_compliance?: number;
  incident_count?: number;
  alert_count?: number;
}

export default function JobManagement() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Form state
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    location: '',
    pay_rate: '',
    duration_days: '',
    start_date: '',
    required_workers: '1',
    requires_certification: false,
  });

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('posted_by', user?.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Get application counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
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

  async function handlePostJob(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase.from('jobs').insert([
        {
          posted_by: user?.id,
          title: jobForm.title,
          description: jobForm.description,
          location_text: jobForm.location,
          pay_per_day: parseFloat(jobForm.pay_rate),
          duration_days: parseInt(jobForm.duration_days),
          start_date: jobForm.start_date,
          requires_certification: jobForm.requires_certification,
          status: 'active',
        },
      ]);

      if (error) throw error;

      alert('Job posted successfully!');
      setShowPostJobModal(false);
      setJobForm({
        title: '',
        description: '',
        location: '',
        pay_rate: '',
        duration_days: '',
        start_date: '',
        required_workers: '1',
        requires_certification: false,
      });
      loadJobs();
    } catch (err) {
      console.error('Error posting job:', err);
      alert('Failed to post job');
    }
  }

  async function loadApplicants(jobId: string) {
    setLoadingApplicants(true);
    try {
      const { data: applicationsData, error } = await supabase
        .from('job_applications')
        .select('id, job_id, worker_id, status, applied_at')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('Error loading applicants:', error);
        throw error;
      }

      console.log('Raw applications data:', applicationsData);

      // Get additional safety data for each applicant
      const applicantsWithStats = await Promise.all(
        (applicationsData || []).map(async (app: any) => {
          // Get worker profile
          const { data: workerProfile } = await supabase
            .from('worker_profiles')
            .select('id, user_id, experience, is_certified')
            .eq('id', app.worker_id)
            .single();

          if (!workerProfile) return null;

          // Get user details
          const { data: user } = await supabase
            .from('users')
            .select('full_name, phone, photo_url')
            .eq('id', workerProfile.user_id)
            .single();

          if (!user) return null;
          // Get safety stats
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { count: checkInCount } = await supabase
            .from('daily_check_ins')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', workerProfile.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          const { count: incidentCount } = await supabase
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', workerProfile.id);

          const { count: alertCount } = await supabase
            .from('safety_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', workerProfile.id);

          const compliance = checkInCount ? Math.round((checkInCount / 30) * 100) : 0;

          return {
            id: app.id,
            job_id: app.job_id,
            worker_id: app.worker_id,
            status: app.status,
            applied_at: app.applied_at,
            worker_name: user.full_name || 'Unknown',
            worker_phone: user.phone || 'N/A',
            worker_photo: user.photo_url,
            experience: workerProfile.experience,
            is_certified: workerProfile.is_certified,
            check_in_compliance: compliance,
            incident_count: incidentCount || 0,
            alert_count: alertCount || 0,
          };
        })
      );

      const validApplicants = applicantsWithStats.filter((a) => a !== null);
      console.log('Valid applicants with stats:', validApplicants);
      setApplicants(validApplicants as Applicant[]);
    } catch (err) {
      console.error('Error loading applicants:', err);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  }

  async function handleJobClick(job: Job) {
    setSelectedJob(job);
    await loadApplicants(job.id);
  }

  async function handleApplicationAction(applicationId: string, workerId: string, action: 'accepted' | 'rejected') {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: action })
        .eq('id', applicationId);

      if (error) throw error;

      // If accepted, create a notification for the worker
      if (action === 'accepted' && selectedJob) {
        await supabase.from('notifications').insert([
          {
            user_id: workerId,
            type: 'application_status',
            title: 'Application Accepted!',
            message: `Your application for "${selectedJob.title}" has been accepted.`,
            data: { job_id: selectedJob.id, application_id: applicationId },
          },
        ]);
      }

      // Reload applicants
      if (selectedJob) {
        await loadApplicants(selectedJob.id);
      }

      alert(`Application ${action === 'accepted' ? 'accepted' : 'rejected'} successfully!`);
    } catch (err) {
      console.error('Error updating application:', err);
      alert('Failed to update application');
    }
  }

  async function handleJobStatusChange(jobId: string, newStatus: 'open' | 'in_progress' | 'completed') {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      loadJobs();
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      alert('Failed to update job status');
    }
  }

  const filteredJobs = jobs.filter((j) => filter === 'all' || j.status === filter);
  const openCount = jobs.filter((j) => j.status === 'open').length;
  const inProgressCount = jobs.filter((j) => j.status === 'in_progress').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

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
              <p className="text-sm text-gray-600">Post jobs and manage applications</p>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setShowPostJobModal(true)}>
                + Post New Job
              </Button>
              <Link to="/manager">
                <Button variant="secondary">Back to Dashboard</Button>
              </Link>
            </div>
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
          <Button variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>
            All Jobs
          </Button>
          <Button variant={filter === 'open' ? 'primary' : 'secondary'} onClick={() => setFilter('open')}>
            Open
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'primary' : 'secondary'}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </Button>
          <Button variant={filter === 'completed' ? 'primary' : 'secondary'} onClick={() => setFilter('completed')}>
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
                  {filter === 'all' ? 'No jobs have been posted yet.' : `No ${filter.replace('_', ' ')} jobs found.`}
                </p>
                <Button variant="primary" className="mt-4" onClick={() => setShowPostJobModal(true)}>
                  Post Your First Job
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => handleJobClick(job)}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">💼</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">📍 {job.location}</p>
                        </div>
                      </div>

                      <div className="ml-9 space-y-2">
                        <p className="text-sm text-gray-700">{job.description.substring(0, 150)}...</p>

                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <span className="text-gray-600">💰 {job.pay_rate}</span>
                          <span className="text-gray-600">📅 {job.duration_days} days</span>
                          <span className="text-gray-600">🗓️ Starts: {new Date(job.start_date).toLocaleDateString()}</span>
                          <span className="text-gray-600">👷 {job.required_workers} workers needed</span>
                          <span className="text-gray-600">📝 {job.application_count} applications</span>
                          {job.requires_certification && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              ✓ Certification Required
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500">Posted {formatDate(job.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => handleJobClick(job)}>
                        View Applicants
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showPostJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handlePostJob} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Post New Job</h2>
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Roofing Installation - 5 Days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the job requirements, tasks, and any special instructions..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pay Per Day (₹) *</label>
                    <input
                      type="number"
                      required
                      value={jobForm.pay_rate}
                      onChange={(e) => setJobForm({ ...jobForm, pay_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="950"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (Days) *</label>
                    <input
                      type="number"
                      required
                      value={jobForm.duration_days}
                      onChange={(e) => setJobForm({ ...jobForm, duration_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bandra West, Mumbai"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={jobForm.start_date}
                      onChange={(e) => setJobForm({ ...jobForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Workers Needed *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={jobForm.required_workers}
                      onChange={(e) => setJobForm({ ...jobForm, required_workers: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requires_certification"
                    checked={jobForm.requires_certification}
                    onChange={(e) => setJobForm({ ...jobForm, requires_certification: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requires_certification" className="text-sm font-medium text-gray-700">
                    Requires Safety Certification
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button type="submit" variant="primary" className="flex-1">
                  Post Job
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPostJobModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applicants Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-sm text-gray-600">Manage Applications</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Job Status Controls */}
              <div className="mb-4 flex gap-2">
                <span className="text-sm font-semibold text-gray-700">Job Status:</span>
                <select
                  value={selectedJob.status}
                  onChange={(e) => handleJobStatusChange(selectedJob.id, e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {loadingApplicants ? (
                <div className="text-center py-8">
                  <p>Loading applicants...</p>
                </div>
              ) : applicants.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-600">No workers have applied to this job yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicants.map((applicant) => (
                    <Card key={applicant.id}>
                      <CardBody>
                        <div className="flex items-start gap-4">
                          {/* Photo */}
                          {applicant.worker_photo ? (
                            <img
                              src={applicant.worker_photo}
                              alt={applicant.worker_name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl text-gray-600 font-semibold">
                              {applicant.worker_name.charAt(0)}
                            </div>
                          )}

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{applicant.worker_name}</h3>
                                <p className="text-sm text-gray-600">{applicant.worker_phone}</p>
                              </div>
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  applicant.status === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : applicant.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : applicant.status === 'reviewed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {applicant.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div>
                                <p className="text-xs text-gray-600">Experience</p>
                                <p className="text-sm font-semibold">{applicant.experience} years</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Certification</p>
                                <p className="text-sm font-semibold">
                                  {applicant.is_certified ? '✓ Certified' : 'Not Certified'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Applied</p>
                                <p className="text-sm font-semibold">{formatDate(applicant.applied_at)}</p>
                              </div>
                            </div>

                            {/* Safety Record */}
                            {applicant.check_in_compliance !== undefined && (
                              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">
                                  Safety Record (Last 30 Days):
                                </p>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">Check-ins: </span>
                                    <span
                                      className={`font-semibold ${
                                        applicant.check_in_compliance >= 80
                                          ? 'text-green-600'
                                          : applicant.check_in_compliance >= 60
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                      }`}
                                    >
                                      {applicant.check_in_compliance}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Incidents: </span>
                                    <span className="font-semibold">{applicant.incident_count}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Alerts: </span>
                                    <span className="font-semibold">{applicant.alert_count}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            {applicant.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleApplicationAction(applicant.id, applicant.worker_id, 'accepted')}
                                >
                                  ✓ Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleApplicationAction(applicant.id, applicant.worker_id, 'rejected')}
                                >
                                  ✗ Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedJob(null)}
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
