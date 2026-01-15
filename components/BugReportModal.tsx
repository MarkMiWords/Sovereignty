import React, { useState } from 'react';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => { setIsSent(false); setReport(''); onClose(); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[#0d0d0d] border border-white/10 shadow-2xl p-12 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white text-2xl">×</button>
        <h3 className="text-4xl font-serif font-bold italic text-white mb-4">Log a <span className="text-accent">Difficulty.</span></h3>
        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <textarea required value={report} onChange={(e) => setReport(e.target.value)} placeholder="DESCRIBE THE FEEDBACK..." className="w-full bg-black border border-white/10 p-6 text-sm font-serif focus:border-accent outline-none text-gray-300 min-h-[150px] resize-none" />
            <button type="submit" className="bg-accent text-white px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-orange-700 transition-all shadow-lg w-full md:w-auto">Submit Report</button>
          </form>
        ) : (
          <div className="py-20 text-center animate-fade-in"><h4 className="text-xl font-serif italic text-white mb-2">Issue Logged</h4><p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">We're reviewing the bars now.</p></div>
        )}
      </div>
    </div>
  );
};

export default BugReportModal;