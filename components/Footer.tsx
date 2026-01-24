
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
  const triggerMicCheck = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('aca:open_mic_check'));
  };

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-24 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-4 gap-16 mb-24">
          <div className="lg:col-span-2">
            <Logo variant="light" className="mb-10 w-48 h-auto origin-left" />
            <p className="text-gray-500 max-w-sm mb-10 leading-relaxed text-sm">
              A digital media platform curating authentic human experiences. Built at the intersection of literature, justice, technology, and empathy.
            </p>
          </div>
          
          <div className="z-20">
            <h3 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.3em]">The Platform</h3>
            <ul className="space-y-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
              <li><Link to="/published-books" className="hover:text-white transition-colors">Published Books</Link></li>
              <li><Link to="/virty-dating" className="hover:text-cyan-400 transition-colors text-cyan-500/80 uppercase">VIRTY System Logic</Link></li>
              <li><Link to="/origin-story" className="hover:text-white transition-colors italic text-white/80">The Origin Story</Link></li>
              <li><Link to="/substack-bridge" className="hover:text-white transition-colors text-[var(--accent)]">Substack Bridge</Link></li>
              <li><Link to="/art-gallery" className="hover:text-white transition-colors">Art Gallery</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Privacy Shield</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Support Hub</Link></li>
            </ul>
          </div>
          
          <div className="z-20">
            <h3 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.3em]">Sovereign System</h3>
            <ul className="space-y-4 text-gray-500 text-xs font-bold uppercase tracking-widest mb-10">
              <li>
                <button 
                  onClick={triggerMicCheck}
                  className="hover:text-[var(--accent)] transition-colors text-left flex items-center gap-2"
                >
                  <div className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse"></div>
                  Mic Check & Calibration
                </button>
              </li>
              <li><Link to="/blueprints" className="text-cyan-500/60 hover:text-cyan-400 transition-all uppercase tracking-[0.2em] font-black">Forge Blueprints</Link></li>
              <li className="pt-4 border-t border-white/5 opacity-40">
                <p className="text-[7px] text-gray-600 mb-1 uppercase font-black">Sync Manifest</p>
                <p className="text-[8px] text-green-500 flex items-center gap-2 font-black uppercase tracking-widest">
                   <span className="w-1 h-1 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
                   Build Active: v4.5.0 Stable
                </p>
              </li>
            </ul>

            <h3 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.3em]">Updates</h3>
            <div className="flex border-b border-white/20 pb-2 group focus-within:border-[var(--accent)] transition-colors">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="bg-transparent border-none px-0 py-2 text-[10px] font-bold tracking-widest focus:outline-none w-full placeholder:text-gray-700" 
              />
              <button className="text-[var(--accent)] hover:text-white transition-colors text-[10px] font-bold tracking-widest px-2 uppercase">Join</button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 uppercase tracking-[0.3em] font-black">
           <div className="flex items-center gap-6">
              <p>© 2026 A Captive Audience.</p>
           </div>
           <p className="mt-4 md:mt-0 italic opacity-40">Mark Mi Words Studio</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
