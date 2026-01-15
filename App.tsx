
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
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
import Login from './pages/Login';
import Kindred from './pages/Kindred';
import SovereignSlate from './pages/SovereignSlate';
import WrapperInfo from './pages/WrapperInfo';
import Origin from './pages/Origin';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BugReportModal from './components/BugReportModal';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean }> = ({ children, isAuthenticated }) => {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aca_beta_auth') === 'true';
  });
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('aca_beta_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('aca_beta_auth');
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#050505]">
        <Navbar onReportBug={() => setIsBugModalOpen(true)} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <ScrollToTop />
        <main className="flex-grow pt-48">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLogin={handleLogin} isAuthenticated={isAuthenticated} />} />
            <Route path="/published-books" element={<PublishedBooks isAuthenticated={isAuthenticated} />} />
            <Route path="/book/:slug" element={<BookDetails />} />
            <Route path="/narratives" element={<Narratives />} />
            <Route path="/art-gallery" element={<ArtGallery />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/why-publish" element={<WhyPublish />} />
            <Route path="/substack-bridge" element={<SubstackBridge />} />
            <Route path="/support" element={<Support />} />
            <Route path="/security" element={<Security />} />
            <Route path="/kindred-vr" element={<Kindred />} />
            <Route path="/wrapper-info" element={<WrapperInfo />} />
            <Route path="/origin-story" element={<Origin />} />
            
            <Route path="/author-builder" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthorBuilder />
              </ProtectedRoute>
            } />
            <Route path="/sovereign-slate" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <SovereignSlate />
              </ProtectedRoute>
            } />
            <Route path="/wrap-it-up" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <WrapItUp />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
        <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
      </div>
    </Router>
  );
};

export default App;
