
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcousticLink } from '../context/AcousticLinkContext';

const LiveSession: React.FC = () => {
  const navigate = useNavigate();
  const { isActive, isConnecting, isThinking, status, wrapTranscription, startSession, stopSession, sendHandshake } = useAcousticLink();

  const handleStartTour = async () => {
    if (!isActive) await startSession("Hello WRAP. Please give me a tour of the Forge page.");
    else sendHandshake("WRAP, please guide me to the Forge for a tour.");
    
    // Smooth transition
    setTimeout(() => navigate('/author-builder'), 1000);
  };

  return (
    <div className="bg-[#020202] min-h-screen text-white flex flex-col font-sans overflow-hidden">
      <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black">
        <button onClick={() => navigate('/author-builder')} className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors">← Exit Studio</button>
        <div className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-[var(--accent)]'}`}>{status}</div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto w-full px-6 relative">
        {!isActive && !isConnecting && (
          <div className="text-center space-y-12 animate-fade-in">
             <div className="space-y-6">
                <h1 className="text-7xl md:text-[8rem] font-serif font-black italic text-white tracking-tighter leading-none uppercase">Acoustic <br/><span className="text-[var(--accent)] animate-living-accent">Link.</span></h1>
                <p className="text-2xl text-gray-500 font-light italic max-w-xl mx-auto leading-relaxed">"Talk freely. Your story will be captured automatically."</p>
             </div>
             <button onClick={() => startSession()} className="px-24 py-8 text-white text-[12px] font-black uppercase tracking-[0.8em] shadow-2xl transition-all rounded-sm animate-living-amber-bg">Initialize Link</button>
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center gap-12">
             <div className="w-32 h-32 border-2 border-white/5 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-t-2 border-[var(--accent)] rounded-full animate-spin"></div>
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[var(--accent)] animate-pulse">Establishing Connection...</p>
          </div>
        )}

        {isActive && (
          <div className="w-full h-full flex flex-col gap-10 animate-fade-in py-12">
             <div className="flex-grow flex flex-col items-center justify-center relative group">
                <div className="w-full max-w-4xl text-center space-y-8">
                   <div className={`transition-all duration-700 min-h-[160px] flex flex-col items-center justify-center ${isThinking ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}>
                      <p className="text-4xl md:text-6xl font-serif italic text-white leading-tight tracking-tight">
                        {wrapTranscription || "Listening..."}
                      </p>
                   </div>
                   {isThinking && <p className="text-[10px] font-black uppercase tracking-[0.8em] text-[var(--accent)] animate-pulse">Working...</p>}
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6 pb-12">
                <button onClick={stopSession} className="group px-12 py-6 bg-black border border-white/5 text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 hover:text-white transition-all rounded-sm">Finish Session</button>
                <button onClick={handleStartTour} className="px-12 py-6 text-white text-[10px] font-black uppercase tracking-[0.5em] shadow-xl transition-all rounded-sm animate-living-amber-bg">Tour the Forge</button>
             </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LiveSession;
