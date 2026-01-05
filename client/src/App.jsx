import { useState, useEffect } from 'react';
import { FaRocket, FaSignOutAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './firebase';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import JobTrackerPage from './pages/JobTrackerPage';
import JobsPage from './pages/JobsPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sync with Firestore profile to get Plan
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser({ ...currentUser, ...userDoc.data() });
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error("Auth sync error:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    navigate("/");
  };

  if (authLoading) return null; // Or a loading spinner

  return (
    <div className="app-main">
      {/* GLOBAL HEADER - Only on Landing Page */}
      {location.pathname === '/' && (
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            padding: "1.5rem 2rem", // Added padding since container is gone
            background: "transparent",
            position: "relative",
            zIndex: 100,
            maxWidth: "1200px",
            margin: "0 auto"
          }}
        >
          <Link to={user ? "/dashboard" : "/"} style={{ textDecoration: "none", color: "var(--primary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: 'pointer' }}>
              <div style={{ width: "32px", height: "32px", background: "#000000", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaRocket color="white" size={16} />
              </div>
              <span style={{ fontWeight: 600, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>SyncCV</span>
            </div>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link to="/builder" style={{ textDecoration: 'none' }}>
              <button className="modern-btn" style={{ height: "40px", fontSize: "0.9rem", padding: "0 24px" }}>Get Started</button>
            </Link>
          </div>
        </motion.header>
      )}

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> :
              <LandingPage onStart={() => navigate("/dashboard")} /> // Redirecting to builder should be done after login now
          } />

          <Route path="/dashboard" element={
            user ? <Dashboard user={user} onNewResume={() => window.location.href = '/builder'} /> : <Navigate to="/" replace />
          } />

          <Route path="/builder" element={
            user ? <ResumeBuilderPage user={user} /> : <Navigate to="/" replace />
          } />

          <Route path="/tracker" element={
            user ? <JobTrackerPage user={user} /> : <Navigate to="/" replace />
          } />

          <Route path="/jobs" element={
            user ? <JobsPage user={user} /> : <Navigate to="/" replace />
          } />

          <Route path="/settings" element={
            user ? <SettingsPage user={user} /> : <Navigate to="/" replace />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="aurora-bg" />
      <div className="grid-overlay" />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
