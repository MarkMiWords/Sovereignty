
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcousticLink } from '../context/AcousticLinkContext';

const LiveRules: React.FC = () => {
  const navigate = useNavigate();
  const { startSession } = useAcousticLink();
  const [hasAcousticCheck, setHasAcousticCheck] = useState(false);
  const [hasNarrativeCheck, setHasNarrativeCheck] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const handleEnterForge = async () => {
    setIsLinking(true);
    try {
      await startSession();
      navigate('/author-builder');
    } catch (err) {
      setIsLinking(false);
      alert("Acoustic Link failed. Check hardware.");
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-32 pb-32 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"></div>
      
      <section className="max-w-4xl mx-auto px-6 relative z-10">
        <button onClick={() => navigate('/')} className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mb-12 block hover:text-white transition-colors">← Abort Entry</button>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <span className="text-[var(--accent)] tracking-[0.8em] uppercase text-[10px] font-black block animate-pulse">Sovereign Protocol v8.0</span>
            <h1 className="text-6xl md:text-8xl font-serif font-black italic text-white tracking-tighter leading-none uppercase">Forge <br/><span className="text-[var(--accent)]">Guardrails.</span></h1>
            <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"Before the anvil is revealed, you must acknowledge the tech and the truth."</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--accent)] border-b border-white/5 pb-2">01. Acoustic Link</h2>
              <div className="space-y-6">
                <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-sm hover:border-[var(--accent)]/30 transition-all group">
                  <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-3">Latency Logic</h3>
                  <p className="text-gray-500 text-sm font-serif italic leading-relaxed">The Forge has a <span className="text-white font-bold underline decoration-[var(--accent)]">3-second delay</span>. Do not speak over Rap while she is processing.</p>
                </div>
                <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-sm hover:border-[var(--accent)]/30 transition-all group">
                  <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-3">Frequency Purity</h3>
                  <p className="text-gray-500 text-sm font-serif italic leading-relaxed">Background noise threatens transcription integrity. Your frequency is your ink.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-500 border-b border-white/5 pb-2">02. Narrative Protocol</h2>
              <div className="space-y-6">
                <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-sm hover:border-cyan-500/30 transition-all group">
                  <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-3">PII Responsibility</h3>
                  <p className="text-gray-500 text-sm font-serif italic leading-relaxed">Redact real names of staff and victims. We provide pseudonyms, but you provide the final audit.</p>
                </div>
                <div className="p-8 bg-red-900/10 border border-red-500/30 rounded-sm hover:bg-red-900/20 transition-all group">
                  <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-3">Terminal Boundaries</h3>
                  <p className="text-gray-400 text-sm font-serif italic leading-relaxed">Sexually explicit or gratuitously violent fetishism will terminate the link immediately.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-6 bg-black/60 p-10 border border-white/10 rounded-sm shadow-2xl">
            <label className="flex items-center gap-6 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={hasAcousticCheck} 
                  onChange={(e) => setHasAcousticCheck(e.target.checked)}
                  className="w-8 h-8 rounded-sm bg-black border-white/10 checked:bg-[var(--accent)] transition-all cursor-pointer appearance-none border" 
                />
                {hasAcousticCheck && <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-black font-black">✓</span>}
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">I accept the Acoustic Latency and Mic Protocols.</span>
            </label>

            <label className="flex items-center gap-6 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={hasNarrativeCheck} 
                  onChange={(e) => setHasNarrativeCheck(e.target.checked)}
                  className="w-8 h-8 rounded-sm bg-black border-white/10 checked:bg-[var(--accent)] transition-all cursor-pointer appearance-none border" 
                />
                {hasNarrativeCheck && <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-black font-black">✓</span>}
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">I will protect identities and maintain the Yard-Voice standard.</span>
            </label>

            <button 
              onClick={handleEnterForge}
              disabled={!hasAcousticCheck || !hasNarrativeCheck || isLinking}
              className={`w-full py-12 mt-8 text-[12px] font-black uppercase tracking-[0.8em] shadow-2xl transition-all rounded-sm relative overflow-hidden ${ (hasAcousticCheck && hasNarrativeCheck) ? 'animate-living-amber-bg text-white hover:scale-[1.02]' : 'bg-white/5 text-gray-800 cursor-not-allowed'}`}
            >
              {isLinking ? 'Linking Hardware...' : 'Initialize WRAPP CHAT'}
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 animate-progress-fast" style={{ width: isLinking ? '100%' : '0%' }}></div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LiveRules;
