import { useState, useEffect } from 'react';
import { Button } from './Button';

interface FallAlertModalProps {
  isOpen: boolean;
  onSafe: () => void;
  onEmergency: () => void;
}

export function FallAlertModal({ isOpen, onSafe, onEmergency }: FallAlertModalProps) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(60);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onEmergency(); // Auto-trigger emergency
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onEmergency]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pulse-slow">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 opacity-95 animate-pulse" />

      {/* Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Warning Icon */}
        <div className="text-8xl mb-4 animate-bounce">
          ⚠️
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-red-600 mb-2">
          HIGH RISK DETECTED
        </h1>

        {/* Message */}
        <p className="text-xl text-gray-800 mb-6">
          Are you OK?
        </p>

        {/* Countdown */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-900 mb-2">
            {countdown}
          </div>
          <div className="text-sm text-gray-600">
            Auto-alert in {countdown} seconds
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-xl py-6"
            onClick={onSafe}
          >
            ✓ I'M SAFE
          </Button>

          <Button
            size="lg"
            variant="danger"
            className="w-full text-xl py-6"
            onClick={onEmergency}
          >
            🚨 EMERGENCY - ALERT MANAGER
          </Button>
        </div>

        {/* Pulse indicator */}
        <div className="mt-6 flex justify-center">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  );
}
