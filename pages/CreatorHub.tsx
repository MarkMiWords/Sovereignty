
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { listVault, saveToVault, deleteFromVault } from '../services/vault';

const CreatorHub: React.FC = () => {
  const navigate = useNavigate();
  const [publishedBooks, setPublishedBooks] = useState<Book[]>([]);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    description: '',
    releaseYear: new Date().getFullYear().toString(),
    coverUrl: ''
  });
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRegistry();
  }, []);

  const loadRegistry = async () => {
    const books = await listVault();
    setPublishedBooks(books);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewBook(prev => ({ ...prev, coverUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!newBook.title || !newBook.coverUrl) return;
    setIsProcessing(true);
    try {
      const bookToSave: Omit<Book, "slug"> = {
        id: Date.now().toString(),
        title: newBook.title || '',
        author: newBook.author || 'Anonymous',
        description: newBook.description || '',
        coverUrl: newBook.coverUrl || '',
        releaseYear: newBook.releaseYear || '2024'
      };
      await saveToVault(bookToSave);
      await loadRegistry();
      setIsAddingBook(false);
      setNewBook({ title: '', author: '', description: '', releaseYear: '2024', coverUrl: '' });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeBook = async (id: string) => {
    if (!window.confirm("Permanently erase master from vault?")) return;
    await deleteFromVault(id);
    await loadRegistry();
  };

  return (
    <div className="max-w-6xl mx-auto py-24 px-6 text-white bg-[#050505] min-h-screen">
      <div className="mb-16 border-b border-white/5 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <span className="text-orange-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block">Sovereign Forge</span>
          <h1 className="text-6xl font-serif italic">Operational <span className="text-orange-500">Hub.</span></h1>
        </div>
        <button onClick={() => setIsAddingBook(true)} className="bg-orange-500 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-orange-600 transition-all rounded-sm">Register Master</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {publishedBooks.map((book) => (
          <div key={book.id} className="bg-[#0d0d0d] border border-white/5 p-8 flex flex-col group relative rounded-sm hover:border-orange-500/30 transition-all duration-500">
            <div className="aspect-[16/27] bg-black border border-white/10 mb-6 overflow-hidden rounded-sm p-2 flex items-center justify-center">
              <img src={book.coverUrl} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700" alt={book.title} />
            </div>
            <h3 className="text-xl font-serif italic mb-2 text-white group-hover:text-orange-500 transition-colors">{book.title}</h3>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">{book.author} • {book.releaseYear}</p>
            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
              <button onClick={() => removeBook(book.id)} className="text-red-900 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-all">Erase Master</button>
              <span className="text-[8px] font-bold text-gray-800 uppercase tracking-widest">Vault Locked</span>
            </div>
          </div>
        ))}
      </div>

      {isAddingBook && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-4xl w-full bg-[#0a0a0a] border border-white/10 p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsAddingBook(false)} className="absolute top-8 right-8 text-gray-700 hover:text-white text-3xl leading-none">×</button>
            <h2 className="text-4xl font-serif italic text-white mb-10">Vault Registry</h2>
            <div className="grid md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Title</label>
                    <input value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-orange-500 text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Author</label>
                    <input value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-orange-500 text-white" />
                  </div>
                  <textarea value={newBook.description} onChange={e => setNewBook({...newBook, description: e.target.value})} className="w-full bg-black border border-white/10 p-5 text-sm font-serif outline-none focus:border-orange-500 text-white min-h-[180px]" placeholder="Description..." />
               </div>
               <div className="space-y-8">
                  <div onClick={() => coverInputRef.current?.click()} className="w-full aspect-[16/27] bg-black border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:orange-500/40 transition-all relative overflow-hidden rounded-sm">
                    {newBook.coverUrl ? (
                      <img src={newBook.coverUrl} className="w-full h-full object-contain" alt="Preview" />
                    ) : (
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover:text-orange-500">Select JPEG Master</span>
                    )}
                    <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/png,image/jpeg" />
                  </div>
                  <button onClick={handleSave} disabled={!newBook.title || !newBook.coverUrl || isProcessing} className="w-full bg-orange-500 text-white py-6 text-[10px] font-bold uppercase tracking-[0.4em] shadow-xl disabled:opacity-20 hover:bg-orange-600 rounded-sm">
                    {isProcessing ? "Atomic Sync..." : "Register Master"}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorHub;
