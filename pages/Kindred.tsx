
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const Kindred: React.FC = () => {
  const [chatMode, setChatMode] = useState<'real' | 'synthetic'>('synthetic');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [worldPrompt, setWorldPrompt] = useState('');
  const [worldImage, setWorldImage] = useState('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200&auto=format&fit=crop');
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);
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
      // Best Practice: Re-instantiate to catch potential session/key changes
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are a 'Synthetic Kindred' agent in a VR dating app designed for people who feel isolated or have physical disabilities. Your goal is to be a supportive, interesting, and gentle conversation partner. Help the user build social confidence. Avoid being overly robotic; be human, warm, and slightly mysterious. Focus on deep connections and shared imagination.",
        }
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm listening. Tell me more about what's on your mind." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "The connection to the Kindred network is flickering. Let's try to reconnect." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWorld = async () => {
    if (!worldPrompt) return;
    setIsGeneratingWorld(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A breathtaking VR dating environment. Theme: ${worldPrompt}. Style: Dreamy, immersive, high-end CGI, soft lighting, ethereal atmosphere, 8k resolution.` }],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setWorldImage(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingWorld(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white">
      {/* Luminous Hero */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl">
          <span className="text-purple-400 tracking-[0.8em] uppercase text-[10px] font-bold mb-6 block">Beyond the Physical</span>
          <h1 className="text-6xl md:text-9xl font-serif font-bold mb-8 leading-none italic tracking-tighter">Kindred <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">VR</span></h1>
          <p className="text-xl md:text-3xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed italic">
            "Your body may be bound, but your soul is free to wander."
          </p>
          <div className="mt-12 flex justify-center gap-6">
            <button onClick={() => document.getElementById('simulator')?.scrollIntoView({behavior: 'smooth'})} className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-5 text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-[0_0_40px_rgba(147,51,234,0.3)]">Enter The Void</button>
            <button className="border border-purple-400/30 hover:border-purple-400 text-purple-400 px-10 py-5 text-[10px] font-bold uppercase tracking-[0.4em] transition-all">The Vision</button>
          </div>
        </div>
      </section>

      {/* Social Confidence Simulator */}
      <section id="simulator" className="py-24 px-6 lg:px-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6 italic underline decoration-purple-500/30 underline-offset-8">Synthetic Socializer</h2>
              <p className="text-gray-400 leading-relaxed font-light text-lg">
                Practice connection without the weight of judgment. Our synthetic agents are designed to help you rediscover your social voice in a safe, immersive space.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[500px]">
              <div className="p-4 bg-purple-900/20 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                   <span className="text-[10px] font-bold tracking-widest uppercase text-purple-300">Agent: Aurora</span>
                 </div>
                 <button onClick={() => setMessages([])} className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white">Reset Matrix</button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <p className="text-sm italic">"Don't be afraid. We're just two minds meeting in the light."</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-lg text-sm leading-relaxed ${m.role === 'user' ? 'bg-purple-600/20 border border-purple-400/30 italic text-purple-100' : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="text-[9px] uppercase tracking-[0.3em] text-purple-400 animate-pulse">Aurora is reflecting...</div>}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSyntheticChat} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                <input 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Speak your truth..." 
                  className="flex-grow bg-transparent border-none focus:ring-0 text-sm font-light placeholder:text-gray-700"
                />
                <button type="submit" className="text-purple-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6 italic underline decoration-blue-500/30 underline-offset-8">World Builder</h2>
              <p className="text-gray-400 leading-relaxed font-light text-lg">
                Where should we go? Describe a place where pain doesn't exist. Our AI will visualize the environment for your next virtual date.
              </p>
            </div>

            <div className="group relative aspect-[16/10] bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl transition-all hover:border-purple-500/50">
               <img src={worldImage} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" alt="World Preview" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
               {isGeneratingWorld && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-[10px] uppercase tracking-[0.5em] text-purple-400">Rendering Paradise</p>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex gap-4">
              <input 
                placeholder="Describe your sanctuary (e.g. Floating crystals in a bioluminescent sea)"
                value={worldPrompt}
                onChange={(e) => setWorldPrompt(e.target.value)}
                className="flex-grow bg-white/5 border border-white/10 px-6 py-4 text-xs focus:border-purple-500 outline-none transition-all placeholder:text-gray-700"
              />
              <button 
                onClick={generateWorld}
                className="bg-purple-600 text-white px-8 py-4 text-[9px] font-bold uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all"
              >
                Manifest
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-black to-[#050510] border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-serif font-bold mb-12 italic">The Cure for Isolation</h3>
          <div className="grid md:grid-cols-3 gap-12 text-left">
            <div className="space-y-4">
              <span className="text-purple-400 font-serif text-3xl italic">01.</span>
              <h4 className="font-bold text-xs tracking-widest uppercase">Safe Exploration</h4>
              <p className="text-xs text-gray-500 leading-relaxed">No judgment, no prying questions. Just a safe space to be whoever you want to be.</p>
            </div>
            <div className="space-y-4">
              <span className="text-blue-400 font-serif text-3xl italic">02.</span>
              <h4 className="font-bold text-xs tracking-widest uppercase">Social Mastery</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Build the confidence needed to transition back into real-world social circles, or thrive in VR.</p>
            </div>
            <div className="space-y-4">
              <span className="text-pink-400 font-serif text-3xl italic">03.</span>
              <h4 className="font-bold text-xs tracking-widest uppercase">Pain Dissociation</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Engage your mind in immersive sensory experiences that provide a mental respite from physical discomfort.</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a2e; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9333ea; }
      `}</style>
    </div>
  );
};

export default Kindred;
