
import React from 'react';
import { Link } from 'react-router-dom';

const Storefront: React.FC = () => {
  return (
    <div className="bg-[#020202] min-h-screen text-white overflow-hidden pb-32">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#020202] z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2500&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 grayscale scale-110 animate-subtle-drift"
          alt="Abstract Justice"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-12 md:pt-32">
        <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-32">
          
          {/* Glorified Book Presentation */}
          <div className="w-full lg:w-1/2 flex justify-center perspective-1000">
            <div className="relative group animate-float">
              {/* Pulsating Multicolor Aura */}
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 via-purple-500 to-cyan-500 rounded-lg blur-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000 animate-pulsate-aura"></div>
              
              {/* Book Shadow Base */}
              <div className="absolute inset-2 bg-black blur-xl opacity-80 translate-x-8 translate-y-8"></div>

              {/* The Book */}
              <div className="relative z-10 w-[320px] md:w-[420px] aspect-[16/27] bg-[#0a0a0a] border-l-[12px] border-black shadow-2xl rounded-r-sm overflow-hidden transform rotate-y-[-5deg] transition-transform duration-700 group-hover:rotate-y-[-2deg]">
                <img 
                  src="https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=1200&auto=format&fit=crop" 
                  className="w-full h-full object-cover"
                  alt="The IVO Trap Cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
              </div>

              {/* Glow Accents on Edges */}
              <div className="absolute -inset-[2px] rounded-r-sm border border-white/10 z-20 pointer-events-none"></div>
            </div>
          </div>

          {/* Promotional Copy */}
          <div className="w-full lg:w-1/2 space-y-12">
            <div className="space-y-6">
              <span className="text-[var(--accent)] tracking-[0.8em] uppercase text-[11px] font-black block animate-pulse">Featured Masterpiece</span>
              <h1 className="text-6xl md:text-8xl font-serif font-black italic tracking-tighter leading-none text-white">
                The <br/>
                <span className="text-[var(--accent)] glow-accent animate-living-accent">IVO Trap.</span>
              </h1>
              <p className="text-2xl md:text-3xl text-gray-400 font-light italic leading-relaxed border-l-2 pl-8 border-[var(--accent)]/30">
                Intervention Orders: From the Inside Out.
              </p>
            </div>

            <div className="space-y-8 text-gray-500 font-light italic leading-loose text-lg">
              <p>
                "There is no way of knowing how many family violence orders are enforced across Australia. What we do know is how many have wound up in court."
              </p>
              <p>
                In 2023–24, 42% of all civil cases finalised in Australian Magistrates’ Courts involved originating applications for domestic violence orders — around 131,000 cases. This is the definitive narrative of the system from someone who survived its internal machinery.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 pt-8">
              <a 
                href="https://www.ingramspark.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-grow bg-[#0096d6] text-white px-12 py-8 font-black tracking-[0.6em] uppercase text-[11px] text-center shadow-2xl hover:brightness-110 transition-all rounded-sm"
              >
                Acquire Physical Edition
              </a>
              <Link 
                to="/book/the-ivo-trap" 
                className="px-12 py-8 border border-white/10 text-white font-black tracking-[0.6em] uppercase text-[11px] text-center hover:bg-white hover:text-black transition-all rounded-sm"
              >
                Examine Metadata
              </Link>
            </div>

            <div className="pt-12 border-t border-white/5 flex items-center gap-8">
               <div className="text-center">
                  <p className="text-white text-xl font-serif italic">131k+</p>
                  <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">Case Audits</p>
               </div>
               <div className="h-8 w-[1px] bg-white/5"></div>
               <div className="text-center">
                  <p className="text-white text-xl font-serif italic">2024</p>
                  <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">Master Release</p>
               </div>
               <div className="h-8 w-[1px] bg-white/5"></div>
               <div className="text-center">
                  <p className="text-[var(--accent)] text-xl font-serif italic">MARK M.</p>
                  <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">The Architect</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drift {
          0% { transform: scale(1.1) translate(0, 0); }
          50% { transform: scale(1.15) translate(-1%, -1%); }
          100% { transform: scale(1.1) translate(0, 0); }
        }
        .animate-subtle-drift { animation: drift 20s infinite ease-in-out; }
        
        @keyframes pulsate-aura {
          0%, 100% { transform: scale(1); opacity: 0.3; filter: blur(30px) hue-rotate(0deg); }
          50% { transform: scale(1.1); opacity: 0.6; filter: blur(50px) hue-rotate(180deg); }
        }
        .animate-pulsate-aura { animation: pulsate-aura 8s infinite ease-in-out; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s infinite ease-in-out; }

        .perspective-1000 { perspective: 1000px; }
        .rotate-y-[-5deg] { transform: rotateY(-15deg); }
        .group-hover\:rotate-y-\[-2deg\]:hover { transform: rotateY(-5deg); }
      `}</style>
    </div>
  );
};

export default Storefront;
