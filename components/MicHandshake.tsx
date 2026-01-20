
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
    // Check if we need to show the handshake
    const hasCalibrated = sessionStorage.getItem('aca_handshake_v2_complete') === 'true';
    
    // Logic: Always show if session is new OR if we haven't seen the "complete" flag
    if (!hasCalibrated) {
      setShow(true);
    }

    // Listener for manual trigger from Footer or other components
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
      // Direct request for high-quality audio with noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          noiseSuppression: isNoiseCancelled,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      
      // CRITICAL: Browsers block audio until a click occurs. This button click handles it.
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
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        
        const average = sum / bufferLength;
        const normalized = Math.min(100, (average / 128) * 100);
        setLevel(normalized);
        
        // "Ready" only when a real signal is detected (avoiding background hum)
        if (normalized > 20) { 
           setStatus('ready');
        }
        animationRef.current = requestAnimationFrame(checkLevel);
      };

      checkLevel();
    } catch (err) {
      console.error("Acoustic Handshake System Failure:", err);
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
      {/* Structural Backdrop Decor */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--accent) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      <div className="max-w-xl w-full bg-[#0a0a0a] border border-white/10 p-12 rounded-sm shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Manual Close for Returning Users */}
        <button 
          onClick={() => setShow(false)}
          className="absolute top-6 right-6 text-gray-800 hover:text-white transition-colors text-2xl leading-none z-20"
          title="Skip Calibration"
        >
          &times;
        </button>

        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50"></div>
        
        <div className="relative z-10 space-y-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-2 mb-4">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
               ))}
            </div>
            <span className="text-[var(--accent)] tracking-[1em] uppercase text-[9px] font-black block">Acoustic Link v4.3</span>
            <h2 className="text-5xl font-serif font-black italic text-white tracking-tighter leading-none">Hardware <br/><span className="text-[var(--accent)]">Verification.</span></h2>
            <p className="text-gray-500 text-sm italic font-light leading-relaxed max-w-sm mx-auto">
              "We must ensure your voice is captured with absolute fidelity before entering the archive."
            </p>
          </div>

          <div className="space-y-8">
            {status === 'idle' && (
              <button 
                onClick={startCalibration}
                className="w-full py-6 animate-living-amber-bg text-white text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all rounded-sm"
              >
                Engage Acoustic Link
              </button>
            )}

            {(status === 'calibrating' || status === 'ready') && (
              <div className="space-y-6">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                   <span>Oscilloscope Feed</span>
                   <span className={level > 20 ? 'text-green-500 animate-pulse' : 'text-orange-500'}>
                     {level > 20 ? 'SIGNAL DETECTED' : 'Awaiting Input...'}
                   </span>
                </div>
                
                {/* Visualizer Grid */}
                <div className="h-20 bg-black border border-white/5 rounded-sm overflow-hidden flex items-end gap-[2px] p-4 relative">
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                   {[...Array(30)].map((_, i) => {
                     const height = Math.random() * (level + 5);
                     return (
                       <div 
                         key={i} 
                         className={`flex-grow transition-all duration-75 ${level > 20 ? 'bg-[var(--accent)]' : 'bg-gray-800'}`}
                         style={{ 
                           height: `${Math.max(5, height)}%`,
                           opacity: 0.2 + (i / 30)
                         }}
                       ></div>
                     );
                   })}
                </div>
                
                <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-sm">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Atmospheric Scrubbing</p>
                      <p className="text-[9px] text-gray-600 italic">Hardware noise suppression is active.</p>
                   </div>
                   <button 
                     onClick={() => setIsNoiseCancelled(!isNoiseCancelled)}
                     className={`w-14 h-7 rounded-full transition-all relative ${isNoiseCancelled ? 'bg-green-500' : 'bg-gray-800'}`}
                   >
                     <div className={`absolute top-1.5 w-4 h-4 rounded-full bg-white transition-all ${isNoiseCancelled ? 'left-8' : 'left-1.5'}`}></div>
                   </button>
                </div>
              </div>
            )}

            {status === 'ready' && (
              <button 
                onClick={closeHandshake}
                className="w-full py-6 bg-green-500 text-white text-[11px] font-black uppercase tracking-[0.5em] shadow-[0_0_50px_rgba(34,197,94,0.4)] animate-fade-in rounded-sm hover:brightness-110"
              >
                Access Granted: Enter Forge
              </button>
            )}

            {status === 'denied' && (
              <div className="p-8 bg-red-500/10 border border-red-500/30 text-center rounded-sm space-y-4">
                <div className="text-red-500 text-[20px] mb-2">⚠</div>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-none">Handshake Severed</p>
                <p className="text-gray-500 text-xs italic leading-relaxed">
                  The browser blocked the acoustic link. Check the address bar "lock" icon and set Microphone to "Allow".
                </p>
                <button onClick={() => window.location.reload()} className="block mx-auto text-[9px] font-black text-white uppercase tracking-widest underline underline-offset-8 mt-4 hover:text-[var(--accent)]">Reset Handshake</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default MicHandshake;
