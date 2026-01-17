
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

interface NavbarProps {
  onReportBug: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onReportBug }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Load tooltip preference
  const showTooltips = (() => {
    const profile = localStorage.getItem('aca_author_profile');
    return profile ? JSON.parse(profile).showTooltips !== false : true;
  })();

  const NavItem = ({ to, label, title, subtitle, variant = "default" }: { to: string, label: string, title: string, subtitle: string, variant?: "default" | "orange" }) => (
    <div className="relative group/tooltip">
      <Link 
        to={to} 
        className={`px-2 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all whitespace-nowrap
          ${variant === "orange" 
            ? 'text-orange-500 hover:glow-amber animate-living-amber' 
            : 'text-gray-400 hover:text-white hover:glow-white'
          }`}
      >
        {label}
      </Link>
      {showTooltips && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none z-[100] w-64 translate-y-2 group-hover/tooltip:translate-y-0">
          <div className="bg-black border border-white/10 p-5 shadow-2xl rounded-sm backdrop-blur-3xl relative overflow-hidden">
             {/* Industrial accent line */}
             <div className={`absolute top-0 left-0 w-full h-[1px] ${variant === "orange" ? 'bg-orange-500' : 'bg-white/20'}`}></div>
             <p className={`text-[8px] font-black uppercase tracking-widest mb-1 leading-none ${variant === "orange" ? 'text-orange-500' : 'text-white'}`}>{title}</p>
             <p className="text-[10px] text-gray-500 italic leading-tight font-serif">{subtitle}</p>
          </div>
          {/* Tooltip arrow */}
          <div className="w-2 h-2 bg-black border-l border-t border-white/10 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );

  return (
    <nav className="fixed w-full z-50 bg-[#050505]/95 backdrop-blur-3xl border-b border-white/[0.03]">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
      
      <div className="w-full h-24 flex items-center justify-between">
        <div className="flex items-center h-full">
          <div className="w-80 flex justify-center items-center h-full pt-32 overflow-visible pointer-events-none">
            <Link to="/" className="group block overflow-visible pointer-events-auto">
              <Logo 
                variant="light" 
                className="h-48 w-auto transition-all duration-500 group-hover:scale-105 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.08)]" 
              />
            </Link>
          </div>
          
          <div className="hidden xl:flex items-center self-end pb-8 ml-8">
             <span className="text-[8px] font-black text-orange-500/60 uppercase tracking-[0.4em] flex items-center gap-2">
               <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse animate-living-amber-bg"></span>
               Protocol Beta 4.0
             </span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-6 pr-12 lg:pr-20">
          <NavItem 
            to="/published-books" 
            label="Books" 
            title="The Storefront" 
            subtitle="Explore published volumes of carceral and systemic legacy." 
          />
          <NavItem 
            to="/narratives" 
            label="Narratives" 
            title="Public Archives" 
            subtitle="A registry of unfiltered human experiences from behind the walls." 
          />
          <NavItem 
            to="/author-builder" 
            label="My Sheets" 
            title="WRAP Workspace" 
            subtitle="Draft and refine your legacy. Personalize your WRAP Profile here." 
          />
          <NavItem 
            to="/sovereign-vault" 
            label="The Big House" 
            title="Permanent Vault" 
            subtitle="Immutable digital security for your archives and Courier Codes." 
            variant="orange"
          />

          <div className="relative group/tooltip">
            <Link to="/wrap-it-up" className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-5 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all hover:bg-orange-500 hover:text-white rounded-sm animate-living-amber-border animate-living-amber">Mastering Suite</Link>
            {showTooltips && (
              <div className="absolute top-full right-0 mt-4 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none z-[100] w-64 translate-y-2 group-hover/tooltip:translate-y-0">
                <div className="bg-black border border-orange-500/20 p-5 shadow-2xl rounded-sm backdrop-blur-3xl">
                   <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1 leading-none">The Audit Desk</p>
                   <p className="text-[10px] text-gray-500 italic leading-tight font-serif">Perform legal safety audits and format for Substack or print distribution.</p>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-2"></div>

          <button 
            onClick={onReportBug}
            className="text-red-500/40 hover:text-red-500 px-2 py-2 text-[9px] font-black tracking-[0.3em] uppercase transition-all flex items-center gap-2"
          >
            <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            Bug
          </button>
        </div>

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

      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-[#050505] h-screen border-t border-white/5`}>
        <div className="px-12 pt-12 pb-3 space-y-8 flex flex-col items-center">
          <Link to="/published-books" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Books</Link>
          <Link to="/narratives" onClick={() => setIsOpen(false)} className="text-gray-300 text-3xl font-serif italic py-2">Narratives</Link>
          <Link to="/author-builder" onClick={() => setIsOpen(false)} className="text-orange-500 text-3xl font-serif italic py-2 animate-living-amber">My Sheets</Link>
          <Link to="/sovereign-vault" onClick={() => setIsOpen(false)} className="text-orange-500 text-3xl font-serif italic py-2">The Big House</Link>
          <Link to="/wrap-it-up" onClick={() => setIsOpen(false)} className="text-orange-500/60 text-xl font-serif italic py-2 animate-living-amber">Mastering Suite</Link>
          <Link to="/mission" onClick={() => setIsOpen(false)} className="text-gray-500 text-xl font-sans uppercase tracking-[0.3em] py-2">Mission</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
