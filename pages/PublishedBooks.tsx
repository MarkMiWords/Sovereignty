import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';

const SAMPLE_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The IVO Trap',
    author: 'Mark Mi Words',
    description: 'A brutal, honest, and necessary documentation of the Australian prison experience.',
    coverUrl: 'https://images.unsplash.com/photo-1541829081725-6f1c93bb3c24?q=80&w=1200&auto=format&fit=crop',
    slug: 'the-ivo-trap',
    releaseYear: '2024'
  }
];

interface PublishedBooksProps {
  isAuthenticated?: boolean;
}

const PublishedBooks: React.FC<PublishedBooksProps> = ({ isAuthenticated = true }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    description: '',
    releaseYear: new Date().getFullYear().toString(),
    coverUrl: ''
  });
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aca_published_books');
    const userBooks: Book[] = saved ? JSON.parse(saved) : [];
    
    // Merge and filter duplicates by slug
    const combined = [...userBooks];
    SAMPLE_BOOKS.forEach(sample => {
      if (!combined.find(b => b.slug === sample.slug)) {
        combined.push(sample);
      }
    });
    
    setBooks(combined);
  }, []);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewBook(prev => ({ ...prev, coverUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const saveNewBook = () => {
    if (!newBook.title || !newBook.coverUrl) return;
    const bookToSave: Book = {
      id: Date.now().toString(),
      title: newBook.title || '',
      author: newBook.author || 'Anonymous',
      description: newBook.description || '',
      coverUrl: newBook.coverUrl || '',
      releaseYear: newBook.releaseYear || '',
      slug: (newBook.title || '').toLowerCase().replace(/\s+/g, '-')
    };
    const updatedBooks = [bookToSave, ...books.filter(b => b.id !== bookToSave.id)];
    setBooks(updatedBooks);
    localStorage.setItem('aca_published_books', JSON.stringify(updatedBooks.filter(b => !SAMPLE_BOOKS.find(s => s.id === b.id))));
    setIsAddingBook(false);
    setNewBook({ title: '', author: '', description: '', releaseYear: '2024', coverUrl: '' });
  };

  const deleteBook = (id: string) => {
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    localStorage.setItem('aca_published_books', JSON.stringify(updated.filter(b => !SAMPLE_BOOKS.find(s => s.id === b.id))));
  };

  const triggerFileUpload = () => {
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="text-accent tracking-[0.6em] uppercase text-[10px] font-bold mb-6 block">The Storefront</span>
            <h1 className="text-6xl md:text-9xl font-serif font-black mb-12 italic leading-none tracking-tighter">
              Published <span className="animate-living-amber">Books.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 font-light max-w-3xl leading-relaxed italic opacity-80">
              "From the shadow of the cell to the light of the retail shelf. These are the narratives that broke through."
            </p>
          </div>
          {/* Enabled button for user adding book covers */}
          <div className="pb-12">
            <button 
              onClick={() => setIsAddingBook(true)}
              className="bg-accent text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-accent/20 hover:bg-orange-600 transition-all rounded-sm"
            >
              Register New Edition
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
          {books.map((book) => (
            <div key={book.id} className="group flex flex-col relative">
              <Link to={`/book/${book.slug}`} className="relative mb-8 block overflow-hidden shadow-2xl border-l-[10px] border-black rounded-r-sm bg-black aspect-[2/3]">
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black to-transparent">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-[0.4em]">View Details</span>
                </div>
              </Link>
              <h3 className="text-3xl font-serif font-bold italic mb-2 text-white group-hover:text-accent transition-colors">{book.title}</h3>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">By {book.author} • {book.releaseYear}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <Link to={`/book/${book.slug}`} className="flex-grow border border-white/10 text-white text-center py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">
                  Explore Edition
                </Link>
                {!SAMPLE_BOOKS.find(s => s.id === book.id) && (
                  <button 
                    onClick={() => deleteBook(book.id)}
                    className="ml-4 p-4 text-red-900 hover:text-red-500 transition-colors"
                    title="Remove Registry"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div 
            onClick={() => setIsAddingBook(true)}
            className="border border-white/5 border-dashed p-12 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:border-accent/40 transition-all group aspect-[2/3] cursor-pointer rounded-sm"
          >
             <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 group-hover:border-accent/40">
                <span className="text-accent text-2xl font-serif italic">+</span>
             </div>
             <h4 className="text-white font-serif italic text-xl mb-4">Register Edition</h4>
             <p className="text-[9px] text-gray-600 uppercase tracking-widest leading-loose">
               Log your latest work into the storefront registry.
             </p>
          </div>
        </div>
      </div>

      {isAddingBook && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-4xl w-full bg-[#0a0a0a] border border-white/10 p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsAddingBook(false)} className="absolute top-8 right-8 text-gray-700 hover:text-white text-3xl leading-none">×</button>
            <h2 className="text-4xl font-serif italic text-white mb-10">New Edition Registration</h2>
            <div className="grid md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Book Title</label>
                    <input value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-accent text-white" placeholder="e.g. The Sovereign Word" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Author Name</label>
                    <input value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-accent text-white" placeholder="e.g. Mark Mi Words" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Description / Blurb</label>
                    <textarea value={newBook.description} onChange={e => setNewBook({...newBook, description: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-accent text-white min-h-[180px] leading-relaxed" placeholder="The raw truth of the journey..." />
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Cover Art</label>
                    <div onClick={triggerFileUpload} className="w-full aspect-[2/3] bg-black border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:border-accent/40 transition-all relative overflow-hidden rounded-sm">
                      {newBook.coverUrl ? (
                        <img src={newBook.coverUrl} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="text-center">
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover:text-accent transition-colors block mb-2">Select Visual Asset</span>
                          <span className="text-[8px] text-gray-800 uppercase tracking-widest italic">2:3 Aspect Ratio</span>
                        </div>
                      )}
                      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
                    </div>
                  </div>
                  <button onClick={saveNewBook} disabled={!newBook.title || !newBook.coverUrl} className="w-full bg-orange-500 text-white py-6 text-[10px] font-bold uppercase tracking-[0.4em] shadow-xl disabled:opacity-20 transition-all hover:bg-orange-600 shadow-orange-500/10">Register Edition</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; } @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }`}</style>
    </div>
  );
};

export default PublishedBooks;