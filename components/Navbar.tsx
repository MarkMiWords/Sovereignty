
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

interface NavbarProps {
  onReportBug: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onReportBug, isAuthenticated, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed w-full z-50 bg-[#050505]/60 backdrop-blur-2xl border-b border-white/[0.03]">
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-48">
          <div className="flex items-center h-full">
            <Link to="/" className="flex-shrink-0 group py-4 text-center h-full flex items-center">
              <Logo variant="light" className="transition-all duration-500 group-hover:scale-105 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-10">
              <Link to="/published-books" className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:glow-white">Books</Link>
              <Link to="/narratives" className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:glow-white">Narratives</Link>
              
              {isAuthenticated ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Link to="/author-builder" className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:glow-white">My Sheets</Link>
                    <Link to="/wrap-it-up" className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-6 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all hover:bg-orange-500 hover:text-white rounded-sm">Mastering Suite</Link>
                  </div>
                  <button onClick={onLogout} className="text-gray-600 hover:text-white text-[10px] font-black tracking-[0.3em] uppercase transition-colors">Logout</button>
                </div>
              ) : (
                <Link to="/login" className="bg-white/5 border border-white/10 text-white px-8 py-3 text-[10px] font-black tracking-[0.4em] uppercase transition-all rounded-sm hover:bg-white/10 hover:border-white/30">Enter Vault</Link>
              )}

              <div className="h-4 w-[1px] bg-white/10"></div>

              <button 
                onClick={onReportBug}
                className="text-red-500/40 hover:text-red-500 px-2 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                Bug
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center">
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
      </div>

      {/* Mobile Menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-[#050505] h-screen border-t border-white/5`}>
        <div className="px-12 pt-12 pb-3 space-y-8 flex flex-col items-center">
          <Link to="/published-books" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Books</Link>
          <Link to="/narratives" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Narratives</Link>
          <Link to="/author-builder" onClick={() => setIsOpen(false)} className="text-orange-500 text-3xl font-serif italic py-2">My Sheets</Link>
          <Link to="/wrap-it-up" onClick={() => setIsOpen(false)} className="text-orange-500/60 text-xl font-serif italic py-2">Mastering Suite</Link>
          <Link to="/mission" onClick={() => setIsOpen(false)} className="text-gray-500 text-xl font-sans uppercase tracking-[0.3em] py-2">Mission</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
