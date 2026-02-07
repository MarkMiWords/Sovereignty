
import React from 'react';

const Forge: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen">

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 text-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2500&auto=format&fit=crop"
            className="w-full h-full object-cover grayscale brightness-[0.25] scale-105"
            alt="The Anvil"
          />
          <div className="absolute inset-0 bg-black/40 z-[1]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-[2]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80 z-[2]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px] z-[1]" style={{ backgroundColor: 'var(--accent-glow)' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl px-4">
          <span className="text-orange-500 tracking-[0.8em] md:tracking-[1em] uppercase text-[8px] md:text-[10px] font-black block mb-6 md:mb-8 animate-fade-in">
            Sovereign Production
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif font-black italic text-white tracking-tighter leading-[0.85] mb-6 md:mb-8 animate-slide-up">
            The <span className="animate-living-accent" style={{ color: 'var(--accent)' }}>Forge.</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 font-light italic max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Where raw truth becomes print-ready.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 md:py-28 px-4 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-base sm:text-lg md:text-xl text-gray-400 font-light italic leading-relaxed border-l-2 pl-6 sm:pl-10 py-4" style={{ borderLeftColor: 'var(--accent-glow)' }}>
            The Word Forge is a sovereign digital workspace built for incarcerated and formerly incarcerated authors. Step inside and create your own digital Wrap Sheets — designed to feature your work across multiple formats, from print to digital distribution. Stuck for ideas? Open a Live Link session with Rap, your AI co-pilot, designed to help you push past creative blocks and produce print-worthy content, straight out of the box.
          </p>
        </div>
      </section>

      {/* What is WRAP */}
      <section className="py-16 md:py-28 px-4 sm:px-8 lg:px-16 bg-[#080808] border-y border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <span className="tracking-[0.6em] uppercase text-[9px] font-black block mb-4 animate-living-accent" style={{ color: 'var(--accent)' }}>The System</span>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black italic text-white tracking-tighter">
              What is <span style={{ color: 'var(--accent)' }}>WRAP</span>?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            {/* Writing */}
            <div className="space-y-4 sm:space-y-6 p-6 sm:p-10 bg-black border border-white/5 rounded-sm group hover:border-[var(--accent)]/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-[var(--accent)]/30 rounded-sm">
                  <span className="text-lg md:text-xl font-black" style={{ color: 'var(--accent)' }}>W</span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif italic text-white">Writing</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light italic">
                Your story starts here. Lay down your truth, your way. Use dictation and see your words appear on the sheet. Or type it out and turn prose into poetry.
              </p>
            </div>

            {/* Revising */}
            <div className="space-y-4 sm:space-y-6 p-6 sm:p-10 bg-black border border-white/5 rounded-sm group hover:border-[var(--accent)]/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-[var(--accent)]/30 rounded-sm">
                  <span className="text-lg md:text-xl font-black" style={{ color: 'var(--accent)' }}>R</span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif italic text-white">Revising</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light italic">
                Shape and tighten your work with tools like Scrub, Rinse and Wash that drop the soap and tighten prose while keeping dialogue intact.
              </p>
            </div>

            {/* Articulation */}
            <div className="space-y-4 sm:space-y-6 p-6 sm:p-10 bg-black border border-white/5 rounded-sm group hover:border-[var(--accent)]/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-[var(--accent)]/30 rounded-sm">
                  <span className="text-lg md:text-xl font-black" style={{ color: 'var(--accent)' }}>A</span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif italic text-white">Articulation</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light italic">
                Hear your story read back to you in any voice, accent or language you like. Can't decide? Clone your own voice then!
              </p>
            </div>

            {/* Polish */}
            <div className="space-y-4 sm:space-y-6 p-6 sm:p-10 bg-black border border-white/5 rounded-sm group hover:border-[var(--accent)]/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-[var(--accent)]/30 rounded-sm">
                  <span className="text-lg md:text-xl font-black" style={{ color: 'var(--accent)' }}>P</span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif italic text-white">Polish</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light italic">
                Take your sheet from raw draft to print-worthy content, straight out of the box. Format for Substack, print, or the global archive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Beta CTA */}
      <section className="py-20 md:py-32 px-4 sm:px-8 lg:px-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[200px] opacity-20" style={{ backgroundColor: 'var(--accent)' }}></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="tracking-[0.6em] uppercase text-[9px] font-black block mb-6 animate-living-accent" style={{ color: 'var(--accent)' }}>Beta Access</span>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black italic text-white tracking-tighter mb-6 md:mb-8">
            Join the <span style={{ color: 'var(--accent)' }}>Beta.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 font-light italic leading-relaxed max-w-xl mx-auto mb-10 md:mb-14">
            We're opening the Word Forge to a small group of testers. If you want free access to shape the future of sovereign authorship, get in touch.
          </p>
          <a
            href="mailto:Mark@acaptiveaudience.net?subject=Word%20Forge%20Beta%20Access"
            className="inline-block animate-living-amber-bg text-white px-10 sm:px-16 py-5 sm:py-6 font-black tracking-[0.4em] sm:tracking-[0.6em] uppercase text-[10px] sm:text-[11px] transition-all shadow-2xl rounded-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Mark@acaptiveaudience.net
          </a>
        </div>
      </section>

      {/* Bottom Quote */}
      <section className="py-16 md:py-24 px-4 sm:px-8 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-serif italic leading-relaxed">
            "This is the tool I wish I had on the inside. Now, it's yours."
          </p>
        </div>
      </section>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Forge;
