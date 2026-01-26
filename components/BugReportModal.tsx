
import React, { useState } from 'react';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState('');
  const [category, setCategory] = useState('bug');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, report }),
      });

      if (response.ok) {
        setIsSent(true);
        setTimeout(() => {
          setIsSent(false);
          setReport('');
          onClose();
        }, 2000);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6">
      <div className="max-w-2xl w-full bg-[#0d0d0d] border border-white/10 shadow-2xl p-6 md:p-12 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-500 hover:text-white text-2xl">×</button>
        <h3 className="text-2xl md:text-4xl font-serif font-bold italic text-white mb-4">Stablemate <span className="text-orange-500">Feedback.</span></h3>
        <p className="text-gray-500 text-xs italic mb-8 uppercase tracking-widest">Help refine the digital bridge for the worldwide justice ecosystem.</p>
        
        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {['bug', 'feature', 'narrative'].map(cat => (
                 <button 
                   key={cat} 
                   type="button"
                   onClick={() => setCategory(cat)}
                   className={`p-4 text-[9px] font-black uppercase tracking-widest border transition-all rounded-sm ${category === cat ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/10 text-gray-600 hover:text-white'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
            <textarea required value={report} onChange={(e) => setReport(e.target.value)} placeholder={`DESCRIBE YOUR ${category.toUpperCase()}...`} className="w-full bg-black border border-white/10 p-4 md:p-6 text-sm font-serif focus:border-orange-500 outline-none text-gray-300 min-h-[150px] resize-none" />
            <button type="submit" className="bg-orange-500 text-white px-8 py-4 md:px-12 md:py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-orange-600 transition-all shadow-lg w-full">Submit Feedback</button>
          </form>
        ) : (
          <div className="py-20 text-center animate-fade-in"><h4 className="text-xl md:text-2xl font-serif italic text-white mb-2">Registry Logged</h4><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">The Architect is reviewing your input now.</p></div>
        )}
      </div>
    </div>
  );
};

export default BugReportModal;
