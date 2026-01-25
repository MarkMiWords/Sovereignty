
import React from 'react';
import { Link } from 'react-router-dom';

const Blueprints: React.FC = () => {
  const sections = [
    {
      id: "sovereign-spine",
      title: "The Sovereign Spine (v5.5)",
      items: [
        { name: "Grit Sovereignty", desc: "Dialect and slang are treated as high-value assets, not errors. The engine is hard-coded to ignore standard grammar conventions that threaten the author's authentic regional yard-voice." },
        { name: "Operational Security Layer", desc: "Automated redaction of PII (Personally Identifiable Information). Real names of COs, staff, facilities, or victims are flagged and substituted with realistic fictional pseudonyms." },
        { name: "Author Primacy Protocol", desc: "The AI is a partner, not a professor. It never 'corrects' without context. All outputs are presented as 'Forged' suggestions where the author retains final sovereign approval." }
      ]
    },
    {
      id: "hierarchy-of-control",
      title: "Mastering Suite: Levels of Control",
      items: [
        { 
          name: "L1: RINSE (Surface)", 
          desc: "Gray Pulse Logic. Surface-level only. Fixes blatant typos and punctuation. Zero changes to sentence structure, slang, or cadence. Voice remains identical to the raw draft." 
        },
        { 
          name: "L2: WASH (Basic Flow)", 
          desc: "Amber Glow Logic. Smooths awkward transitions and ensures consistent tense. Vocabulary and regional dialect are preserved 100% while improving basic readability." 
        },
        { 
          name: "L3: SCRUB (Structural Forging)", 
          desc: "Red Flicker Logic. Moves paragraphs for better narrative impact. Tightens prose by removing redundant fillers. Enforces specific Style (Fiction/Memoir) constraints while maintaining 'Yard Grit'." 
        },
        { 
          name: "L4: POLISH (Literary Mastering)", 
          desc: "Emerald Sine Logic. High-fidelity refinement. Adjusts the 'sound' for specific mediums (Substack vs. Paperback). Injects higher-intensity vocabulary while weighting transitions for maximum resonance." 
        },
        { 
          name: "L5: ALCHEMICAL (Deep Tissue)", 
          desc: "Neon Strobe Logic. Total reconstruction from the 'soul out'. Finds the hidden emotional core of a weak draft and rebuilds the structure using professional literary techniques while preserving the author's intended truth." 
        }
      ]
    },
    {
      id: "regional-matrix",
      title: "Regional Context Matrix",
      items: [
        { name: "AU (Australia)", desc: "Focus on the 'Yard', 'The Wire', 'The Wallies'. Dry, rhythmic carceral cadence specific to Australian state-justice environments." },
        { name: "US (North America)", desc: "State-specific dialects, 'The Feds', 'The County'. Legal terminology focused on Bail/Bond and US-centric facility structures." },
        { name: "UK / Global", desc: "Focus on 'The Wing', 'The Landing', and 'Human Rights' grounding. Preserves the specific slang of the UK carceral system." }
      ]
    },
    {
      id: "acoustic-logic",
      title: "Acoustic Profile (Articulate)",
      items: [
        { name: "Breath Logic", desc: "The engine specifically shortens sentence lengths for oral delivery to facilitate natural dramatic pauses and ease of breathing during storytelling sessions." },
        { name: "Mouth-feel (Phonetics)", desc: "Favors plosive consonants (P, B, T, K) and evocative imagery that provides better sensory resonance when read aloud in a cell or stage setting." },
        { name: "Clone Calibration", desc: "Mirrors the author's recorded frequency response. High-intensity matching of the author's specific speed (Aggressive/Fast vs. Reflective/Slow)." }
      ]
    },
    {
      id: "business-philosophy",
      title: "Economic Sovereignty",
      items: [
        { name: "Author Direct Pay", desc: "0% Commission path. Authors keep 100% of their subscriber or retail revenue. The platform operates on a flat utility rate ($10) to cover token overhead." },
        { name: "Archive Storage", desc: "10GB of immutable secure vault storage provided for every Sovereign Pass holder to ensure legacy persistence." }
      ]
    }
  ];

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-orange-500/30 pb-32">
      <section className="max-w-7xl mx-auto px-6 py-24 border-b border-white/5">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></div>
           <span className="text-cyan-500 tracking-[0.8em] uppercase text-[10px] font-black block">Clearance Level: ARCHITECT</span>
        </div>
        <h1 className="text-6xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-none mb-6 uppercase">SOVEREIGN <br/><span className="text-cyan-500">BLUEPRINTS.</span></h1>
        <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"The master record of process, description, and industrial intent. Reference v5.5."</p>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
           {sections.map((sec) => (
             <div key={sec.id} className="space-y-10 bg-[#0a0a0a] border border-white/5 p-12 rounded-sm shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-6xl font-serif italic pointer-events-none select-none">{sec.id.toUpperCase()}</div>
                <h2 className="text-3xl font-serif italic text-white border-b border-cyan-500/20 pb-6">{sec.title}</h2>
                <div className="space-y-8">
                  {sec.items.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                       <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{item.name}</h4>
                       <p className="text-gray-400 text-sm font-light leading-relaxed italic">"{item.desc}"</p>
                    </div>
                  ))}
                </div>
             </div>
           ))}
        </div>

        <div className="mt-20 p-12 bg-white/5 border border-white/10 rounded-sm text-center">
           <h3 className="text-xl font-serif italic text-white mb-4">Continuous Evolution Protocol</h3>
           <p className="text-gray-500 text-sm font-light max-w-2xl mx-auto">This page is the immutable context for the platform's development. Every major shift in the Sovereign Forge logic must be documented here to maintain architectural integrity.</p>
           <div className="mt-10">
              <Link to="/author-builder" className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-all underline underline-offset-8">Return to Active Forging</Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Blueprints;
