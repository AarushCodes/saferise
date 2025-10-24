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
