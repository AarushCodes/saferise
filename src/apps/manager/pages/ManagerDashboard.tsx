import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';

interface DashboardStats {
  activeAlerts: number;
  totalWorkers: number;
  todayCheckIns: number;
  pendingIncidents: number;
  certifiedWorkers: number;
  openJobs: number;
}

export default function ManagerDashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeAlerts: 0,
    totalWorkers: 0,
    todayCheckIns: 0,
    pendingIncidents: 0,
    certifiedWorkers: 0,
    openJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();

    // Subscribe to real-time alerts
    const subscription = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'safety_alerts'
      }, () => {
        loadDashboardStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadDashboardStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [alertsRes, workersRes, checkInsRes, incidentsRes, jobsRes] = await Promise.all([
        supabase
          .from('safety_alerts')
          .select('*', { count: 'exact' })
          .in('status', ['unresponded', 'emergency']),
        supabase
          .from('worker_profiles')
          .select('is_certified', { count: 'exact' }),
        supabase
          .from('daily_check_ins')
          .select('*', { count: 'exact' })
          .gte('created_at', today.toISOString()),
        supabase
          .from('incidents')
          .select('*', { count: 'exact' }),
        supabase
          .from('jobs')
          .select('*', { count: 'exact' })
          .eq('status', 'open'),
      ]);

      const workers = workersRes.data || [];

      setStats({
        activeAlerts: alertsRes.count || 0,
        totalWorkers: workersRes.count || 0,
        todayCheckIns: checkInsRes.count || 0,
        pendingIncidents: incidentsRes.count || 0,
        certifiedWorkers: workers.filter(w => w.is_certified).length,
        openJobs: jobsRes.count || 0,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Critical Alerts Banner */}
        {stats.activeAlerts > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚨</span>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    {stats.activeAlerts} Active Safety Alert{stats.activeAlerts > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-red-700">
                    Immediate attention required
                  </p>
                </div>
              </div>
              <Link to="/manager/alerts">
                <Button variant="danger" size="lg">
                  View Alerts
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className={stats.activeAlerts > 0 ? 'bg-red-50 border-2 border-red-300' : ''}>
            <CardBody>
              <p className="text-xs text-gray-600 mb-1">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{stats.activeAlerts}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-600 mb-1">Total Workers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalWorkers}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-600 mb-1">Today Check-Ins</p>
              <p className="text-2xl font-bold text-green-600">{stats.todayCheckIns}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-600 mb-1">Incidents</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingIncidents}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-600 mb-1">Certified</p>
              <p className="text-2xl font-bold text-purple-600">{stats.certifiedWorkers}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-600 mb-1">Open Jobs</p>
              <p className="text-2xl font-bold text-teal-600">{stats.openJobs}</p>
            </CardBody>
          </Card>
        </div>

        {/* Main Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Safety Alerts */}
          <Link to="/manager/alerts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">🚨</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Safety Alerts</h3>
                    <p className="text-sm text-gray-600">Real-time monitoring</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Monitor and respond to worker safety alerts in real-time
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${stats.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.activeAlerts}
                  </span>
                  <span className="text-blue-600 text-sm font-semibold">View →</span>
                </div>
              </CardBody>
            </Card>
          </Link>

          {/* Daily Check-Ins */}
          <Link to="/manager/check-ins">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">📋</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Daily Check-Ins</h3>
                    <p className="text-sm text-gray-600">Worker health tracking</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Review worker health and safety check-ins
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.todayCheckIns}
                  </span>
                  <span className="text-blue-600 text-sm font-semibold">View →</span>
                </div>
              </CardBody>
            </Card>
          </Link>

          {/* Incident Reports */}
          <Link to="/manager/incidents">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">⚠️</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Incident Reports</h3>
                    <p className="text-sm text-gray-600">Safety issues</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Manage near-miss and unsafe condition reports
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-600">
                    {stats.pendingIncidents}
                  </span>
                  <span className="text-blue-600 text-sm font-semibold">View →</span>
                </div>
              </CardBody>
            </Card>
          </Link>

          {/* Training Progress */}
          <Link to="/manager/training">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">🎓</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Training Progress</h3>
                    <p className="text-sm text-gray-600">Certifications</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Track worker training and certifications
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-600">
                    {stats.certifiedWorkers}/{stats.totalWorkers}
                  </span>
                  <span className="text-blue-600 text-sm font-semibold">View →</span>
                </div>
              </CardBody>
            </Card>
          </Link>

          {/* Worker Directory */}
          <Link to="/manager/workers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">👷</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Worker Directory</h3>
                    <p className="text-sm text-gray-600">All workers</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  View profiles and contact information
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.totalWorkers}
                  </span>
                  <span className="text-blue-600 text-sm font-semibold">View →</span>
                </div>
              </CardBody>
            </Card>
          </Link>

          {/* Job Management */}
          <Link to="/manager/jobs">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">💼</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Job Management</h3>
                    <p className="text-sm text-gray-600">Job postings</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Manage job postings and applications
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-teal-600">
                    {stats.openJobs}
                  </span>
                  <span className="text-blue-600 text-sm font-semibold">View →</span>
                </div>
              </CardBody>
            </Card>
          </Link>

          {/* Reports */}
          <Link to="/manager/reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">📊</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Reports</h3>
                    <p className="text-sm text-gray-600">Analytics</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  View comprehensive safety analytics
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 text-sm font-semibold">Generate →</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
