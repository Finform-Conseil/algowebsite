type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export const playAlertSound = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  const AudioContextConstructor = window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
  if (!AudioContextConstructor) return;

  let audioContext: AudioContext | null = null;
  try {
    audioContext = new AudioContextConstructor();
    if (audioContext.state === "suspended") await audioContext.resume();

    const startAt = audioContext.currentTime;
    const stopAt = startAt + 0.24;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(1320, startAt + 0.08);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(stopAt);
    oscillator.onended = () => {
      void audioContext?.close();
    };
  } catch {
    if (audioContext) void audioContext.close();
  }
};
