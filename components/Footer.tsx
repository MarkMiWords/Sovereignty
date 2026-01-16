
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-24 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-4 gap-16 mb-24">
          <div className="lg:col-span-2">
            {/* Reduced width to w-48 to ensure links are not blocked by the SVG hitbox */}
            <Logo variant="light" className="mb-10 w-48 h-auto origin-left" />
            <p className="text-gray-500 max-w-sm mb-10 leading-relaxed text-sm">
              A digital media platform curating authentic human experiences. Built at the intersection of literature, justice, technology, and empathy.
            </p>
          </div>
          
          <div className="z-20">
            <h3 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.3em]">The Platform</h3>
            <ul className="space-y-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
              <li><Link to="/published-books" className="hover:text-white transition-colors">Published Books</Link></li>
              <li><Link to="/kindred-vr" className="hover:text-purple-400 transition-colors text-purple-500/80">Kindred VR (Lab)</Link></li>
              <li><Link to="/origin-story" className="hover:text-white transition-colors italic text-white/80">The Origin Story</Link></li>
              <li><Link to="/substack-bridge" className="hover:text-white transition-colors text-accent">Substack Bridge</Link></li>
              <li><Link to="/art-gallery" className="hover:text-white transition-colors">Art Gallery</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Privacy Shield</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Support Hub</Link></li>
            </ul>
          </div>
          
          <div className="z-20">
            <h3 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.3em]">Updates</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">Join our mailing list for updates on our carceral and literary media projects.</p>
            <div className="flex border-b border-white/20 pb-2 group focus-within:border-accent transition-colors">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="bg-transparent border-none px-0 py-2 text-[10px] font-bold tracking-widest focus:outline-none w-full placeholder:text-gray-700" 
              />
              <button className="text-accent hover:text-white transition-colors text-[10px] font-bold tracking-widest px-2">JOIN</button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold">
           <p>© 2024 A Captive Audience.</p>
           <p className="mt-4 md:mt-0 italic">Mark Mi Words Studio</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
