
import React, { useState, useRef, useEffect } from 'react';
import { interactWithAurora } from '../services/geminiService';

/**
 * RE-ENGINEERED VIRTY LOGO
 */
const OptimizedVirtyLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 512 512"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="virty-shimmer" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" className="animate-hue-1" stopColor="#f95bf6" />
        <stop offset="50%" className="animate-hue-2" stopColor="#5b2e3e" />
        <stop offset="100%" className="animate-hue-3" stopColor="#03f7eb" />
      </linearGradient>
      
      <path id="jigsaw-tl" d="M256,40 C190,40 130,70 90,120 L180,180 Q220,130 256,130 Z" />
      <path id="jigsaw-tr" d="M256,40 C322,40 382,70 422,120 L332,180 Q292,130 256,130 Z" />
      <path id="jigsaw-bl" d="M90,392 C130,442 190,472 256,472 L256,382 Q220,382 180,332 Z" />
      <path id="jigsaw-br" d="M422,392 C382,442 322,472 256,472 L256,382 Q292,382 332,332 Z" />
      <path id="jigsaw-mid" d="M195,195 L317,195 L317,317 L195,317 Z" transform="rotate(45 256 256)" />

      <g id="text-virty">
        <path d="M40,0 L90,140 L140,0 H115 L90,80 L65,0 Z" />
        <path d="M160,0 H185 V140 H160 Z" />
        <path d="M205,0 H260 Q285,0 285,25 Q285,50 260,50 H230 V140 H205 V0 M230,25 V25 H260 Q260,25 260,25 Z" />
        <path d="M300,0 H370 V25 H347 V140 H323 V25 H300 Z" />
        <path d="M385,0 L415,70 V140 H440 V70 L470,0 H445 L427,45 L410,0 Z" />
      </g>
    </defs>

    <g transform="translate(0, -50) scale(0.65 0.65) translate(135, 0)" fill="url(#virty-shimmer)">
      <use href="#jigsaw-tl" className="piece-tl" />
      <use href="#jigsaw-tr" className="piece-tr" />
      <use href="#jigsaw-bl" className="piece-bl" />
      <use href="#jigsaw-br" className="piece-br" />
      <use href="#jigsaw-mid" className="piece-mid" />
    </g>

    <g transform="translate(30, 360) scale(0.9)" fill="url(#virty-shimmer)">
      <use href="#text-virty" />
    </g>

    <style>{`
      @keyframes morph-color { 0%, 100% { stop-color: #f95bf6; } 50% { stop-color: #03f7eb; } }
      @keyframes morph-color-alt { 0%, 100% { stop-color: #03f7eb; } 50% { stop-color: #f95bf6; } }
      .animate-hue-1 { animation: morph-color 6s infinite ease-in-out; }
      .animate-hue-3 { animation: morph-color-alt 6s infinite ease-in-out; }
      @keyframes spread-tl { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-15px, -15px); } }
      @keyframes spread-tr { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(15px, -15px); } }
      @keyframes spread-bl { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-15px, 15px); } }
      @keyframes spread-br { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(15px, 15px); } }
      .piece-tl { animation: spread-tl 4s infinite ease-in-out; }
      .piece-tr { animation: spread-tr 4s infinite ease-in-out; }
      .piece-bl { animation: spread-bl 4s infinite ease-in-out; }
      .piece-br { animation: spread-br 4s infinite ease-in-out; }
    `}</style>
  </svg>
);

