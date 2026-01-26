
import React from 'react';
import { Link } from 'react-router-dom';

const Blueprints: React.FC = () => {
  const scripts = [
    {
      title: "Movement 1: The Sovereign Welcome (Atmosphere & Intent)",
      text: '"Author, the link is solid. You are standing in the Sovereign Forge—a workspace where the \'Grammar Barrier\' is dismantled. Here, you are able to tell, or type your story. You can call me Rap, your Writing, Revision, Articulation and Polishing Partner on the wire. You can change my name, or yours, in the profile settings. Are you ready to transform raw truth and fiction into retail-ready manuscripts?"'
    },
    {
      title: "Movement 2: The Hub Mechanics (The Four Core Blocks)",
      text: '"Where you are seeing my words is a digital sheet of paper that we call, the Sheet. Above it you might notice a flashing orange box. That\'s The Write block, it captures your truth. The Revise block performs structural scrubs without stripping the grit. The Articulate block tunes me up to read your stories back to you. And the Polish block masterfully prepares your Sheet for export. Each station is specialized for a different stage of the forge."'
    },
    {
      title: "Movement 3: The Perimeter (Navigator & Partner Sidebars)",
      text: '"Finally, observe the perimeter. To your left, the Navigator lets you start a new sheet and secures your history in the Vault. To your right, the Partner desk is where our dialogue lives—ask me for insights, legal safety checks, or scene Manifestations there. Don\'t forget to choose your story type or region, because that helps me know how to guide your flow. Hit the WRAPP PROFILE heading to go to profiles and change things up. Also, the glowing orange lines can be moved to customise your workspace, which I will now leave you with...don\'t forget to have fun."'
    }
  ];

  const sections = [
    {
      id: "sovereign-spine",
      title: "The Sovereign Spine (v8.0)",
      items: [
        { name: "Acoustic Ink", desc: "During orientation, transcription flows directly into the digital sheet, splitting greetings into headings and descriptions into body text. Typing speed is throttled to 45ms to mirror natural speech rhythm." },
        { name: "Grit Sovereignty", desc: "Dialect and slang are treated as high-value assets, not errors. The engine is hard-coded to ignore standard grammar conventions that threaten the author's authentic regional yard-voice." },
        { name: "Operational Security Layer", desc: "Automated redaction of PII (Personally Identifiable Information). Real names of COs, staff, facilities, or victims are flagged and substituted with realistic fictional pseudonyms." }
      ]
    },
    {
      id: "hierarchy-of-control",
      title: "Mastering Suite: Levels of Control",
      items: [
        { name: "L1: RINSE", desc: "Surface-level punctuation and typo fixes. Zero voice impact." },
        { name: "L2: WASH", desc: "Transition smoothing. Maintains 100% regional dialect." },
        { name: "L3: SCRUB", desc: "Structural forging. Narratives are weighted for maximum impact." },
        { name: "L4: POLISH", desc: "Literary mastering. High-intensity vocabulary injection." }
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
        <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">"The master record of process, description, and industrial intent. Reference v8.0."</p>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-32">
        {/* Scripts Archive Section */}
        <section className="space-y-12">
           <div className="flex items-center gap-4">
              <div className="h-px flex-grow bg-white/10"></div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.8em] text-[var(--accent)]">Operational Scripts</h2>
              <div className="h-px flex-grow bg-white/10"></div>
           </div>
           <div className="grid gap-8">
              {scripts.map((s, i) => (
                <div key={i} className="p-10 bg-[#0a0a0a] border border-white/5 rounded-sm group hover:border-[var(--accent)]/30 transition-all">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-4">{s.title}</h4>
                  <p className="text-xl font-serif italic text-gray-400 leading-relaxed group-hover:text-white transition-colors">{s.text}</p>
                </div>
              ))}
           </div>
        </section>

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
