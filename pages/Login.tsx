
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
  isAuthenticated: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isAuthenticated }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/author-builder" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAcceptedDisclaimer) { setError('You must accept the beta disclaimer.'); return; }
    if (inviteCode.trim().toLowerCase() === 'captivate me') {
      onLogin();
      navigate('/author-builder');
    } else { setError('Invalid invite code.'); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#0a0a0a]">
      <div className="max-w-md w-full bg-[#0d0d0d] border border-white/5 p-10 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
        <div className="text-center mb-12">
          <span className="text-accent tracking-[0.5em] uppercase text-[10px] font-bold mb-4 block">Author Access</span>
          <h1 className="text-5xl font-serif font-bold italic text-white mb-6 leading-tight tracking-tighter">My <span className="text-accent">Sheets.</span></h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Invite Code</label>
            <input type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="ENTER CODE" className="w-full bg-black border border-white/10 p-4 text-sm font-serif focus:border-accent outline-none text-white tracking-widest text-center" />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={hasAcceptedDisclaimer} onChange={(e) => setHasAcceptedDisclaimer(e.target.checked)} className="mt-1 accent-accent" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">I acknowledge this is a BETA VERSION.</span>
          </label>
          {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}
          <button type="submit" className="w-full bg-white text-black py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-accent hover:text-white transition-all shadow-xl rounded-sm">Enter My Sheets</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
