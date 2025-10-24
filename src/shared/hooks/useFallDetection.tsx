import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentLocation } from '../lib/utils';
import { playSiren, stopSiren } from '../lib/siren';

type SOSStatus = 'standby' | 'alerting' | 'emergency';

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
}

const FallDetectionContext = createContext<FallDetectionContextType | undefined>(undefined);

export function FallDetectionProvider({ children }: { children: React.ReactNode }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentWorkerId, setCurrentWorkerId] = useState('');
  const [currentShiftId, setCurrentShiftId] = useState('');
  const [alertId, setAlertId] = useState('');
  const [sosStatus, setSosStatus] = useState<SOSStatus>('standby');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const FALL_THRESHOLD = 20; // m/s² - adjust based on testing
  const AUTO_ALERT_DELAY = 60000; // 60 seconds

  useEffect(() => {
    if (!isMonitoring) return;

    let permissionGranted = false;

    const handleMotion = async (event: DeviceMotionEvent) => {
      if (!permissionGranted || !event.acceleration) return;

      const { x, y, z } = event.acceleration;
      if (x === null || y === null || z === null) return;

      // Calculate total acceleration
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

      // Calculate change in acceleration
      const lastTotal = Math.sqrt(
        lastAccelerationRef.current.x ** 2 +
        lastAccelerationRef.current.y ** 2 +
        lastAccelerationRef.current.z ** 2
      );

      const accelerationChange = Math.abs(totalAcceleration - lastTotal);

      // Update last acceleration
      lastAccelerationRef.current = { x, y, z };

      // Check for fall (sudden spike in acceleration)
      if (accelerationChange > FALL_THRESHOLD) {
        await handleFallDetected();
      }
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          permissionGranted = permission === 'granted';
        } catch (error) {
          console.error('Error requesting motion permission:', error);
        }
      } else {
        // Permission not needed (non-iOS or older iOS)
        permissionGranted = true;
      }

      if (permissionGranted) {
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [isMonitoring]);

  async function handleFallDetected() {
    if (showAlert) return; // Already showing an alert

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
