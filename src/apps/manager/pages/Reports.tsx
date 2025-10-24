import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Card, CardBody, Button } from '../../../shared/components';

interface ReportData {
  totalWorkers: number;
  certifiedWorkers: number;
  totalCheckIns: number;
  totalIncidents: number;
  nearMissCount: number;
  unsafeConditionCount: number;
  totalAlerts: number;
  emergencyCount: number;
  safeCount: number;
  totalJobs: number;
  openJobs: number;
  avgSleepHours: number;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadReportData();
  }, [timeRange]);

  async function loadReportData() {
    try {
      // Calculate date range
      let dateFilter = new Date();
      if (timeRange === 'week') {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (timeRange === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else {
        dateFilter = new Date(0); // All time
      }
      const dateString = dateFilter.toISOString();

      // Get all data in parallel
      const [
        workersRes,
        checkInsRes,
        incidentsRes,
        alertsRes,
        jobsRes,
      ] = await Promise.all([
        supabase.from('worker_profiles').select('is_certified', { count: 'exact' }),
        supabase.from('daily_check_ins').select('sleep_hours', { count: 'exact' }).gte('created_at', dateString),
        supabase.from('incidents').select('type', { count: 'exact' }).gte('created_at', dateString),
        supabase.from('safety_alerts').select('status', { count: 'exact' }).gte('created_at', dateString),
        supabase.from('jobs').select('status', { count: 'exact' }),
      ]);

      const workers = workersRes.data || [];
      const checkIns = checkInsRes.data || [];
      const incidents = incidentsRes.data || [];
      const alerts = alertsRes.data || [];
      const jobs = jobsRes.data || [];

      const reportData: ReportData = {
        totalWorkers: workersRes.count || 0,
        certifiedWorkers: workers.filter(w => w.is_certified).length,
        totalCheckIns: checkInsRes.count || 0,
        totalIncidents: incidentsRes.count || 0,
        nearMissCount: incidents.filter(i => i.type === 'near-miss').length,
        unsafeConditionCount: incidents.filter(i => i.type === 'unsafe-condition').length,
        totalAlerts: alertsRes.count || 0,
        emergencyCount: alerts.filter(a => a.status === 'emergency').length,
        safeCount: alerts.filter(a => a.status === 'safe').length,
        totalJobs: jobsRes.count || 0,
        openJobs: jobs.filter(j => j.status === 'open').length,
        avgSleepHours: checkIns.length > 0
          ? Math.round((checkIns.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / checkIns.length) * 10) / 10
          : 0,
      };

      setData(reportData);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Generating reports...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading report data</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Safety Reports</h1>
              <p className="text-sm text-gray-600">Analytics and insights</p>
            </div>
            <Link to="/manager">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === 'week' ? 'primary' : 'secondary'}
              onClick={() => setTimeRange('week')}
              size="sm"
            >
              Last Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'primary' : 'secondary'}
              onClick={() => setTimeRange('month')}
              size="sm"
            >
              Last Month
            </Button>
            <Button
              variant={timeRange === 'all' ? 'primary' : 'secondary'}
              onClick={() => setTimeRange('all')}
              size="sm"
            >
              All Time
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Workers Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">👷 Workforce</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Total Workers</p>
                <p className="text-3xl font-bold text-blue-600">{data.totalWorkers}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Certified</p>
                <p className="text-3xl font-bold text-green-600">{data.certifiedWorkers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.totalWorkers > 0 ? Math.round((data.certifiedWorkers / data.totalWorkers) * 100) : 0}% of workforce
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Avg Sleep (hrs)</p>
                <p className="text-3xl font-bold text-purple-600">{data.avgSleepHours}</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Safety Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚨 Safety Alerts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Total Alerts</p>
                <p className="text-3xl font-bold text-yellow-600">{data.totalAlerts}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Emergencies</p>
                <p className="text-3xl font-bold text-red-600">{data.emergencyCount}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Resolved Safely</p>
                <p className="text-3xl font-bold text-green-600">{data.safeCount}</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Incidents Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Incident Reports</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Total Incidents</p>
                <p className="text-3xl font-bold text-orange-600">{data.totalIncidents}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Near-Miss</p>
                <p className="text-3xl font-bold text-yellow-600">{data.nearMissCount}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Unsafe Conditions</p>
                <p className="text-3xl font-bold text-orange-600">{data.unsafeConditionCount}</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Check-Ins & Jobs Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Daily Check-Ins</p>
                <p className="text-3xl font-bold text-blue-600">{data.totalCheckIns}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                <p className="text-3xl font-bold text-purple-600">{data.totalJobs}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-600 mb-1">Open Jobs</p>
                <p className="text-3xl font-bold text-green-600">{data.openJobs}</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Summary */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Summary</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Workforce:</span> {data.totalWorkers} total workers with{' '}
                {data.certifiedWorkers} certified ({data.totalWorkers > 0 ? Math.round((data.certifiedWorkers / data.totalWorkers) * 100) : 0}%)
              </p>
              <p>
                <span className="font-semibold">Safety Performance:</span> {data.totalAlerts} alerts recorded,{' '}
                {data.emergencyCount} emergencies, {data.safeCount} resolved safely
              </p>
              <p>
                <span className="font-semibold">Incident Rate:</span> {data.totalIncidents} total incidents{' '}
                ({data.nearMissCount} near-miss, {data.unsafeConditionCount} unsafe conditions)
              </p>
              <p>
                <span className="font-semibold">Engagement:</span> {data.totalCheckIns} check-ins completed{' '}
                with an average of {data.avgSleepHours} hours of sleep reported
              </p>
              <p>
                <span className="font-semibold">Jobs:</span> {data.totalJobs} total jobs with {data.openJobs} currently open
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