const Kindred: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFirewall, setShowFirewall] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'FlirtyVirty') {
      setIsAuthorized(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPassword('');
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const handleSyntheticChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const userMessage = userInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setUserInput('');
    setIsLoading(true);

    try {
      const responseText = await interactWithAurora(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handoverDoc = `
/**
 * FOR KUMBI: SOVEREIGN ENGINE INTEGRATION (VIRTUAL COMPANION MODULE)
 * 
 * CORE PRINCIPLE: Decouple Interaction from Transformation.
 * Use this architecture to build the VIRTY backend.
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. THE GOLDEN CONTRACT (Root Protocol)
const GOLDEN_CONTRACT = \`
  ROLE: Narrative Integrity Specialist.
  MISSION: Sovereignty of Voice.
  RULE: Preserve grit, dialect, and intentional tone.
  FAILURE: If uncertainty exists, return UNCHANGED.
\`;

// 2. ENGINE A: THE SCRUBBER (Mechanical Transformation)
// Near-zero temperature (0.1) for precision. No personality allowed here.
export async function performMechanicalScrub(text) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text }] },
    config: { 
      systemInstruction: GOLDEN_CONTRACT + "\\nMODE: SCRUB. Strictly remove filler only.",
      temperature: 0.1 
    },
  });
  return response.text;
}

// 3. ENGINE B: THE PARTNER (High-Intensity Interaction)
// This is where the "FlirtyVirty" / "Firebrand" persona lives.
export async function interactWithPartner(message, context = "") {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: message }] },
    config: { 
      systemInstruction: GOLDEN_CONTRACT + "\\nARCHETYPE: FIREBRAND. Rambunctious, helpful, vibrant.",
      tools: [{ googleSearch: {} }] 
    },
  });
  return response.text;
}
  `.trim();

  return (
    <div className="min-h-screen bg-[#020205] text-white selection:bg-cyan-500/30">
      {/* Hero */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden px-6 text-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-black to-black"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <span className="text-cyan-400 tracking-[0.8em] uppercase text-[10px] font-black mb-8 block animate-pulse">VIRTY Development Lab</span>
          <h1 className="text-5xl md:text-[8rem] font-serif font-black mb-8 leading-none italic tracking-tighter">VIRTY <span className="text-white/20">LOGIC.</span></h1>
          <p className="text-xl md:text-3xl text-gray-400 font-light max-w-2xl mx-auto italic leading-relaxed">
            "Companionship for the physically isolated."
          </p>
        </div>
      </section>

      {/* Logic & Brand Lab */}
      <section className="py-24 px-6 lg:px-24 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-32">
            <div className="space-y-12">
               <div>
                  <h2 className="text-5xl font-serif italic mb-6">VIRTY <span className="text-cyan-400">Architecture.</span></h2>
                  <p className="text-gray-500 text-lg font-light leading-relaxed">
                    Access the handover protocols for the Sovereign AI Engine. This documentation is for development partners only.
                  </p>
               </div>

               <div className="p-12 bg-white/[0.02] border border-white/5 flex items-center justify-center relative overflow-hidden group rounded-sm">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <OptimizedVirtyLogo className="w-64 h-64 filter drop-shadow-[0_0_40px_rgba(3,247,235,0.2)]" />
               </div>

               {!isAuthorized ? (
                 <div className="p-10 bg-black border border-white/5 rounded-sm">
                   <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6">System Firewall Active</h4>
                   <form onSubmit={handleAuth} className="space-y-4">
                     <input 
                       type="password" 
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="Enter Firewall Key"
                       className={`w-full bg-[#050505] border ${authError ? 'border-red-500' : 'border-white/10'} p-4 text-[11px] font-mono tracking-[0.4em] text-white outline-none focus:border-cyan-400 rounded-sm`}
                     />
                     <button type="submit" className="w-full py-4 bg-cyan-500 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-500/20">Unlock Protocols</button>
                   </form>
                 </div>
               ) : (
                 <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                       <span className="text-green-500 text-[9px] font-black uppercase tracking-widest">Protocol Handover: AUTHORIZED</span>
                    </div>
                    <pre className="p-8 bg-black border border-cyan-500/20 text-[10px] text-cyan-300 overflow-x-auto font-mono rounded-sm shadow-inner leading-relaxed">
                      {handoverDoc}
                    </pre>
                 </div>
               )}
            </div>

            <div className="space-y-12">
               <div>
                  <h2 className="text-5xl font-serif italic mb-6">Live <span className="text-cyan-400">Environment.</span></h2>
                  <p className="text-gray-500 text-lg font-light leading-relaxed">
                    Test the frequency response of the Aurora sanctuary partner. This module simulates high-empathy companionship.
                  </p>
               </div>

               <div className="bg-white/5 border border-white/10 rounded-sm overflow-hidden h-[500px] flex flex-col">
                  <div className="p-4 bg-cyan-900/10 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">AURORA NODE: STANDBY</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                  </div>
                  <div className="flex-grow overflow-y-auto p-8 space-y-6">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-cyan-500/10 border border-cyan-400/20 italic text-cyan-100' : 'bg-white/5 border border-white/5 text-gray-400'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && <span className="text-[10px] text-cyan-400 animate-pulse uppercase font-black tracking-widest">Partner is listening...</span>}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSyntheticChat} className="p-6 bg-black border-t border-white/5 flex gap-4">
                    <input 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Start a conversation with Virty..." 
                      className="flex-grow bg-transparent border-none text-sm font-light outline-none focus:ring-0 placeholder:text-gray-800"
                    />
                    <button type="submit" className="text-cyan-400 hover:text-white">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  </form>
               </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Kindred;
