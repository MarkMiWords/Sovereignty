
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { readJson, writeJson } from '../utils/safeStorage';

const THEMES = [
  { id: 'amber', name: 'Amber (Classic)', color: '#e67e22' },
  { id: 'blue', name: 'Sovereign Blue', color: '#3498db' },
  { id: 'red', name: 'Ruby (Emergency)', color: '#e74c3c' },
  { id: 'emerald', name: 'Emerald (Growth)', color: '#2ecc71' }
];

const WrapperInfo: React.FC = () => {
  const [profile, setProfile] = useState(() => {
    return readJson<any>('aca_author_profile', {
      name: 'Architect',
      theme: 'amber',
      fontIndex: 0
    });
  });

  const [showSavedToast, setShowSavedToast] = useState(false);

  const saveProfile = () => {
    writeJson('aca_author_profile', profile);
    
    // Apply theme globally
    const themeClasses = THEMES.map(t => `theme-${t.id}`);
    document.body.classList.remove(...themeClasses);
    document.documentElement.classList.remove(...themeClasses);

    if (profile.theme && profile.theme !== 'amber') {
      const themeClass = `theme-${profile.theme}`;
      document.body.classList.add(themeClass);
      document.documentElement.classList.add(themeClass);
    }
    
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 font-sans pt-24">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/author-builder" className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 block hover:underline" style={{ color: 'var(--accent)' }}>
          ← Return to Studio
        </Link>
        <h1 className="text-6xl font-serif font-black italic text-white mb-6 uppercase">WRAP <span style={{ color: 'var(--accent)' }}>Profile.</span></h1>
        <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">Manage your workspace identity and visual preferences.</p>
      </section>

      <section className="max-w-4xl mx-auto px-6 space-y-16">
        {/* Core Settings */}
        <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-sm shadow-2xl">
          <div className="space-y-12">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: 'var(--accent)' }}>Author Identity</label>
              <input 
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full bg-transparent border-b border-white/10 pb-4 text-3xl font-serif italic outline-none focus:border-[var(--accent)] text-white transition-all" 
                placeholder="Name..." 
              />
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Workspace Theme</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {THEMES.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setProfile({...profile, theme: t.id})}
                    className={`p-6 border transition-all rounded-sm flex flex-col items-center gap-3 ${profile.theme === t.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-white/5 hover:bg-white/5'}`}
                  >
                    <div className="w-4 h-4 rounded-full shadow-xl" style={{ backgroundColor: t.color }}></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={saveProfile}
              className="w-full py-6 text-white text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl hover:brightness-110 transition-all rounded-sm animate-living-amber-bg"
            >
              Update Profile
            </button>
          </div>
        </div>

        {/* Media Specifications Card */}
        <div className="bg-[#0d0d0d] border border-white/5 p-10 rounded-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] mb-6" style={{ color: 'var(--accent)' }}>Media Specifications</h3>
          <div className="grid md:grid-cols-2 gap-10">
             <div className="space-y-4">
                <h4 className="text-white font-serif italic text-xl">Outlook Signature PNG</h4>
                <p className="text-gray-500 text-sm italic font-light leading-relaxed">
                  To load your own PNG into Outlook successfully without it appearing blurry or oversized, use these export settings in your design tool:
                </p>
                <ul className="text-[11px] font-mono text-gray-400 space-y-2">
                   <li>• Width: <span className="text-white font-bold">300px</span></li>
                   <li>• Resolution: <span className="text-white font-bold">72 DPI</span></li>
                   <li>• Format: <span className="text-white font-bold">PNG-24 (Transparent)</span></li>
                </ul>
             </div>
             <div className="p-8 bg-black border border-white/5 flex items-center justify-center text-center italic text-gray-700 text-xs">
                "Simple is stable. Your 7kb asset is perfect. Upload it directly to Outlook's Signature settings."
             </div>
          </div>
        </div>
      </section>

      {showSavedToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl z-[100] border border-white/20 animate-living-amber-bg">
          Settings Synchronized
        </div>
      )}
    </div>
  );
};

export default WrapperInfo;
