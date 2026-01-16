
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

/**
 * RE-ENGINEERED VIRTY LOGO (For Export)
 * Features a "Jigsaw Ball" symbol and clean typography.
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
        <path d="M40,0 L90,140 L140,0 H115 L90,80 L65,0 Z" /> {/* V */}
        <path d="M160,0 H185 V140 H160 Z" /> {/* I */}
        <path d="M205,0 H260 Q285,0 285,25 Q285,50 260,50 H230 V140 H205 V0 M230,25 V25 H260 Q260,25 260,25 Z" /> {/* R */}
        <path d="M300,0 H370 V25 H347 V140 H323 V25 H300 Z" /> {/* T */}
        <path d="M385,0 L415,70 V140 H440 V70 L470,0 H445 L427,45 L410,0 Z" /> {/* Y */}
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
  const [worldImage, setWorldImage] = useState('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200&auto=format&fit=crop');
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSyntheticChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const userMessage = userInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setUserInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are 'Aurora', a Kindred Agent. You exist in a VR sanctuary. You are empathetic, calm, and focus on shared creativity and imagination. You help the user build worlds.",
        }
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm listening." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const codeSnippet = `
// EXPORT THIS TO VIRTY GOOGLE AI STUDIO
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function interactWithAurora(prompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are Aurora, a Synthetic Kindred partner..."
    }
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
          <span className="text-cyan-400 tracking-[0.8em] uppercase text-[10px] font-black mb-8 block animate-pulse">Virty Development Lab</span>
          <h1 className="text-7xl md:text-[12rem] font-serif font-black mb-8 leading-none italic tracking-tighter">Kindred</h1>
          <p className="text-xl md:text-3xl text-gray-400 font-light max-w-2xl mx-auto italic leading-relaxed">
            "We are building the bridge for the isolated."
          </p>
        </div>
      </section>

      {/* Logic & Brand Lab */}
      <section className="py-24 px-6 lg:px-24 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-32">
            <div className="space-y-12">
               <div>
                  <h2 className="text-5xl font-serif italic mb-6">Brand <span className="text-cyan-400">Calibration.</span></h2>
                  <p className="text-gray-500 text-lg font-light leading-relaxed">
                    Testing the jigsaw spread animation on a 512px viewbox. This symbol represents parts coming together to form a whole—a literal metaphor for building connection.
                  </p>
               </div>

               <div className="p-12 bg-white/[0.02] border border-white/5 flex items-center justify-center relative overflow-hidden group rounded-sm">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <OptimizedVirtyLogo className="w-64 h-64 filter drop-shadow-[0_0_40px_rgba(3,247,235,0.2)]" />
               </div>

               <button 
                 onClick={() => setShowCode(!showCode)}
                 className="w-full py-5 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-cyan-500 hover:text-white transition-all"
               >
                 {showCode ? "Hide Logic Export" : "View Logic Export"}
               </button>

               {showCode && (
                 <pre className="p-8 bg-black border border-white/10 text-[10px] text-cyan-300 overflow-x-auto font-mono rounded-sm shadow-inner leading-relaxed animate-fade-in">
                   {codeSnippet}
                 </pre>
               )}
            </div>

            <div className="space-y-12">
               <div>
                  <h2 className="text-5xl font-serif italic mb-6">Agent <span className="text-cyan-400">Interaction.</span></h2>
                  <p className="text-gray-500 text-lg font-light leading-relaxed">
                    The 'Aurora' agent is the soul of the Virty project. She handles the real-time emotional labor in our virtual sanctuaries.
                  </p>
               </div>

               <div className="bg-white/5 border border-white/10 rounded-sm overflow-hidden h-[500px] flex flex-col">
                  <div className="p-4 bg-cyan-900/10 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Status: Interface Live</span>
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
                    {isLoading && <span className="text-[10px] text-cyan-400 animate-pulse uppercase font-black tracking-widest">Aurora is listening...</span>}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSyntheticChat} className="p-6 bg-black border-t border-white/5 flex gap-4">
                    <input 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Enter the frequency..." 
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

      {/* Origin/Concept Link */}
      <section className="py-24 text-center border-t border-white/5 bg-[#050505]">
        <h3 className="text-gray-600 text-[10px] font-black uppercase tracking-[0.5em] mb-8">Part of the A Captive Audience Ecosystem</h3>
        <p className="text-gray-700 italic text-sm max-w-xl mx-auto mb-12">
          "The logic developed for the system-impacted is being repurposed for the physically-isolated. Connection is the universal currency."
        </p>
      </section>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Kindred;
