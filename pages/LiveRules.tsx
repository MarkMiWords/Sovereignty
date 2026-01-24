
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LiveRules: React.FC = () => {
  const navigate = useNavigate();
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-24 pb-32 font-sans">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/author-builder')} className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mb-12 block hover:text-white transition-colors">← Cancel Link</button>
        
        <div className="space-y-16">
          <div className="space-y-4">
            <span className="text-[var(--accent)] tracking-[0.8em] uppercase text-[10px] font-black block animate-pulse">Pre-Flight Protocol</span>
            <h1 className="text-6xl md:text-8xl font-serif font-black italic text-white tracking-tighter leading-none uppercase">Acoustic <br/><span className="text-[var(--accent)]">Guardrails.</span></h1>
            <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"Before entering the acoustic link with WRAP, you must acknowledge the following behavioral and technical constraints."</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
             <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-sm group hover:border-[var(--accent)]/30 transition-all">
                <h3 className="text-[var(--accent)] text-[10px] font-black uppercase tracking-widest mb-4">01. The Acoustic Lag</h3>
                <p className="text-gray-400 text-sm font-serif italic leading-relaxed">The Forge processes complex narrative structures. There is a <span className="text-white font-bold underline decoration-[var(--accent)]">3-5 second delay</span>. Do not speak over WRAP while it is thinking.</p>
             </div>
             <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-sm group hover:border-red-500/30 transition-all">
                <h3 className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-4">02. Narrative Sovereignty</h3>
                <p className="text-gray-400 text-sm font-serif italic leading-relaxed">Ensure your environment is private. Acoustic signatures are sensitive digital evidence of life.</p>
             </div>
             <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-sm group hover:border-cyan-500/30 transition-all">
                <h3 className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mb-4">03. Transcription Focus</h3>
                <p className="text-gray-400 text-sm font-serif italic leading-relaxed">You will see WRAP's words appearing in real-time. Your own words are captured silently for the final sheet.</p>
             </div>
             <div className="p-8 bg-red-900/10 border border-red-500/30 rounded-sm group hover:bg-red-900/20 transition-all">
                <h3 className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-4">04. Content Termination</h3>
                <p className="text-gray-200 text-sm font-serif italic leading-relaxed">"You can say fuck, just dont talk about fuckin'.....ya know what i mean?"</p>
                <p className="text-red-500/60 text-[8px] font-black uppercase mt-4">Explicit sexual dialogue will sever the session immediately.</p>
             </div>
          </div>

          <div className="pt-8 space-y-8">
            <label className="flex items-center gap-4 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={hasAcknowledged} 
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="w-6 h-6 rounded-sm bg-black border-white/10 checked:bg-[var(--accent)] transition-all cursor-pointer" 
              />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">I understand the latency, security, and content protocols.</span>
            </label>

            <button 
              onClick={() => hasAcknowledged && navigate('/live-link')}
              disabled={!hasAcknowledged}
              className={`w-full py-8 text-[12px] font-black uppercase tracking-[0.6em] shadow-2xl transition-all rounded-sm ${hasAcknowledged ? 'animate-living-amber-bg text-white' : 'bg-white/5 text-gray-800 cursor-not-allowed'}`}
            >
              Initialize Acoustic Link
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LiveRules;
