
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Book } from '../types';

const SAMPLE_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The IVO Trap',
    author: 'Mark Mi Words',
    description: 'A brutal, honest, and necessary documentation of the Australian prison experience. Through the eyes of those who have lived it, the book navigates the labyrinth of the Australian justice system—not through ideology, but through raw human experience.',
    coverUrl: 'https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=1200&auto=format&fit=crop',
    slug: 'the-ivo-trap',
    releaseYear: '2024'
  }
];

const BookDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aca_published_books');
    const userBooks: Book[] = saved ? JSON.parse(saved) : [];
    const found = [...userBooks, ...SAMPLE_BOOKS].find(b => b.slug === slug);
    setBook(found || null);
  }, [slug]);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center space-y-8">
           <h1 className="text-4xl font-serif italic opacity-30">Edition Not Found</h1>
           <Link to="/published-books" className="text-accent uppercase tracking-widest text-xs font-bold block">Return to Storefront</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
      <div className="flex flex-col lg:flex-row gap-24 items-start">
        {/* Mockup Column */}
        <div className="lg:w-[45%] w-full sticky top-32">
          <div className="group relative">
            <div className="absolute -inset-10 bg-accent/5 blur-[120px] rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10 transition-transform duration-700 hover:rotate-y-12 perspective-1000">
              <div className="shadow-[50px_50px_100px_rgba(0,0,0,0.8)] border-l-[15px] border-black overflow-hidden rounded-r-md bg-black relative">
                <img 
                  src={book.coverUrl} 
                  className="w-full aspect-[2/3] object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-1000" 
                  alt={book.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent rounded-full border-[10px] border-[#0a0a0a] flex items-center justify-center rotate-12 shadow-2xl">
                 <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em] text-center leading-tight">1st<br/>Edition</span>
              </div>
            </div>
            
            <div className="mt-20 space-y-6">
              <a href="https://www.amazon.com" target="_blank" rel="noopener noreferrer" className="block w-full bg-accent text-white py-6 text-center text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-orange-700 transition-all shadow-xl">Order via Amazon</a>
              <a href="#" className="block w-full border border-white/10 text-white py-6 text-center text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white/5 transition-all">Find in Independent Retailers</a>
              <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] text-center mt-4">Distributed Globally via IngramSpark</p>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:w-[55%] w-full pt-10">
          <header className="mb-16">
            <Link to="/published-books" className="text-accent text-[11px] font-bold uppercase tracking-[0.6em] mb-6 block hover:underline">← Back to Published Books</Link>
            <h1 className="text-8xl font-serif font-bold mb-8 italic text-white tracking-tighter leading-none">{book.title}</h1>
            <p className="text-2xl text-gray-500 italic font-light leading-relaxed max-w-2xl">
              "An authentic documentation of the impacted experience."
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none text-gray-400 font-light leading-loose space-y-10">
            <p className="first-letter:text-7xl first-letter:font-serif first-letter:text-accent first-letter:float-left first-letter:mr-4 first-letter:mt-2">
              {book.description.split('.')[0]}.
            </p>
            <p>
              {book.description.split('.').slice(1).join('.')}
            </p>
          </div>

          <div className="mt-24 grid md:grid-cols-2 gap-10">
             <div className="p-10 bg-[#0d0d0d] border border-white/5 group hover:border-accent/30 transition-all">
                <h4 className="text-white font-serif italic text-xl mb-6">Retail Presence</h4>
                <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest font-bold">Through our global supply chain, this volume is available to 40,000+ bookstores worldwide.</p>
                <ul className="text-xs font-bold uppercase tracking-[0.2em] space-y-4 text-gray-600">
                   <li className="flex gap-3"><span className="text-accent">•</span> Global Bookstores</li>
                   <li className="flex gap-3"><span className="text-accent">•</span> Public Libraries</li>
                   <li className="flex gap-3"><span className="text-accent">•</span> Major Digital Platforms</li>
                </ul>
             </div>
             <div className="p-10 bg-[#0d0d0d] border border-white/5 group hover:border-accent/30 transition-all">
                <h4 className="text-white font-serif italic text-xl mb-6">Volume Specs</h4>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] space-y-4 text-gray-600">
                   <div className="flex justify-between"><span>Format</span> <span className="text-gray-400">Hardcover / Digital</span></div>
                   <div className="flex justify-between"><span>Author</span> <span className="text-gray-400">{book.author}</span></div>
                   <div className="flex justify-between"><span>Year</span> <span className="text-gray-400">{book.releaseYear}</span></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
