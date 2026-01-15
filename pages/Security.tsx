
import React from 'react';

const Security: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center border-b border-white/5">
        <span className="text-accent tracking-[0.6em] uppercase text-[10px] font-bold mb-6 block">Protective Infrastructure</span>
        <h1 className="text-6xl md:text-9xl font-serif font-bold mb-12 italic leading-none tracking-tighter">
          Privacy & <span className="text-accent">Security.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed italic opacity-80">
          "Handling high-risk truths requires high-level digital shielding. We protect the story so you can tell it safely."
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-24 space-y-32">
         <section className="grid lg:grid-cols-2 gap-20">
            <div className="space-y-8">
               <h2 className="text-3xl font-serif italic text-white underline decoration-accent/30 underline-offset-8">Defamation & Pseudonyms</h2>
               <p className="text-gray-500 leading-relaxed font-light">
                  The primary risk for any carceral narrative is defamation litigation. To protect authors, our technical platform forces an AI-driven PII audit. 
               </p>
               <div className="p-8 border-l-2 border-red-500 bg-red-500/5 text-xs text-red-200/80 italic leading-loose">
                  "Authors MUST change the names of all characters, staff, and facilities unless they have express legal permission. A Captive Audience provides the tools to suggest pseudonyms, but the final legal responsibility rests with the publisher (the author)."
               </div>
            </div>
            <div className="space-y-8">
               <h2 className="text-3xl font-serif italic text-white underline decoration-accent/30 underline-offset-8">Metadata Stripping</h2>
               <p className="text-gray-500 leading-relaxed font-light">
                  When you upload images or scans, our backend processes strip all EXIF metadata. This prevents geolocation tracking or identification of the digital device used to create the archive.
               </p>
               <ul className="text-[10px] font-bold uppercase tracking-[0.3em] space-y-4 text-accent">
                  <li>• Automatic Location Erasure</li>
                  <li>• Device Signature Masking</li>
                  <li>• Anonymized Submission Paths</li>
               </ul>
            </div>
         </section>

         <section className="bg-[#0a0a0a] border border-white/5 p-12 md:p-20 relative overflow-hidden">
            <h3 className="text-2xl font-serif italic text-white mb-12">The Immutable Privacy Policy</h3>
            <div className="space-y-12 prose prose-invert max-w-none">
               <div>
                  <h4 className="text-accent uppercase text-[10px] tracking-widest font-bold mb-4">01. Data Sovereignty</h4>
                  <p className="text-gray-400 font-light">We do not 'own' your stories. By using our Standalone Export, you create a file that lives on your hardware. We only store enough metadata to link your project to the Substack Bridge.</p>
               </div>
               <div>
                  <h4 className="text-accent uppercase text-[10px] tracking-widest font-bold mb-4">02. Encryption</h4>
                  <p className="text-gray-400 font-light">All drafts within the Chapter Engine are stored in encrypted state. We do not use plain-text databases for carceral narratives.</p>
               </div>
               <div>
                  <h4 className="text-accent uppercase text-[10px] tracking-widest font-bold mb-4">03. Content Policy</h4>
                  <p className="text-gray-400 font-light">We do not sanitize raw language, sex, or descriptions of violence as long as they serve a narrative purpose. However, we reserve the right to flag content that incites real-world harm or uses non-consensual imagery.</p>
               </div>
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-serif italic select-none -rotate-12">SHIELD</div>
         </section>

         <section className="border-t border-white/5 pt-24 space-y-12">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-serif italic text-white mb-4">Succession & Trustee Protocols</h2>
               <p className="text-gray-500 font-light italic">Maintaining the bridge when the architect is unavailable.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               <div className="p-8 border border-white/5 bg-white/[0.02]">
                  <h5 className="text-[10px] font-black text-accent uppercase tracking-widest mb-4">GitHub Collaboration</h5>
                  <p className="text-xs text-gray-500 leading-relaxed italic">Add your trustee via Settings > Collaborators. Ensure they have "Admin" access to manage the billing and deployment keys.</p>
               </div>
               <div className="p-8 border border-white/5 bg-white/[0.02]">
                  <h5 className="text-[10px] font-black text-accent uppercase tracking-widest mb-4">Vercel Team Entry</h5>
                  <p className="text-xs text-gray-500 leading-relaxed italic">Invite them to the Vercel Team. This allows them to monitor the Global Edge load and verify that the app is serving users correctly.</p>
               </div>
               <div className="p-8 border border-white/5 bg-white/[0.02]">
                  <h5 className="text-[10px] font-black text-accent uppercase tracking-widest mb-4">DNS Delegation</h5>
                  <p className="text-xs text-gray-500 leading-relaxed italic">Grant "Delegate" access on Namecheap. This ensures they can manage the domain name without needing your primary account password.</p>
               </div>
            </div>
         </section>

         <section className="text-center pb-20">
            <h3 className="text-3xl font-serif italic mb-10">Responsible Storytelling.</h3>
            <p className="text-gray-500 font-light max-w-2xl mx-auto mb-12">"Truth is a weapon. Use it wisely. Use it safely."</p>
            <div className="flex justify-center gap-8">
               <a href="mailto:security@markmiwords.com" className="bg-white text-black px-12 py-5 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-accent hover:text-white transition-all">Contact Security Officer</a>
            </div>
         </section>
      </div>
    </div>
  );
};

export default Security;
