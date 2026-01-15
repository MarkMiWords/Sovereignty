
import React, { useState } from 'react';
import { Artwork } from '../types';

const MOCK_ART: Artwork[] = [
  { id: '1', title: 'The Quiet Hours', artist: 'Luca R.', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop', tags: ['Abstract', 'Ink'] },
  { id: '2', title: 'Inner Skyline', artist: 'M. Chen', imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop', tags: ['Modern', 'Oil'] },
  { id: '3', title: 'Barred Resilience', artist: 'Anonymous', imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop', tags: ['Portrait', 'Sketch'] },
  { id: '4', title: 'Fragmented Freedom', artist: 'E. Smith', imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop', tags: ['Surrealism'] },
  { id: '5', title: 'The Long Walk', artist: 'W. Jackson', imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=800&auto=format&fit=crop', tags: ['Minimalist'] },
  { id: '6', title: 'Echo of Home', artist: 'Sarah G.', imageUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=800&auto=format&fit=crop', tags: ['Expressionism'] },
];

const ArtGallery: React.FC = () => {
  const [filter, setFilter] = useState('');

  const filteredArt = MOCK_ART.filter(art => 
    art.title.toLowerCase().includes(filter.toLowerCase()) || 
    art.artist.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-20">
      <header className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center border-b border-white/5">
        <span className="text-accent tracking-[0.6em] uppercase text-[10px] font-bold mb-6 block">Visual Narratives</span>
        <h1 className="text-6xl md:text-8xl font-serif font-bold mb-8 italic leading-none">The Curator <span className="text-accent">Gallery.</span></h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed italic opacity-80">
          "A collaborative space where visual artists provide the skin for the stories written from within."
        </p>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {['All', 'Abstract', 'Sketch', 'Modern', 'Minimalist'].map(tag => (
              <button 
                key={tag} 
                onClick={() => setFilter(tag === 'All' ? '' : tag)}
                className={`px-8 py-3 text-[9px] font-bold uppercase tracking-widest border transition-all ${filter === tag ? 'bg-accent border-accent' : 'border-white/10 text-gray-500 hover:text-white'}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="SEARCH ARTISTS OR TITLES..." 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent border-b border-white/10 px-4 py-2 text-[10px] font-bold tracking-widest focus:border-accent outline-none w-full md:w-64 placeholder:text-gray-800"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredArt.map((art) => (
            <div key={art.id} className="group relative bg-[#0d0d0d] border border-white/5 overflow-hidden transition-all duration-700 hover:border-accent/40 shadow-xl flex flex-col">
              <div className="aspect-square overflow-hidden relative">
                <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{art.artist}</p>
                    <h3 className="text-xl font-serif italic text-white">{art.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="border border-white/5 border-dashed aspect-square flex flex-col items-center justify-center text-center bg-white/[0.02] p-12">
             <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6">
                <span className="text-accent text-2xl font-serif italic">+</span>
             </div>
             <h4 className="text-white font-serif italic text-xl mb-4">Artist Submission</h4>
             <p className="text-xs text-gray-600 uppercase tracking-widest leading-loose">
               Are you a carceral artist? Upload your work to be featured in our collaborative gallery.
             </p>
             <button className="mt-8 text-[9px] font-bold text-accent uppercase tracking-[0.3em] hover:underline">Submit Portfolio</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArtGallery;
