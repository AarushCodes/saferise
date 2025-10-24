// Web Audio API Siren Sound Generator

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;

export function playSiren() {
  if (isPlaying) return;

  // Create audio context
  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Create oscillator for siren sound
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Siren parameters
  oscillator.type = 'sine';
  oscillator.frequency.value = 800; // Starting frequency
  gainNode.gain.value = 0.3; // Volume (0 to 1)

  // Create alternating siren effect (800Hz to 1200Hz)
  const now = audioContext.currentTime;
  const duration = 0.5; // Half second per tone

  // Oscillate between two frequencies
  for (let i = 0; i < 20; i++) { // 10 seconds total
    const time = now + (i * duration);
    const freq = i % 2 === 0 ? 800 : 1200;
    oscillator.frequency.setValueAtTime(freq, time);
  }

  // Start the siren
  oscillator.start(now);
  oscillator.stop(now + 10); // Stop after 10 seconds

  isPlaying = true;

  // Reset state when done
  oscillator.onended = () => {
    isPlaying = false;
    oscillator = null;
    gainNode = null;
    audioContext = null;
  };
}

export function stopSiren() {
  if (!isPlaying || !oscillator) return;

  try {
    oscillator.stop();
    oscillator.disconnect();
    gainNode?.disconnect();
    audioContext?.close();
  } catch (err) {
    console.error('Error stopping siren:', err);
  }

  isPlaying = false;
  oscillator = null;
  gainNode = null;
  audioContext = null;
}

export function isSirenPlaying(): boolean {
  return isPlaying;
}

// Warning sound for fall detection alert (different from emergency siren)
let warningAudioContext: AudioContext | null = null;
let warningOscillator: OscillatorNode | null = null;
let warningGainNode: GainNode | null = null;
let isWarningPlaying = false;

export function playWarningSound() {
  if (isWarningPlaying) return;

  // Create audio context
  warningAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Create oscillator for warning beep sound
  warningOscillator = warningAudioContext.createOscillator();
  warningGainNode = warningAudioContext.createGain();

  // Connect nodes
  warningOscillator.connect(warningGainNode);
  warningGainNode.connect(warningAudioContext.destination);

  // Warning beep parameters - higher pitch, shorter beeps
  warningOscillator.type = 'square'; // Square wave for more alerting sound
  warningOscillator.frequency.value = 1500; // Higher frequency for warning
  warningGainNode.gain.value = 0.25; // Slightly quieter than emergency siren

  const now = warningAudioContext.currentTime;
  const beepDuration = 0.15; // 150ms beep
  const pauseDuration = 0.15; // 150ms pause

  // Create beeping pattern (beep, pause, beep, pause, beep)
  for (let i = 0; i < 5; i++) {
    const startTime = now + (i * (beepDuration + pauseDuration));
    const endTime = startTime + beepDuration;

    warningGainNode.gain.setValueAtTime(0.25, startTime);
    warningGainNode.gain.setValueAtTime(0, endTime);
  }

  // Start and stop the warning sound
  warningOscillator.start(now);
  const totalDuration = 5 * (beepDuration + pauseDuration);
  warningOscillator.stop(now + totalDuration);

  isWarningPlaying = true;

  // Reset state when done
  warningOscillator.onended = () => {
    isWarningPlaying = false;
    warningOscillator = null;
    warningGainNode = null;
    warningAudioContext = null;
  };
}

export function stopWarningSound() {
  if (!isWarningPlaying || !warningOscillator) return;

  try {
    warningOscillator.stop();
    warningOscillator.disconnect();
    warningGainNode?.disconnect();
    warningAudioContext?.close();
  } catch (err) {
    console.error('Error stopping warning sound:', err);
  }

  isWarningPlaying = false;
  warningOscillator = null;
  warningGainNode = null;
  warningAudioContext = null;
}
