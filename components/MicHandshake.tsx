
import React, { useState, useEffect, useRef } from 'react';

const MicHandshake: React.FC = () => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle' | 'calibrating' | 'ready' | 'denied'>('idle');
  const [level, setLevel] = useState(0);
  const [isNoiseCancelled, setIsNoiseCancelled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const handleManualTrigger = () => {
      setStatus('idle');
      setLevel(0);
      setShow(true);
    };

    window.addEventListener('aca:open_mic_check', handleManualTrigger);
    return () => window.removeEventListener('aca:open_mic_check', handleManualTrigger);
  }, []);

  const stopAudio = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    animationRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
  };

  const startCalibration = async () => {
    setStatus('calibrating');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          noiseSuppression: isNoiseCancelled,
          echoCancellation: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        const normalized = Math.min(100, (average / 128) * 100);
        setLevel(normalized);
        if (normalized > 10) setStatus('ready');
        animationRef.current = requestAnimationFrame(checkLevel);
      };

      checkLevel();
    } catch (err) {
      setStatus('denied');
    }
  };

  const closeHandshake = () => {
    stopAudio();
    sessionStorage.setItem('aca_handshake_v2_complete', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-xl w-full bg-[#0a0a0a] border border-white/10 p-12 rounded-sm shadow-2xl relative">
        <button onClick={() => setShow(false)} className="absolute top-6 right-6 text-gray-700 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        <div className="text-center space-y-6">
          <span className="text-[var(--accent)] tracking-[0.5em] uppercase text-[9px] font-black block">Acoustic Link</span>
          <h2 className="text-4xl font-serif italic text-white tracking-tighter uppercase">Calibration.</h2>
          <p className="text-gray-500 text-sm italic font-light">"Before establishing an acoustic link, let's make sure your environment is ready for transcription."</p>
        </div>

        <div className="mt-10 space-y-8">
          {status === 'idle' && (
            <button onClick={startCalibration} className="w-full py-6 animate-living-amber-bg text-white text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl transition-all rounded-sm">Initiate Mic Link</button>
          )}

          {(status === 'calibrating' || status === 'ready') && (
            <div className="space-y-6">
              <div className="h-16 bg-black border border-white/5 rounded-sm overflow-hidden flex items-end gap-1 p-2">
                 {[...Array(20)].map((_, i) => (
                   <div key={i} className="flex-grow bg-[var(--accent)] transition-all duration-75" style={{ height: `${level > 5 ? (Math.random() * level + 10) : 5}%`, opacity: 0.3 + (i / 20) }}></div>
                 ))}
              </div>
            </div>
          )}

          {status === 'ready' && (
            <button onClick={closeHandshake} className="w-full py-6 bg-green-500 text-white text-[11px] font-black uppercase tracking-[0.5em] rounded-sm hover:brightness-110 shadow-xl">Complete Calibration</button>
          )}

          {status === 'denied' && (
            <div className="p-8 bg-red-500/10 border border-red-500/30 text-center rounded-sm">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Acoustic Error</p>
              <p className="text-gray-500 text-xs mt-2 italic">Please enable microphone access in your browser settings to continue.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicHandshake;
