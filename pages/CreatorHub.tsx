
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Book } from '../types';

const CreatorHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [publishedBooks, setPublishedBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('aca_published_books');
    return saved ? JSON.parse(saved) : [];
  });
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
    localStorage.setItem('aca_published_books', JSON.stringify(publishedBooks));
  }, [publishedBooks]);

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
    setPublishedBooks([...publishedBooks, bookToSave]);
    setIsAddingBook(false);
    setNewBook({ title: '', author: '', description: '', releaseYear: '2024', coverUrl: '' });
  };

  const deleteBook = (id: string) => {
    setPublishedBooks(publishedBooks.filter(b => b.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto py-24 px-6 text-white font-sans bg-[#050505] min-h-screen">
      <div className="mb-16 border-b border-white/5 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <span className="text-orange-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block">Creator Headquarters</span>
          <h1 className="text-6xl font-serif italic">Operational <span className="text-orange-500">Hub.</span></h1>
        </div>
        <div>
          <button 
            onClick={() => setIsAddingBook(true)} 
            className="bg-accent text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-accent/20 hover:bg-orange-600 transition-all"
          >
            Register New Edition
          </button>
        </div>
      </div>

      <div className="space-y-12 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-serif italic text-white/40 uppercase tracking-widest">Active Storefront Registry</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedBooks.length === 0 && (
            <div className="lg:col-span-3 border border-white/5 bg-white/[0.01] p-32 text-center rounded-sm">
              <p className="text-gray-600 italic font-serif text-2xl mb-4">"No custom editions registered."</p>
              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-800">Your legacy is waiting to be logged.</p>
            </div>
          )}
          
          {publishedBooks.map((book) => (
            <div key={book.id} className="bg-[#0d0d0d] border border-white/5 p-8 flex flex-col group relative rounded-sm hover:border-accent/30 transition-all duration-500">
              <div className="aspect-[2/3] bg-black border border-white/10 mb-6 overflow-hidden rounded-sm">
                <img src={book.coverUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={book.title} />
              </div>
              <h3 className="text-xl font-serif italic mb-2 text-white group-hover:text-accent transition-colors">{book.title}</h3>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">{book.author} • {book.releaseYear}</p>
              <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                <button onClick={() => deleteBook(book.id)} className="text-red-900 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-all">Remove Registry</button>
                <span className="text-[8px] font-bold text-gray-800 uppercase tracking-widest">Mastered</span>
              </div>
            </div>
          ))}

          {publishedBooks.length > 0 && (
            <div 
              onClick={() => setIsAddingBook(true)}
              className="border border-white/5 border-dashed rounded-sm aspect-[2/3] flex flex-col items-center justify-center cursor-pointer group hover:bg-white/[0.02] transition-all"
            >
              <span className="text-gray-800 group-hover:text-accent text-3xl font-serif italic transition-colors">+</span>
              <p className="text-[9px] font-black text-gray-800 uppercase tracking-widest mt-4">Add Another</p>
            </div>
          )}
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
                      <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Cover Art (Vector Supported)</label>
                      <div onClick={() => coverInputRef.current?.click()} className="w-full aspect-[2/3] bg-black border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:border-accent/40 transition-all relative overflow-hidden rounded-sm">
                        {newBook.coverUrl ? (
                          <img src={newBook.coverUrl} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <div className="text-center">
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover:text-accent transition-colors block mb-2">Select Visual Asset</span>
                            <span className="text-[8px] text-gray-800 uppercase tracking-widest italic">Supports JPG, PNG, or SVG</span>
                          </div>
                        )}
                        <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/png,image/jpeg,image/svg+xml" />
                      </div>
                    </div>
                    <button onClick={saveNewBook} disabled={!newBook.title || !newBook.coverUrl} className="w-full bg-orange-500 text-white py-6 text-[10px] font-bold uppercase tracking-[0.4em] shadow-xl disabled:opacity-20 transition-all hover:bg-orange-600 shadow-orange-500/10">Register Edition</button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-32 p-12 border border-white/5 bg-white/[0.02] text-center rounded-sm">
        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mb-6">Backup & Sync</h3>
        <p className="text-xs text-gray-700 font-light italic leading-relaxed max-w-xl mx-auto">
          "The code of this project is currently managed via GitHub. For developers or authors managing their own hosting, use the top-level 'Share to GitHub' tool for full site replication."
        </p>
      </div>

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; } @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }`}</style>
    </div>
  );
};

export default CreatorHub;
