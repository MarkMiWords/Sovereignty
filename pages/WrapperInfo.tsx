
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { readJson, writeJson } from '../utils/safeStorage';

const THEMES = [
  { id: 'amber', name: 'Amber (Classic)', color: '#e67e22' },
  { id: 'blue', name: 'Sovereign Blue', color: '#3498db' },
  { id: 'red', name: 'Ruby (Emergency)', color: '#e74c3c' },
  { id: 'emerald', name: 'Emerald (Growth)', color: '#2ecc71' }
];

const PERSONALITIES = ['Timid', 'Cool', 'Mild', 'Natural', 'Wild', 'Firebrand'];
const GENDERS = ['Male', 'Female', 'Neutral'];
const SOUNDS = ['Soft', 'Normal', 'Loud'];
const ACCENTS = ['AU', 'UK', 'US'];
const SPEEDS = ['1x', '1.25x', '1.5x'];

const WrapperInfo: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => {
    return readJson<any>('aca_author_profile', {
      name: 'Architect',
      theme: 'amber',
      fontIndex: 0,
      personalityIndex: 3, // Default: Natural
      wrapName: 'WRAP',
      wrapGender: 'Neutral',
      wrapSound: 'Normal',
      wrapAccent: 'AU',
      wrapSpeed: '1x'
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
    
    // REDIRECT BACK: Seamless return to workspace
    setTimeout(() => {
      setShowSavedToast(false);
      navigate(-1); // Returns to AuthorBuilder or LiveSession
    }, 1500);
  };

  const currentPersonality = PERSONALITIES[profile.personalityIndex || 0];

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 font-sans pt-24">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 block hover:underline" style={{ color: 'var(--accent)' }}>
          ← Return to Studio
        </button>
        <h1 className="text-6xl font-serif font-black italic text-white mb-6 uppercase">WRAP <span style={{ color: 'var(--accent)' }}>Profile.</span></h1>
        <p className="text-xl text-gray-500 font-light italic leading-relaxed max-w-2xl">Manage your author identity and the specifications of your WRAP partner.</p>
      </section>

      <section className="max-w-4xl mx-auto px-6 space-y-8">
        {/* Author Identity */}
        <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-sm shadow-2xl">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: 'var(--accent)' }}>Author Identity</label>
            <input 
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 pb-4 text-3xl font-serif italic outline-none focus:border-[var(--accent)] text-white transition-all" 
              placeholder="Your Name..." 
            />
          </div>
        </div>

        {/* WRAP Identity Section */}
        <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-sm shadow-2xl space-y-12">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500">WRAP Identity</label>
            <input 
              value={profile.wrapName} 
              onChange={e => setProfile({...profile, wrapName: e.target.value})}
              className="w-full bg-transparent border-b border-white/10 pb-4 text-3xl font-serif italic outline-none focus:border-cyan-500 text-white transition-all" 
              placeholder="Partner Name (e.g. WRAP)..." 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Gender Selection */}
            <div className="space-y-4">
              <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Partner Gender Profile</p>
              <div className="flex gap-2">
                {GENDERS.map(g => (
                  <button 
                    key={g} 
                    onClick={() => setProfile({...profile, wrapGender: g})}
                    className={`flex-1 py-3 text-[9px] font-black uppercase rounded-sm border transition-all ${profile.wrapGender === g ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg' : 'border-white/5 text-gray-600 hover:text-white'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Level */}
            <div className="space-y-4">
              <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Partner Sound Level</p>
              <div className="flex gap-2">
                {SOUNDS.map(s => (
                  <button 
                    key={s} 
                    onClick={() => setProfile({...profile, wrapSound: s})}
                    className={`flex-1 py-3 text-[9px] font-black uppercase rounded-sm border transition-all ${profile.wrapSound === s ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg' : 'border-white/5 text-gray-600 hover:text-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Selection */}
            <div className="space-y-4">
              <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Regional Dialect Accent</p>
              <div className="flex gap-2">
                {ACCENTS.map(a => (
                  <button 
                    key={a} 
                    onClick={() => setProfile({...profile, wrapAccent: a})}
                    className={`flex-1 py-3 text-[9px] font-black uppercase rounded-sm border transition-all ${profile.wrapAccent === a ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg' : 'border-white/5 text-gray-600 hover:text-white'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Selection */}
            <div className="space-y-4">
              <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Conversational Pace</p>
              <div className="flex gap-2">
                {SPEEDS.map(sp => (
                  <button 
                    key={sp} 
                    onClick={() => setProfile({...profile, wrapSpeed: sp})}
                    className={`flex-1 py-3 text-[9px] font-black uppercase rounded-sm border transition-all ${profile.wrapSpeed === sp ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg' : 'border-white/5 text-gray-600 hover:text-white'}`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-8 pt-6 border-t border-white/5">
            <div className="flex justify-between items-end">
               <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Temperament Matrix</label>
               <span className="text-[var(--accent)] font-serif italic text-2xl tracking-tighter animate-pulse">{currentPersonality}</span>
            </div>
            <div className="relative pt-2">
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="1"
                value={profile.personalityIndex || 0}
                onChange={(e) => setProfile({...profile, personalityIndex: parseInt(e.target.value)})}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex justify-between mt-4 text-[7px] font-black text-gray-700 uppercase tracking-widest">
                 {PERSONALITIES.map((p, i) => (
                   <span key={p} className={profile.personalityIndex === i ? 'text-[var(--accent)]' : ''}>{p}</span>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-sm shadow-2xl">
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
        </div>

        <button 
          onClick={saveProfile}
          className="w-full py-8 text-white text-[12px] font-black uppercase tracking-[0.6em] shadow-2xl hover:brightness-110 transition-all rounded-sm animate-living-amber-bg"
        >
          Synchronize Profile & Identity
        </button>
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
