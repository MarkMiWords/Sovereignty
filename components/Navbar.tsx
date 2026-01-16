import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

interface NavbarProps {
  onReportBug: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onReportBug }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed w-full z-50 bg-[#050505]/95 backdrop-blur-3xl border-b border-white/[0.03]">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
      
      <div className="w-full h-24 flex items-center justify-between">
        
        {/* 
            Left Section: Centering the logo over the sidebar.
            Increased to h-48 to match the footer's visual weight.
            Adjusted pt-36 to center it vertically relative to the 24px navbar while 
            allowing the lower half to hang gracefully over the sidebar area.
        */}
        <div className="flex items-center h-full">
          <div className="w-80 flex justify-center items-center h-full pt-36 overflow-visible pointer-events-none">
            <Link to="/" className="group block overflow-visible pointer-events-auto">
              <Logo 
                variant="light" 
                className="h-48 w-auto transition-all duration-500 group-hover:scale-105 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.08)]" 
              />
            </Link>
          </div>
          
          {/* Sovereign Protocol Beta Tag */}
          <div className="hidden xl:flex items-center self-end pb-8 ml-8">
             <span className="text-[8px] font-black text-orange-500/60 uppercase tracking-[0.4em] flex items-center gap-2">
               <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse animate-living-amber-bg"></span>
               Protocol Beta 4.0
             </span>
          </div>
        </div>
        
        {/* Right Section: Core Navigation */}
        <div className="hidden md:flex items-center space-x-6 pr-12 lg:pr-20">
          <Link to="/published-books" className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:glow-white">Books</Link>
          <Link to="/narratives" className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:glow-white">Narratives</Link>
          <Link to="/author-builder" className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:glow-white">My Sheets</Link>
          <Link to="/wrap-it-up" className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-5 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all hover:bg-orange-500 hover:text-white rounded-sm animate-living-amber-border animate-living-amber">Mastering Suite</Link>

          <div className="h-4 w-[1px] bg-white/10 mx-2"></div>

          <button 
            onClick={onReportBug}
            className="text-red-500/40 hover:text-red-500 px-2 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all flex items-center gap-2"
          >
            <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            Bug
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center pr-6">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-white focus:outline-none"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 8h16M4 16h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-[#050505] h-screen border-t border-white/5`}>
        <div className="px-12 pt-12 pb-3 space-y-8 flex flex-col items-center">
          <Link to="/published-books" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Books</Link>
          <Link to="/narratives" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Narratives</Link>
          <Link to="/author-builder" onClick={() => setIsOpen(false)} className="text-orange-500 text-3xl font-serif italic py-2 animate-living-amber">My Sheets</Link>
          <Link to="/wrap-it-up" onClick={() => setIsOpen(false)} className="text-orange-500/60 text-xl font-serif italic py-2 animate-living-amber">Mastering Suite</Link>
          <Link to="/mission" onClick={() => setIsOpen(false)} className="text-gray-500 text-xl font-sans uppercase tracking-[0.3em] py-2">Mission</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;