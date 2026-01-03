import { useState, useEffect } from 'react';
import { FaRocket, FaSignOutAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
// Ensure ResumeBuilderPage is exported correctly; assuming previous step created it.
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import JobTrackerPage from './pages/JobTrackerPage';

function AppContent() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
    <div className="app-container">
      {/* GLOBAL HEADER */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1.5rem 0", // Aligned with page content
          background: "transparent", // Clean background
          position: "relative", // Not sticky by default to avoid complexity, or sticky if requested
          zIndex: 100
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

        {user && (
          <nav style={{ display: "flex", gap: "30px", alignItems: 'center' }} className="responsive-hide-mobile">
            {[
              { path: '/dashboard', label: 'Dashboard' },
              { path: '/tracker', label: 'Tracker' },
            ].map(link => {
              const isActive = window.location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    textDecoration: "none",
                    color: isActive ? "#000" : "#86868b",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "0.95rem",
                    transition: "color 0.2s ease"
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1d1d1f" }}>{user.displayName?.split(" ")[0]}</span>
              </div>
              <img src={user.photoURL} alt="Profile" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", background: "#f5f5f7" }} />

              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#86868b",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s"
                }}
                title="Sign Out"
              >
                <FaSignOutAlt size={14} />
              </button>
            </div>
          ) : (
            <Link to="/builder" style={{ textDecoration: 'none' }}>
              <button className="modern-btn" style={{ height: "40px", fontSize: "0.9rem", padding: "0 24px" }}>Get Started</button>
            </Link>
          )}
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> :
              <LandingPage onStart={() => navigate("/builder")} />
          } />

          <Route path="/dashboard" element={
            user ? <Dashboard user={user} onNewResume={() => window.location.href = '/builder'} /> : <Navigate to="/" replace />
          } />

          <Route path="/builder" element={
            <ResumeBuilderPage user={user} />
          } />

          <Route path="/tracker" element={
            <JobTrackerPage user={user} />
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
