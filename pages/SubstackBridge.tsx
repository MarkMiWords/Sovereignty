
import React from 'react';
import { Link } from 'react-router-dom';

const SubstackBridge: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden px-6 border-b border-white/5">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-transparent to-black"></div>
          <img 
            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale" 
            alt="Old Books and Tech" 
          />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl">
          <span className="text-accent tracking-[0.8em] uppercase text-[10px] font-bold mb-6 block">The Infrastructure</span>
          <h1 className="text-6xl md:text-9xl font-serif font-bold mb-8 italic tracking-tighter">The Substack <span className="text-accent">Bridge.</span></h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed italic">
            "Your pen. Our pixels. Their inbox. Zero friction."
          </p>
        </div>
      </section>

      {/* Financial Sovereignty Section */}
      <section className="py-32 px-6 lg:px-24 bg-[#0d0d0d] border-b border-white/5">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
               <span className="text-accent tracking-[0.4em] uppercase text-[10px] font-bold">The $10 Sovereign Pass</span>
               <h2 className="text-4xl font-serif font-bold italic text-white">Financial <br/><span className="text-accent">Sovereignty.</span></h2>
               <p className="text-gray-400 text-lg leading-relaxed font-light italic">
                  Traditional publishers take 85-90% of your earnings. Substack takes 10%. 
               </p>
               <p className="text-gray-500 text-sm leading-relaxed">
                  The ACA Sovereign Pass isn't a commission—it's a flat $10 monthly utility fee. This covers the token overhead for Gemini 3, high-volume OCR scanning, and legal audit infrastructure. 
               </p>
               <div className="flex gap-4">
                  <div className="px-6 py-4 bg-white/5 border border-white/10 text-center flex-grow">
                     <p className="text-accent text-lg font-serif">100%</p>
                     <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">Author Revenue Share</p>
                  </div>
                  <div className="px-6 py-4 bg-white/5 border border-white/10 text-center flex-grow">
                     <p className="text-accent text-lg font-serif">Gemini 3</p>
                     <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">Model Standard</p>
                  </div>
               </div>
            </div>
            <div className="p-12 border border-white/5 bg-black/40 italic text-gray-400 leading-loose text-sm font-light">
               "We decided to strip away the 'Pro' markup. At $10, we cover the tech so you can build the legacy. You keep the subscriber revenue; we keep the bridge standing."
            </div>
         </div>
      </section>

      {/* The Advantage Table */}
      <section className="py-32 px-6 lg:px-24 max-w-7xl mx-auto">
        <h2 className="text-center text-4xl font-serif font-bold italic mb-20">Comparison <span className="text-accent">Registry.</span></h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-white/5">
            <thead>
              <tr className="bg-white/5">
                <th className="p-8 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">Capability</th>
                <th className="p-8 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">Standard AI ($30)</th>
                <th className="p-8 text-left text-[10px] font-bold uppercase tracking-widest text-accent border-b border-white/5">Sovereign Pass ($10)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                <td className="p-8 font-serif italic text-white">Narrative Intelligence</td>
                <td className="p-8 text-gray-500">Generic Assistant.</td>
                <td className="p-8 text-gray-300">System-Impacted Knowledge Base.</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                <td className="p-8 font-serif italic text-white">OCR Engine</td>
                <td className="p-8 text-gray-500">Manual Entry Only.</td>
                <td className="p-8 text-gray-300">Industrial Handwriting Scanning.</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                <td className="p-8 font-serif italic text-white">Legal Audit</td>
                <td className="p-8 text-gray-500">None.</td>
                <td className="p-8 text-gray-300">Defamation & PII Anonymity Shield.</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                <td className="p-8 font-serif italic text-white">Platform Sync</td>
                <td className="p-8 text-gray-500">Manual Export.</td>
                <td className="p-8 text-gray-300">Direct Substack API Pipeline.</td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-8 font-serif italic text-white">Price Point</td>
                <td className="p-8 text-gray-500">$30/mo</td>
                <td className="p-8 text-accent font-bold">$10/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center bg-accent">
        <h3 className="text-4xl md:text-5xl font-serif font-bold italic text-white mb-8">Ready to cross?</h3>
        <div className="flex justify-center gap-8">
          <Link to="/creator-hub" className="bg-black text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all shadow-2xl">Start Free Trial</Link>
          <Link to="/author-builder" className="border border-white/20 text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-black/20 transition-all">Launch Engine</Link>
        </div>
      </section>
    </div>
  );
};

export default SubstackBridge;
