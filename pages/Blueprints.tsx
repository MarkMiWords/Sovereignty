
import React from 'react';
import { Link } from 'react-router-dom';

const Blueprints: React.FC = () => {
  const sections = [
    {
      id: "industrial-logic",
      title: "Industrial Logic & UX",
      items: [
        { name: "The 'Polish' Pivot", desc: "Transitioned from 'Produce' to 'Polish' to better reflect the alchemical transformation of raw carceral grit into refined legacy." },
        { name: "Acoustic Feedback", desc: "Implemented high-intensity neon flashing for 'Revise' and 'Polish' blocks to provide immediate visual confirmation of AI thought processes." },
        { name: "Registry Identifier Protocol", desc: "Docx import is set to detect the first H1 or H2 as the definitive title for the Sovereign Vault." }
      ]
    },
    {
      id: "polish-suite",
      title: "The Polish Suite (Block P)",
      items: [
        { 
          name: "1. Polish the Story", 
          desc: "Focus on 'bones'. Character arcs must be visible. Dialogue tightened for subtext. Pacing balanced to avoid back-loading. Rule: Emotional detachment required." 
        },
        { 
          name: "2. Polish the Poetry", 
          desc: "Precision and syllable weight. Smooth rhythm breaks. Rule: 'Case Weight'—treat poems like a suitcase with a weight limit. Replace passive verbs with evocative actions." 
        },
        { 
          name: "3. Polish the Imagery", 
          desc: "Sensory Depth. Beyond visual: smell, taste, texture. 'Show, Don't Tell'. Use specific, non-cliché metaphors (e.g. Grief as a stone slab)." 
        },
        { 
          name: "4. Polish Subtext & Theme", 
          desc: "Resonance layer. Dialogue should mean more than it says. Motif identification and symbol refinement. Demonstration over mention." 
        },
        { 
          name: "5. Polish a Turd", 
          desc: "Deep Tissue Revision. Transforming fundamentally weak first drafts by finding the hidden core and performing structural reconstruction." 
        }
      ]
    },
    {
      id: "acoustic-matrix",
      title: "Acoustic Matrix (Articulate)",
      items: [
        { name: "Signature Hierarchy", desc: "'My Own Clone' sits at the pinnacle of the accent/voice dropdown once calibrated." },
        { name: "Gender Matrix Colors", desc: "Neon Blue (M), Neon Pink (F), Industrial White (N)." },
        { name: "Calibration Styles", desc: "Soft, Normal, Loud." },
        { name: "Regional Accents", desc: "Australian, English, American." },
        { name: "Temporal Calibration", desc: "Speeds: 1.0x, 1.25x, 1.5x." }
      ]
    },
    {
      id: "research-safety",
      title: "Research, Safety & Privacy",
      items: [
        { name: "PII Audit", desc: "Automated scanning for names of staff, facilities, and victims to prevent defamation risks." },
        { name: "Economy", desc: "$10 Sovereign Pass utility rate covers high-volume token overhead and 10GB secure vault storage." },
        { name: "Business Philosophy", desc: "Author Direct Pay—platform takes 0% from author sales." }
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
        <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"The master record of process, description, and industrial intent."</p>
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
