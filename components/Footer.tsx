
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-4 gap-16 mb-16">
          <div className="lg:col-span-2">
            <Logo variant="light" className="mb-8 w-40 h-auto origin-left" />
            <p className="text-gray-500 max-w-sm leading-relaxed text-sm">
              Digital storytelling and media platform for first-hand carceral narratives.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-6 uppercase text-[10px] tracking-[0.3em]">Platform</h3>
            <ul className="space-y-3 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <li><Link to="/published-books" className="hover:text-white transition-colors">Books</Link></li>
              <li><Link to="/narratives" className="hover:text-white transition-colors">Narratives</Link></li>
              <li><Link to="/origin-story" className="hover:text-white transition-colors italic">Origin Story</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-6 uppercase text-[10px] tracking-[0.3em]">Sync Manifest</h3>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                  <span className="text-green-500 text-[9px] font-black uppercase tracking-widest">Build Synced</span>
               </div>
               <p className="text-gray-700 text-[8px] font-black uppercase tracking-widest">Protocol v4.1.2-Beta</p>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-700 uppercase tracking-[0.3em] font-black">
           <p>© 2026 A Captive Audience.</p>
           <p className="italic">Mark Mi Words Studio</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
