
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
          name: "1. Polish the Story (Structure & Pacing)", 
          desc: "Focus on the 'bones' before fine-tuning. Strengthen Character Arcs: Protagonist’s growth/mistakes must be visible. Tighten Dialogue: Remove 'small talk'; use only to reveal character or create tension. Evaluate Pacing: Balance turning points; avoid back-loading endings. Rule: Detach emotionally before editing." 
        },
        { 
          name: "2. Polish the Poetry (Sound & Form)", 
          desc: "Precision and syllable weight. Read Aloud: Critical step to find rhythm breaks. Condense Language: Treat poems like a suitcase with a weight limit—every word must earn its place. Replace passive verbs with evocative actions (e.g., 'excoriate' instead of 'is'). structure experimentation required." 
        },
        { 
          name: "3. Polish the Imagery (Sensory Depth)", 
          desc: "Transform flat descriptions into immersive experiences. Beyond Visuals: Ground scenes in smell, taste, and texture. Be Specific: Replace 'pie smelled good' with 'scent of warm apples and cinnamon'. Show, Don't Tell: Describe white knuckles and shallow breath rather than just 'terrified'. Use strategic, non-cliché metaphors." 
        },
        { 
          name: "4. Polish Subtext & Theme", 
          desc: "Transforms simple narrative into lasting resonance. Layering Subtext: Characters say one thing but mean another; use body language and unspoken history. Motif & Symbolism: Refine recurring images into symbols (e.g., rain shifting from literal to inner cleansing). Theme Integration: Central message must be demonstrated through character flaws." 
        },
        { 
          name: "5. Polish a Turd (Deep Tissue)", 
          desc: "Deep Tissue Revision for fundamentally weak drafts. Moving beyond proofreading to find the story's hidden core. If a user clicks this, they are signaling that they don't believe the draft is good and need the AI to rebuild it with intense literary transformation." 
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
