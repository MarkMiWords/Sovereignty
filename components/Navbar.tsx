
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

interface NavbarProps {
  onReportBug: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onReportBug }) => {
  const [isOpen, setIsOpen] = useState(false);

  const NavItem = ({ to, label, variant = "default" }: { to: string, label: string, variant?: "default" | "orange" }) => (
    <Link 
      to={to} 
      className={`px-3 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all whitespace-nowrap
        ${variant === "orange" 
          ? 'text-white animate-living-accent' 
          : 'text-gray-400 hover:text-white'
        }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="fixed w-full z-[100] bg-[#050505]/80 backdrop-blur-2xl border-b border-white/[0.03]">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent"></div>
      
      <div className="w-full h-24 flex items-center justify-between">
        <div className="flex items-center h-full">
          <div className="w-80 flex justify-center items-center h-full pt-32 overflow-visible pointer-events-none">
            <Link to="/" className="group block overflow-visible pointer-events-auto">
              <Logo 
                variant="light" 
                className="h-48 w-auto transition-all duration-500 group-hover:scale-105" 
              />
            </Link>
          </div>
          
          <div className="hidden xl:flex items-center self-end pb-8 ml-8">
             <Link 
               to="/origin-story"
               className="text-[8px] font-black uppercase tracking-[0.4em] flex items-center gap-2 hover:opacity-100 transition-all group"
               style={{ color: 'var(--accent)' }}
             >
               <span className="w-1 h-1 rounded-full animate-pulse animate-living-amber-bg"></span>
               Origin Story
               <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">→</span>
             </Link>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-6 pr-12 lg:pr-20">
          <NavItem to="/published-books" label="Books" />
          <NavItem to="/narratives" label="Archive" />
          <NavItem to="/author-builder" label="Forge" variant="orange" />
          <NavItem to="/sovereign-vault" label="The Vault" />

          <Link to="/wrap-it-up" className="animate-living-amber-bg text-white px-5 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all hover:brightness-110 rounded-sm">Mastering</Link>

          <div className="h-4 w-[1px] bg-white/10 mx-2"></div>

          <button 
            onClick={onReportBug}
            className="text-red-500/40 hover:text-red-500 px-2 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all flex items-center gap-2"
          >
            <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            Report
          </button>
        </div>

        <div className="md:hidden flex items-center pr-6">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={isOpen ? "M6 18L18 6 " : "M4 8h16M4 16h16"} />
            </svg>
          </button>
        </div>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-[#050505] h-screen border-t border-white/5`}>
        <div className="px-12 pt-12 pb-3 space-y-8 flex flex-col items-center">
          <Link to="/" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Home</Link>
          <Link to="/published-books" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Books</Link>
          <Link to="/narratives" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Archive</Link>
          <Link to="/author-builder" onClick={() => setIsOpen(false)} className="text-[var(--accent)] text-3xl font-serif italic py-2 animate-living-accent">Forge</Link>
          <Link to="/sovereign-vault" onClick={() => setIsOpen(false)} className="text-[var(--accent)] text-3xl font-serif italic py-2">Vault</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
