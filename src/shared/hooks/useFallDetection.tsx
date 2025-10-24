import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentLocation } from '../lib/utils';
import { playSiren, stopSiren, playWarningSound } from '../lib/siren';

type SOSStatus = 'standby' | 'alerting' | 'emergency';

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  total: number;
  timestamp: number;
}

interface FallDetectionContextType {
  isMonitoring: boolean;
  startMonitoring: (workerId: string) => Promise<void>;
  stopMonitoring: () => Promise<void>;
  showAlert: boolean;
  dismissAlert: () => void;
  triggerEmergency: (workerId?: string) => void;
  setWorkerId: (workerId: string) => void;
  sosStatus: SOSStatus;
  cancelSOS: () => Promise<void>;
  activeAlertId: string | null;
  accelerometerData: AccelerometerData | null;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'not-needed';
  isFeatureEnabled: boolean;
  alertDelaySeconds: number;
}

const FallDetectionContext = createContext<FallDetectionContextType | undefined>(undefined);

export function FallDetectionProvider({ children }: { children: React.ReactNode }) {
  // Check if fall detection is enabled via env variable
  const isFeatureEnabled = import.meta.env.VITE_ENABLE_FALL_DETECTION !== 'false';

  // Get alert delay from env (default 10 seconds)
  const alertDelaySeconds = parseInt(import.meta.env.VITE_FALL_ALERT_DELAY || '10', 10);
  const AUTO_ALERT_DELAY = alertDelaySeconds * 1000; // Convert to milliseconds

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentWorkerId, setCurrentWorkerId] = useState('');
  const [currentShiftId, setCurrentShiftId] = useState('');
  const [alertId, setAlertId] = useState('');
  const [sosStatus, setSosStatus] = useState<SOSStatus>('standby');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [accelerometerData, setAccelerometerData] = useState<AccelerometerData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'not-needed'>('unknown');

  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const FALL_THRESHOLD = 15; // m/s² - lowered for realistic detection

  useEffect(() => {
    if (!isMonitoring || !isFeatureEnabled) {
      setAccelerometerData(null);
      return;
    }

    const handleMotion = async (event: DeviceMotionEvent) => {
      if (!event.acceleration) {
        console.warn('No acceleration data available');
        return;
      }

      const { x, y, z } = event.acceleration;
      if (x === null || y === null || z === null) {
        console.warn('Acceleration values are null');
        return;
      }

      // Calculate total acceleration
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

      // Update UI with current readings
      setAccelerometerData({
        x,
        y,
        z,
        total: totalAcceleration,
        timestamp: Date.now(),
      });

      // Calculate change in acceleration
      const lastTotal = Math.sqrt(
        lastAccelerationRef.current.x ** 2 +
        lastAccelerationRef.current.y ** 2 +
        lastAccelerationRef.current.z ** 2
      );

      const accelerationChange = Math.abs(totalAcceleration - lastTotal);

      // Update last acceleration
      lastAccelerationRef.current = { x, y, z };

      // Debug logging
      console.log(`Accel: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}, total=${totalAcceleration.toFixed(2)}, change=${accelerationChange.toFixed(2)}`);

      // Check for fall (sudden spike in acceleration)
      if (accelerationChange > FALL_THRESHOLD) {
        console.warn(`🚨 FALL DETECTED! Change: ${accelerationChange.toFixed(2)} m/s² (threshold: ${FALL_THRESHOLD})`);
        await handleFallDetected();
      }
    };

    // Add event listener (permission is requested in startMonitoring)
    window.addEventListener('devicemotion', handleMotion);
    console.log('✅ DeviceMotion event listener added');

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      console.log('❌ DeviceMotion event listener removed');
    };
  }, [isMonitoring]);

  async function handleFallDetected() {
    if (showAlert) return; // Already showing an alert

    // Play warning sound immediately
    playWarningSound();

    const location = await getCurrentLocation();

    // Create safety alert
    const { data, error } = await supabase
      .from('safety_alerts')
      .insert({
        worker_id: currentWorkerId,
        status: 'unresponded',
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
        location_text: location?.text || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return;
    }

    if (data) {
      setAlertId(data.id);
      setShowAlert(true);

      // Start auto-alert timer
      alertTimeoutRef.current = setTimeout(async () => {
        // Auto-escalate to emergency if no response
        await triggerEmergency();
      }, AUTO_ALERT_DELAY);
    }
  }

  function dismissAlert() {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    // Update alert status to "safe"
    if (alertId) {
      const startTime = new Date(Date.now() - AUTO_ALERT_DELAY);
      const responseTime = Math.floor((Date.now() - startTime.getTime()) / 1000);

      supabase
        .from('safety_alerts')
        .update({
          status: 'safe',
          responded_at: new Date().toISOString(),
          response_time: responseTime,
        })
        .eq('id', alertId);
    }

    setShowAlert(false);
    setAlertId('');
  }

  async function triggerEmergency(providedWorkerId?: string | any) {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    // Play siren sound
    playSiren();
    setSosStatus('alerting');

    // If there's an existing alert, update it
    if (alertId) {
      await supabase
        .from('safety_alerts')
        .update({
          status: 'emergency',
          responded_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      setShowAlert(false);
      setAlertId('');
      setSosStatus('emergency');
      setActiveAlertId(alertId);
    } else {
      // Manual SOS - create a new emergency alert
      // Make sure providedWorkerId is actually a string, not an event object
      const validProvidedId = typeof providedWorkerId === 'string' ? providedWorkerId : undefined;
      const workerIdToUse = validProvidedId || currentWorkerId;

      if (!workerIdToUse) {
        console.error('No worker ID available for emergency');
        stopSiren();
        setSosStatus('standby');
        alert('❌ Unable to send alert. Please complete your profile first.');
        return;
      }

      const location = await getCurrentLocation();

      const { data, error } = await supabase
        .from('safety_alerts')
        .insert({
          worker_id: workerIdToUse,
          status: 'emergency',
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          location_text: location?.text || null,
          responded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating alert:', error);
        stopSiren();
        setSosStatus('standby');
        return;
      }

      // Set active alert
      setActiveAlertId(data.id);
      setSosStatus('emergency');

      // Show visual feedback
      alert('🚨 Emergency alert sent to managers!\n\nSiren is playing. Click "Cancel SOS" to stop.');
    }

    // Here you would also trigger push notifications to managers
    // For now, we've just created/updated the alert
  }

  async function cancelSOS() {
    // Stop siren
    stopSiren();

    // Update alert status if there's an active alert
    if (activeAlertId) {
      await supabase
        .from('safety_alerts')
        .update({
          status: 'safe',
          responded_at: new Date().toISOString(),
        })
        .eq('id', activeAlertId);

      setActiveAlertId(null);
    }

    // Reset status
    setSosStatus('standby');

    // Show confirmation
    alert('✅ SOS cancelled. Alert status updated to "Safe".');
  }

  function setWorkerId(workerId: string) {
    setCurrentWorkerId(workerId);
  }

  async function startMonitoring(workerId: string) {
    setCurrentWorkerId(workerId);

    // Only request permission if feature is enabled
    if (isFeatureEnabled) {
      // Request permission for iOS 13+
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          console.log('Requesting motion permission for iOS...');
          const permission = await (DeviceMotionEvent as any).requestPermission();
          console.log('Permission result:', permission);

          if (permission === 'granted') {
            setPermissionStatus('granted');
          } else {
            setPermissionStatus('denied');
            alert('❌ Motion sensor permission denied. Fall detection will not work. Please enable motion sensors in your browser settings.');
            return;
          }
        } catch (error) {
          console.error('Error requesting motion permission:', error);
          setPermissionStatus('denied');
          alert('❌ Error requesting motion sensor permission: ' + error);
          return;
        }
      } else {
        // Permission not needed (non-iOS or older iOS)
        console.log('Motion permission not required on this device');
        setPermissionStatus('not-needed');
      }
    } else {
      console.log('⚠️ Fall detection is disabled via VITE_ENABLE_FALL_DETECTION env variable');
    }

    // Create work shift
    const { data, error } = await supabase
      .from('work_shifts')
      .insert({
        worker_id: workerId,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting shift:', error);
      return;
    }

    if (data) {
      setCurrentShiftId(data.id);
      setIsMonitoring(true);
      console.log(isFeatureEnabled ? '✅ Fall detection monitoring started' : '✅ Work shift started (fall detection disabled)');
    }
  }

  async function stopMonitoring() {
    if (currentShiftId) {
      await supabase
        .from('work_shifts')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', currentShiftId);
    }

    setIsMonitoring(false);
    setCurrentWorkerId('');
    setCurrentShiftId('');
  }

  return (
    <FallDetectionContext.Provider
      value={{
        isMonitoring,
        startMonitoring,
        stopMonitoring,
        showAlert,
        dismissAlert,
        triggerEmergency,
        setWorkerId,
        sosStatus,
        cancelSOS,
        activeAlertId,
        accelerometerData,
        permissionStatus,
        isFeatureEnabled,
        alertDelaySeconds,
      }}
    >
      {children}
    </FallDetectionContext.Provider>
  );
}

export function useFallDetection() {
  const context = useContext(FallDetectionContext);
  if (context === undefined) {
    throw new Error('useFallDetection must be used within a FallDetectionProvider');
  }
  return context;
}
