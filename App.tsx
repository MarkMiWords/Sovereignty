
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Storefront from './pages/Storefront';
import BookDetails from './pages/BookDetails';
import PublishedBooks from './pages/PublishedBooks';
import Narratives from './pages/Narratives';
import AuthorBuilder from './pages/AuthorBuilder';
import WrapItUp from './pages/WrapItUp';
import ArtGallery from './pages/ArtGallery';
import Mission from './pages/Mission';
import WhyPublish from './pages/WhyPublish';
import SubstackBridge from './pages/SubstackBridge';
import Support from './pages/Support';
import Security from './pages/Security';
import Kindred from './pages/Kindred';
import SovereignSlate from './pages/SovereignSlate';
import WrapperInfo from './pages/WrapperInfo';
import SovereignVault from './pages/SovereignVault';
import Origin from './pages/Origin';
import LiveRules from './pages/LiveRules';
import LiveSession from './pages/LiveSession';
import Blueprints from './pages/Blueprints';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BugReportModal from './components/BugReportModal';
import MicHandshake from './components/MicHandshake';
import { readJson } from './utils/safeStorage';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = "auto";
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  // Global Theme Initialization
  useEffect(() => {
    const profile = readJson<any>('aca_author_profile', { theme: 'amber' });
    if (profile.theme && profile.theme !== 'amber') {
      document.body.className = `theme-${profile.theme}`;
    } else {
      document.body.className = '';
    }
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#050505]">
        <ScrollToTop />
        <MicHandshake />
        <Navbar onReportBug={() => setIsBugModalOpen(true)} />
        <main className="flex-grow pt-24 relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/storefront" element={<Storefront />} />
            <Route path="/published-books" element={<PublishedBooks />} />
            <Route path="/book/:slug" element={<BookDetails />} />
            <Route path="/narratives" element={<Narratives />} />
            <Route path="/art-gallery" element={<ArtGallery />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/why-publish" element={<WhyPublish />} />
            <Route path="/substack-bridge" element={<SubstackBridge />} />
            <Route path="/support" element={<Support />} />
            <Route path="/security" element={<Security />} />
            <Route path="/virty-dating" element={<Kindred />} />
            <Route path="/wrapper-info" element={<WrapperInfo />} />
            <Route path="/origin-story" element={<Origin />} />
            <Route path="/author-builder" element={<AuthorBuilder />} />
            <Route path="/sovereign-slate" element={<SovereignSlate />} />
            <Route path="/sovereign-vault" element={<SovereignVault />} />
            <Route path="/wrap-it-up" element={<WrapItUp />} />
            <Route path="/live-protocol" element={<LiveRules />} />
            <Route path="/live-link" element={<LiveSession />} />
            <Route path="/blueprints" element={<Blueprints />} />
          </Routes>
        </main>
        <Footer />
        <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
      </div>
    </Router>
  );
};

export default App;
