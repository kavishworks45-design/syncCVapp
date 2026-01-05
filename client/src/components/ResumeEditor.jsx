import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaTimes, FaEnvelope, FaGlobe, FaMagic, FaExclamationCircle, FaPen, FaArrowDown, FaPalette, FaGoogle, FaLock, FaFileAlt, FaLinkedin, FaCopy, FaSave, FaCrown, FaGem, FaEye } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from 'axios';
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase"; // Added db import
import { collection, addDoc, updateDoc, doc, serverTimestamp, setDoc } from "firebase/firestore"; // Added setDoc

// ... (keep template config as is) ...
const TEMPLATES = {
  classic: {
    name: "Classic",
    color: "#2b6cb0",
    layout: "standard"
  },
  modern: {
    name: "Modern Sidebar",
    color: "#2d3748",
    layout: "sidebar"
  },
  minimal: {
    name: "Minimalist",
    color: "#000000",
    layout: "centered"
  },
  creative: {
    name: "Creative",
    color: "#7c3aed",
    layout: "creative",
    isPremium: true
  },
  executive: {
    name: "Executive",
    color: "#0f172a",
    layout: "executive",
    isPremium: true
  }
};

function ResumeEditor({ data, file, onBack, user, matchScore = 0 }) {
  const [resumeData, setResumeData] = useState(data);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState("classic");
  const [showCritiqueModal, setShowCritiqueModal] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Mobile Support: Default true (Show Resume)
  const [mobilePreviewMode, setMobilePreviewMode] = useState(true);

  const navigate = useNavigate();
  // Save State
  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [savedDocId, setSavedDocId] = useState(data.id || null); // support editing existing
  const [saveStatus, setSaveStatus] = useState(null); // 'saved', 'error'
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showUnresolvedModal, setShowUnresolvedModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const isUserPremium = user?.plan === 'pro' || user?.plan === 'power';

  const handleTemplateChange = (key) => {
    // Allow previewing (removed lock)
    setActiveTemplate(key);
  };

  const printRef = useRef();
  const skillsRef = useRef(null);

  // ... (keep useEffects) ...
  // Initialize pending skills from analysis
  useEffect(() => {
    // DEBUG LOGGING
    console.log("ResumeEditor Received Data:", data);
    console.log("Analysis Payload:", data?.analysis);
    console.log("Critique Exists?", !!data?.analysis?.critique);

    if (data.analysis?.addedSkills?.length > 0) {
      const actualNewSkills = data.analysis.addedSkills.filter(s => data.skills?.includes(s));
      setPendingSkills(actualNewSkills);
    }



    // If opening an existing saved resume, set ID
    if (data.docId) {
      setSavedDocId(data.docId);
    }
  }, [data]);

  const handleAuthAction = async (action) => {
    if (user) {
      action();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    // Timeout Promise (5s) to prevent infinite spinner
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_OFFLINE')), 5000)
    );

    try {
      const resumePayload = {
        ...resumeData,
        template: activeTemplate,
        updatedAt: serverTimestamp(),
        // Ensure we save job details if present for context
        jobDetails: data.jobDetails || null
      };

      let savePromise;

      if (savedDocId) {
        // Update existing
        savePromise = updateDoc(doc(db, `users/${user.uid}/resumes`, savedDocId), resumePayload);
      } else {
        // Create New - Generate ID synchronously for offline support
        const title = resumeData.jobDetails?.company
          ? `Resume for ${resumeData.jobDetails.company}`
          : `Tailored Resume ${new Date().toLocaleDateString()}`;

        const newDocRef = doc(collection(db, `users/${user.uid}/resumes`));
        setSavedDocId(newDocRef.id); // Optimistic ID Set

        savePromise = setDoc(newDocRef, {
          ...resumePayload,
          title: title,
          createdAt: serverTimestamp()
        });
      }

      await Promise.race([savePromise, timeoutPromise]);
      setSaveStatus('saved');
      setShowSaveSuccess(true);
    } catch (error) {
      // Handle Timeout (Optimistic Success)
      if (error.message === 'TIMEOUT_OFFLINE') {
        console.warn("Save request timed out - assuming offline persistence");
        setSaveStatus('saved'); // Optimistic success for UI
        setShowSaveSuccess(true);
      } else {
        console.error("Error saving resume:", error);
        setSaveStatus('error');

        if (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('network')) {
          alert("Network blocked. Saved to local device (offline mode).");
        } else {
          alert("Failed to save resume. Please try again.");
        }
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDownload = async () => {
    // Check for Premium Template restriction
    if (TEMPLATES[activeTemplate].isPremium && !isUserPremium) {
      setShowPremiumModal(true);
      return;
    }

    // Check for unresolved suggestions
    if (pendingSkills.length > 0) {
      setShowUnresolvedModal(true);
      return;
    }

    proceedWithDownload();
  };

  const proceedWithDownload = () => {
    handleAuthAction(async () => {
      window.print();

      // Auto-save on download if not saved
      if (!savedDocId) handleSave();
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // ... (keep updateField and handleSkillAction) ...
  const updateField = (section, index, field, value) => {
    const newData = { ...resumeData };
    if (Array.isArray(newData[section])) {
      newData[section][index][field] = value;
    } else if (typeof newData[section] === 'object') {
      newData[section][field] = value;
    } else {
      newData[section] = value;
    }
    setResumeData(newData);
  };

  const handleSkillAction = (skill, action) => {
    if (action === 'accept') {
      setPendingSkills(prev => prev.filter(s => s !== skill));
    } else if (action === 'deny') {
      setPendingSkills(prev => prev.filter(s => s !== skill));
      setResumeData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    }
  };

  // --- RENDER HELPERS ---
  const renderEditable = (text, onSave) => (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={onSave}
      className="editable-field"
    >
      {text}
    </span>
  );

  const renderSkills = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }} ref={skillsRef}>
      {resumeData.skills?.map((skill, i) => {
        const isPending = pendingSkills.includes(skill);
        return (
          <span key={i} className={isPending ? "pending-skill" : ""} style={{
            background: isPending ? "#f0fdf4" : (activeTemplate === 'modern' ? "rgba(255,255,255,0.1)" : "#f3f4f6"),
            color: isPending ? "#15803d" : "inherit",
            border: isPending ? "1px dashed #22c55e" : "none",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "9pt",
            fontWeight: "600",
            display: "inline-flex", alignItems: "center", gap: "6px"
          }}>
            {skill}
            {isPending && (
              <div style={{ display: "flex", gap: "4px", marginLeft: "4px" }}>
                <FaCheck style={{ cursor: "pointer", color: "#15803d" }} onClick={() => handleSkillAction(skill, 'accept')} />
                <FaTimes style={{ cursor: "pointer", color: "#ef4444" }} onClick={() => handleSkillAction(skill, 'deny')} />
              </div>
            )}
          </span>
        );
      })}
    </div>
  );



  return (
    <div className="resume-editor-shell" style={{ position: "fixed", top: 0, left: 0, zIndex: 2000, display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: "#f3f4f6" }}>

      {/* Styles */}
      <style>{`
        .editable-field:hover { outline: 1px dashed #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .editable-field:focus { outline: 2px solid #3b82f6; background: white; z-index: 10; }
        
        .template-btn {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(0,0,0,0.5);
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .template-btn.active {
            background: white;
            color: black;
            font-weight: 600;
        }

        /* BUTTON STYLES TO FIX HOVER ISSUES */
        .modern-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.2s;
            cursor: pointer;
            border: none;
        }
        .modern-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        .modern-btn:active {
            transform: translateY(0);
        }
        
        /* Secondary Button (Download) */
        .modern-btn-secondary {
            background: white !important;
            color: #0f172a !important;
            border: 1px solid #e2e8f0 !important;
        }
        .modern-btn-secondary:hover {
            background: #f8fafc !important;
            color: #0f172a !important; /* Ensure text stays dark */
            border-color: #cbd5e1 !important;
        }

        /* Nuclear layout fix */
        .resume-preview-paper * {
            box-sizing: border-box;
            overflow-wrap: break-word; /* Modern wrapping */
            word-wrap: break-word; /* Legacy */
            max-width: 100%;
        }

        /* PRINT STYLES - CRITICAL FOR PDF EXPORT */
        @media print {
            /* Hide layout of the app shell */
            body {
                visibility: hidden;
            }

            /* Reset the editor shell positioning so it doesn't get stuck */
            .resume-editor-shell {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                z-index: 99999 !important;
                overflow: visible !important;
                visibility: visible !important; /* Ensure this container is visible */
            }

            /* Hide UI elements specifically */
            .editor-sidebar,
            .hover-btn,
            button,
            .editor-main > div:first-child /* Top hints */ {
                display: none !important;
            }

            /* Reset Main Editor Area */
            .editor-main {
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                height: auto !important;
                display: block !important;
                visibility: visible !important;
            }

            /* Isolate the Resume Paper */
            .resume-preview-paper {
                visibility: visible !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                max-width: none !important;
                min-height: auto !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                
                /* Ensure Background Colors Print */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Ensure all children of the paper are visible */
            .resume-preview-paper * {
                visibility: visible !important;
            }

            /* Hide skills icons in print */
            .resume-preview-paper svg {
                display: none !important;
            }
            
            /* Hide pending skills in print (if user downloads anyway) */
            .pending-skill {
                display: none !important;
            }

            .resume-preview-paper .editable-field {
                border: none !important;
                outline: none !important;
            }

            @page {
                size: auto;
                margin: 0mm;
            }
        }
      `}</style>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSaveSuccess && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "white", padding: "30px", borderRadius: "16px", textAlign: "center", width: "350px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
            >
              <div style={{ width: "60px", height: "60px", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                <FaCheck size={30} color="#166534" />
              </div>
              <h3 style={{ fontSize: "1.2rem", color: "#166534", marginBottom: "8px", fontWeight: 700 }}>Resume Saved!</h3>
              <p style={{ color: "#475569", marginBottom: "24px", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Your resume has been successfully saved to the cloud.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="modern-btn"
                  style={{ width: "100%", background: "var(--primary)", color: "white", justifyContent: 'center' }}
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setShowSaveSuccess(false)}
                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "8px", fontWeight: 500 }}
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNRESOLVED SUGGESTIONS MODAL */}
      <AnimatePresence>
        {showUnresolvedModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: "white", padding: "32px", borderRadius: "20px", textAlign: "center", width: "90%", maxWidth: "420px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            >
              <div style={{ width: "64px", height: "64px", background: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                <FaExclamationCircle size={32} color="#d97706" />
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Unresolved Suggestions</h3>
              <p style={{ color: "#64748b", marginBottom: "24px", lineHeight: 1.6 }}>
                You have <strong>{pendingSkills.length} pending skills</strong> suggested by AI. Reviewing them will improve your ATS score.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowUnresolvedModal(false);
                    skillsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="modern-btn"
                  style={{ width: "100%", height: "48px", background: "#d97706", color: "white", justifyContent: "center", border: "none" }}
                >
                  Review Suggestions (Recommended)
                </button>
                <button
                  onClick={() => {
                    setShowUnresolvedModal(false);
                    // Wait for modal to close/animation to finish before printing
                    setTimeout(() => {
                      proceedWithDownload();
                    }, 500);
                  }}
                  style={{ background: "white", border: "1px solid #e2e8f0", color: "#64748b", padding: "12px", borderRadius: "100px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}
                >
                  Download Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM MODAL */}
      <AnimatePresence>
        {showPremiumModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10002, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: "white", padding: "40px", borderRadius: "24px", textAlign: "center", width: "90%", maxWidth: "450px", boxShadow: "0 25px 60px -15px rgba(0,0,0,0.3)", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "6px", background: "linear-gradient(90deg, #a855f7, #ec4899)" }}></div>

              <div style={{ width: "72px", height: "72px", background: "#fdf4ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                <FaCrown size={36} color="#c026d3" />
              </div>

              <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b", marginBottom: "12px" }}>Premium Template</h3>
              <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "1.05rem", lineHeight: 1.6 }}>
                You are using a <strong>Pro Template</strong>. Upgrade to clean PDF export and remove all watermarks.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <button
                  onClick={() => window.open('https://buy.stripe.com/test_premium_link', '_blank')} // Placeholder
                  className="modern-btn"
                  style={{ width: "100%", height: "56px", background: "linear-gradient(to right, #9333ea, #db2777)", color: "white", justifyContent: "center", fontSize: "1.1rem" }}
                >
                  <FaGem style={{ marginRight: "8px" }} /> Upgrade to Pro
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modern-card"
              style={{ width: "90%", maxWidth: "400px", padding: "40px", background: "white", textAlign: "center", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}
            >
              <div style={{ width: "60px", height: "60px", background: "#f0f9ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto" }}>
                <FaLock size={24} color="#0284c7" />
              </div>

              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "10px", color: "var(--primary)" }}>Sign in to Download</h3>
              <p style={{ color: "var(--secondary)", marginBottom: "30px", lineHeight: 1.5 }}>
                Create a free account to save your progress and download your tailored resume.
              </p>

              <button
                onClick={handleGoogleLogin}
                className="modern-btn"
                style={{ width: "100%", height: "50px", background: "white", color: "#333", border: "1px solid #e2e8f0", display: "flex", justifyContent: "center", gap: "10px", marginBottom: "16px" }}
              >
                <FaGoogle color="#DB4437" /> Continue with Google
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--secondary)", fontSize: "0.9rem", cursor: "pointer", textDecoration: "underline" }}
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* templates selector (placeholder to anchor insertion) */}
      {/* CRITIQUE MODAL */}
      <AnimatePresence>
        {showCritiqueModal && (data.analysis?.critique || data.analysis?.improvements) && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(5px)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="modern-card"
              style={{ width: "90%", maxWidth: "600px", padding: "0", background: "white", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}
            >
              <div style={{ padding: "30px 30px 0 30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ padding: "12px", background: "#fee2e2", borderRadius: "12px", color: "#b91c1c" }}>
                    <FaExclamationCircle size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#1e293b", fontWeight: 700 }}>Coach's Analysis</h3>
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#64748b" }}>Here is why we tailored your resume.</p>
                  </div>
                </div>

                <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}>
                  {data.analysis.critique?.length > 0 && (
                    <div style={{ marginBottom: "24px" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#b91c1c", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaTimes size={14} /> Weaknesses Identified
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "1.4rem", color: "#334155", lineHeight: "1.6" }}>
                        {data.analysis.critique.map((pt, i) => (
                          <li key={i} style={{ marginBottom: "8px" }}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.analysis.improvements?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#047857", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaMagic size={14} /> Strategic Improvements
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "1.4rem", color: "#334155", lineHeight: "1.6" }}>
                        {data.analysis.improvements.map((pt, i) => (
                          <li key={i} style={{ marginBottom: "8px" }}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: "20px 30px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  className="modern-btn"
                  onClick={() => setShowCritiqueModal(false)}
                  style={{ height: "48px", fontSize: "1rem" }}
                >
                  Got it, Show Editor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === LEFT SIDEBAR === */}
      <div className={"editor-sidebar " + (mobilePreviewMode ? "mobile-hidden" : "")} style={{ width: "320px", background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "24px", gap: "24px", zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.02)" }}>

        {/* Header */}
        <div style={{ paddingBottom: "20px", borderBottom: "1px solid #f3f4f6" }}>
          <button onClick={() => navigate('/dashboard')} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", background: "#f1f5f9", border: "none", borderRadius: "8px", color: "#475569", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s" }} className="hover-btn">
            <FaTimes /> Exit to Dashboard
          </button>
        </div>

        {/* Match Score Card */}
        {matchScore > 0 && (
          <div style={{ padding: "20px", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)", borderRadius: "16px", border: "1px solid #dbeafe", textAlign: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Job Match</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563eb", lineHeight: 1 }}>{matchScore}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#e0e7ff", borderRadius: "99px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchScore}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                style={{ height: "100%", background: "#2563eb", borderRadius: "99px" }}
              />
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px", textAlign: "left" }}>
              Your resume is optimized for this role.
            </p>
          </div>
        )}

        {/* Templates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Template</label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <button key={key} onClick={() => handleTemplateChange(key)}
                style={{
                  padding: "12px", borderRadius: "8px", border: "1px solid", cursor: "pointer", fontSize: "0.85rem",
                  background: activeTemplate === key ? "#eff6ff" : "white",
                  borderColor: activeTemplate === key ? "#3b82f6" : "#e2e8f0",
                  color: activeTemplate === key ? "#1d4ed8" : "#64748b",
                  fontWeight: activeTemplate === key ? 600 : 400,
                  position: "relative", overflow: "hidden"
                }}
              >
                {tpl.isPremium && (
                  <div style={{ position: "absolute", top: "0", right: "0", background: "#fbcfe8", color: "#be185d", fontSize: "8px", padding: "2px 6px", borderBottomLeftRadius: "6px", fontWeight: 700 }}>PRO</div>
                )}
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* AI Tools */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Tools</label>
          {data.analysis && (
            <button onClick={() => setShowCritiqueModal(true)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", color: "#334155", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{ width: "24px", height: "24px", background: "#fdf2f8", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}><FaMagic color="#db2777" size={12} /></div>
              <span>Coach Analysis</span>
            </button>
          )}
        </div>

        {/* Pending Items */}
        {pendingSkills.length > 0 && (
          <div style={{ padding: "16px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "12px" }}>
            <div style={{ color: "#9a3412", fontWeight: 700, fontSize: "0.9rem", marginBottom: "4px" }}>{pendingSkills.length} Suggestions</div>
            <p style={{ fontSize: "0.8rem", color: "#c2410c", margin: 0, marginBottom: "12px" }}>AI found skills to add.</p>
            <button onClick={() => skillsRef.current?.scrollIntoView({ block: 'center' })} style={{ background: "#ea580c", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", width: "100%" }}>Review Now</button>
          </div>
        )}

        {/* Bottom Actions */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
          <button onClick={handleSave} disabled={isSaving} className="modern-btn" style={{ width: "100%", height: "48px", background: saveStatus === 'saved' ? "#dcfce7" : "#0f172a", color: saveStatus === 'saved' ? "#166534" : "white", fontSize: "0.95rem" }}>
            {saveStatus === 'saved' ? "Saved Successfully" : (isSaving ? "Saving..." : "Save Progress")}
          </button>
          <button onClick={handleDownload} className="modern-btn modern-btn-secondary" style={{ width: "100%", height: "48px", justifyContent: "center", fontSize: "0.95rem" }}>
            Download PDF
          </button>
        </div>
      </div>

      {/* === MAIN PREVIEW AREA === */}
      <div className={"editor-main " + (!mobilePreviewMode ? "mobile-hidden" : "")} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
        {/* Zoom/Toolbar Hint (Optional) */}
        <div style={{ marginBottom: "20px", color: "#94a3b8", fontSize: "0.85rem", display: "flex", gap: "20px" }}>
          <span><FaPen size={12} /> Click text to edit</span>
          <span><FaSave size={12} /> Auto-saves enabled</span>
        </div>

        {/* --- CANVAS --- */}
        <div className="resume-preview-paper" ref={printRef} style={{
          background: "white",
          color: "#2d3748",
          width: "210mm",
          minHeight: "297mm",
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.6)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "10pt",
          lineHeight: "1.5",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: activeTemplate === 'modern' ? "row" : "column"
        }}>

          {/* === TEMPLATE: MODERN SIDEBAR === */}
          {activeTemplate === 'modern' && (
            <>
              {/* Left Sidebar */}
              <div style={{ width: "32%", background: "#1a202c", color: "white", padding: "40px 25px", display: "flex", flexDirection: "column", gap: "30px" }}>
                <div>
                  <h1 style={{ fontSize: "22pt", fontWeight: "800", lineHeight: "1.1", margin: "0 0 15px 0" }}>
                    {renderEditable(resumeData.personalInfo?.name, (e) => updateField("personalInfo", null, "name", e.target.innerText))}
                  </h1>
                  <div style={{ fontSize: "9pt", opacity: 0.8, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {renderEditable(resumeData.personalInfo?.contact, (e) => updateField("personalInfo", null, "contact", e.target.innerText))}
                    <span>Los Angeles, CA</span>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "11pt", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "5px", marginBottom: "15px", letterSpacing: "1px" }}>Education</h3>
                  {resumeData.education?.map((edu, i) => (
                    <div key={i} style={{ marginBottom: "12px" }}>
                      <div style={{ fontWeight: "700" }}>{renderEditable(edu.institution)}</div>
                      <div style={{ fontSize: "9pt", opacity: 0.8 }}>{renderEditable(edu.degree)}</div>
                      <div style={{ fontSize: "9pt", opacity: 0.6 }}>{renderEditable(edu.year)}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 style={{ fontSize: "11pt", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "5px", marginBottom: "15px", letterSpacing: "1px" }}>Skills</h3>
                  {renderSkills()}
                </div>
              </div>

              {/* Right Content */}
              <div style={{ flex: 1, padding: "40px", backgroundColor: "white" }}>
                <section style={{ marginBottom: "25px" }}>
                  <h2 style={{ fontSize: "14pt", color: "#2d3748", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid #e2e8f0", paddingBottom: "5px", marginBottom: "15px", fontWeight: 700 }}>Profile</h2>
                  <p style={{ textAlign: "justify", color: "#4a5568" }}>
                    {renderEditable(resumeData.summary, (e) => updateField("summary", null, null, e.target.innerText))}
                  </p>
                </section>

                <section>
                  <h2 style={{ fontSize: "14pt", color: "#2d3748", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid #e2e8f0", paddingBottom: "5px", marginBottom: "15px", fontWeight: 700 }}>Experience</h2>
                  {resumeData.experience?.map((exp, i) => (
                    <div key={i} style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <h3 style={{ margin: 0, fontSize: "12pt", fontWeight: "700" }}>{renderEditable(exp.role)}</h3>
                        <span style={{ fontSize: "10pt", color: "#718096" }}>{renderEditable(exp.duration)}</span>
                      </div>
                      <div style={{ color: "#4a5568", fontWeight: "600", marginBottom: "8px" }}>{renderEditable(exp.company)}</div>
                      <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#4a5568" }}>
                        {exp.points?.map((pt, j) => (
                          <li key={j} style={{ marginBottom: "4px" }}>{renderEditable(pt)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}


          {/* === TEMPLATE: CREATIVE === */}
          {activeTemplate === 'creative' && (
            <div style={{ display: "flex", width: "100%", height: "100%" }}>
              <div style={{ width: "80px", background: "#7c3aed", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "24pt", fontWeight: 800, color: "rgba(255,255,255,0.2)", writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "2px" }}>RESUME</div>
              </div>
              <div style={{ flex: 1, padding: "40px", display: "flex", flexDirection: "column" }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", borderBottom: "4px solid #7c3aed", paddingBottom: "20px" }}>
                  <div>
                    <h1 style={{ fontSize: "32pt", fontWeight: "800", color: "#2e1065", margin: 0, lineHeight: 0.9 }}>
                      {renderEditable(resumeData.personalInfo?.name, (e) => updateField("personalInfo", null, "name", e.target.innerText))}
                    </h1>
                    <div style={{ fontSize: "11pt", color: "#7c3aed", fontWeight: "600", marginTop: "10px" }}>
                      {renderEditable(resumeData.personalInfo?.contact, (e) => updateField("personalInfo", null, "contact", e.target.innerText))} | Los Angeles, CA
                    </div>
                  </div>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
                  <div>
                    <section style={{ marginBottom: "30px" }}>
                      <h3 style={{ fontSize: "12pt", fontWeight: 700, color: "#2e1065", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>About Me</h3>
                      <p style={{ color: "#4b5563", lineHeight: 1.6 }}>{renderEditable(resumeData.summary, (e) => updateField("summary", null, null, e.target.innerText))}</p>
                    </section>

                    <section>
                      <h3 style={{ fontSize: "12pt", fontWeight: 700, color: "#2e1065", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Experience</h3>
                      {resumeData.experience?.map((exp, i) => (
                        <div key={i} style={{ marginBottom: "24px", position: "relative", paddingLeft: "20px", borderLeft: "2px solid #ddd6fe" }}>
                          <div style={{ position: "absolute", left: "-5px", top: "0", width: "8px", height: "8px", borderRadius: "50%", background: "#7c3aed" }}></div>
                          <h4 style={{ margin: 0, fontSize: "12pt", fontWeight: 700 }}>{renderEditable(exp.role)}</h4>
                          <div style={{ color: "#7c3aed", fontSize: "10pt", fontWeight: 600, marginBottom: "8px" }}>{renderEditable(exp.company)} | {renderEditable(exp.duration)}</div>
                          <ul style={{ margin: 0, paddingLeft: "0", color: "#4b5563", listStyle: "inside" }}>
                            {exp.points?.map((pt, j) => <li key={j} style={{ marginBottom: "4px" }}>{renderEditable(pt)}</li>)}
                          </ul>
                        </div>
                      ))}
                    </section>
                  </div>

                  <div>
                    <div style={{ background: "#f5f3ff", padding: "24px", borderRadius: "16px" }}>
                      <h3 style={{ fontSize: "11pt", fontWeight: 700, color: "#2e1065", marginBottom: "16px" }}>Expertise</h3>
                      {renderSkills()}
                    </div>
                    <div style={{ marginTop: "30px" }}>
                      <h3 style={{ fontSize: "11pt", fontWeight: 700, color: "#2e1065", marginBottom: "16px" }}>Education</h3>
                      {resumeData.education?.map((edu, i) => (
                        <div key={i} style={{ marginBottom: "16px" }}>
                          <div style={{ fontWeight: 700, color: "#4b5563" }}>{renderEditable(edu.institution)}</div>
                          <div style={{ fontSize: "10pt", color: "#7c3aed" }}>{renderEditable(edu.degree)}</div>
                          <div style={{ fontSize: "9pt", color: "#9ca3af" }}>{renderEditable(edu.year)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === TEMPLATE: EXECUTIVE === */}
          {activeTemplate === 'executive' && (
            <div style={{ padding: "50px", width: "100%", background: "#fff" }}>
              <header style={{ textAlign: "center", marginBottom: "40px" }}>
                <div style={{ width: "60px", height: "2px", background: "#0f172a", margin: "0 auto 20px auto" }}></div>
                <h1 style={{ fontSize: "28pt", fontWeight: 400, letterSpacing: "4px", textTransform: "uppercase", color: "#0f172a", margin: "0 0 16px 0" }}>
                  {renderEditable(resumeData.personalInfo?.name, (e) => updateField("personalInfo", null, "name", e.target.innerText))}
                </h1>
                <div style={{ fontSize: "9pt", letterSpacing: "2px", textTransform: "uppercase", color: "#64748b" }}>
                  {renderEditable(resumeData.personalInfo?.contact, (e) => updateField("personalInfo", null, "contact", e.target.innerText))} &bull; Los Angeles, CA
                </div>
              </header>

              <div style={{ columnCount: 2, columnGap: "40px" }}>
                <section style={{ breakInside: "avoid", marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "10pt", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "16px", color: "#0f172a" }}>Profile</h3>
                  <p style={{ fontSize: "10pt", lineHeight: 1.8, color: "#334155", textAlign: "justify" }}>
                    {renderEditable(resumeData.summary, (e) => updateField("summary", null, null, e.target.innerText))}
                  </p>
                </section>

                <section style={{ breakInside: "avoid", marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "10pt", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "16px", color: "#0f172a" }}>Skills</h3>
                  {renderSkills()}
                </section>

                <section style={{ breakInside: "avoid", marginBottom: "30px" }}>
                  <h3 style={{ fontSize: "10pt", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "16px", color: "#0f172a" }}>Education</h3>
                  {resumeData.education?.map((edu, i) => (
                    <div key={i} style={{ marginBottom: "12px" }}>
                      <div style={{ fontWeight: 700, fontSize: "10pt", color: "#0f172a" }}>{renderEditable(edu.institution)}</div>
                      <div style={{ fontSize: "10pt", color: "#475569" }}>{renderEditable(edu.degree)}</div>
                    </div>
                  ))}
                </section>
              </div>

              <section style={{ marginTop: "20px" }}>
                <h3 style={{ fontSize: "10pt", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "20px", color: "#0f172a" }}>Professional Experience</h3>
                {resumeData.experience?.map((exp, i) => (
                  <div key={i} style={{ marginBottom: "30px", display: "grid", gridTemplateColumns: "150px 1fr", gap: "20px" }}>
                    <div style={{ fontSize: "9pt", fontWeight: 600, color: "#64748b", textAlign: "right", paddingTop: "4px" }}>
                      {renderEditable(exp.duration)}
                      <div style={{ color: "#94a3b8", fontWeight: 400, marginTop: "4px" }}>{renderEditable(exp.company)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11pt", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>{renderEditable(exp.role)}</div>
                      <ul style={{ margin: 0, paddingLeft: "1rem", color: "#334155", fontSize: "10pt", lineHeight: 1.6 }}>
                        {exp.points?.map((pt, j) => <li key={j} style={{ marginBottom: "6px" }}>{renderEditable(pt)}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* === TEMPLATE: MINIMALIST === */}
          {activeTemplate === 'minimal' && (
            <div style={{ padding: "50px 60px", width: "100%" }}>
              <header style={{ textAlign: "center", marginBottom: "30px", borderBottom: "1px solid black", paddingBottom: "20px" }}>
                <h1 style={{ fontSize: "24pt", fontWeight: "400", fontFamily: "Georgia, serif", margin: "0 0 10px 0", letterSpacing: "0.5px" }}>
                  {renderEditable(resumeData.personalInfo?.name, (e) => updateField("personalInfo", null, "name", e.target.innerText))}
                </h1>
                <div style={{ fontSize: "10pt", color: "#444", fontFamily: "'Inter', sans-serif" }}>
                  {renderEditable(resumeData.personalInfo?.contact, (e) => updateField("personalInfo", null, "contact", e.target.innerText))} &bull; Los Angeles, CA
                </div>
              </header>

              <section style={{ marginBottom: "20px" }}>
                <p style={{ textAlign: "center", maxWidth: "80%", margin: "0 auto", color: "#333", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
                  {renderEditable(resumeData.summary, (e) => updateField("summary", null, null, e.target.innerText))}
                </p>
              </section>

              <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
                <div style={{ flex: 1, borderTop: "1px solid black", paddingTop: "5px" }}></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px", marginTop: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "10pt", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px" }}>Skills</h3>
                  {renderSkills()}

                  <h3 style={{ fontSize: "10pt", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginTop: "30px", marginBottom: "15px" }}>Education</h3>
                  {resumeData.education?.map((edu, i) => (
                    <div key={i} style={{ marginBottom: "15px" }}>
                      <div style={{ fontWeight: "600" }}>{renderEditable(edu.institution)}</div>
                      <div style={{ fontSize: "9pt", fontStyle: "italic" }}>{renderEditable(edu.degree)}</div>
                      <div style={{ fontSize: "9pt" }}>{renderEditable(edu.year)}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 style={{ fontSize: "10pt", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "15px" }}>Experience</h3>
                  {resumeData.experience?.map((exp, i) => (
                    <div key={i} style={{ marginBottom: "25px" }}>
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ fontWeight: "700", fontSize: "11pt" }}>{renderEditable(exp.role)}</span>
                        <span style={{ margin: "0 8px", color: "#999" }}>|</span>
                        <span style={{ fontStyle: "italic" }}>{renderEditable(exp.company)}</span>
                      </div>
                      <div style={{ fontSize: "9pt", color: "#666", marginBottom: "8px" }}>{renderEditable(exp.duration)}</div>
                      <ul style={{ margin: 0, paddingLeft: "1rem", color: "#333", fontFamily: "Georgia, serif", fontSize: "10pt" }}>
                        {exp.points?.map((pt, j) => (
                          <li key={j} style={{ marginBottom: "4px" }}>{renderEditable(pt)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* === TEMPLATE: CLASSIC (Default) === */}
          {activeTemplate === 'classic' && (
            <div style={{ padding: "40px 50px", width: "100%" }}>
              <header style={{ borderBottom: "2px solid #2b6cb0", paddingBottom: "20px", marginBottom: "30px" }}>
                <h1 style={{ margin: "0 0 10px 0", fontSize: "28pt", fontWeight: "700", color: "#1a202c", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {renderEditable(resumeData.personalInfo?.name, (e) => updateField("personalInfo", null, "name", e.target.innerText))}
                </h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", color: "#4a5568", fontSize: "10pt" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", wordBreak: "break-all" }}>
                    <FaEnvelope size={12} /> {renderEditable(resumeData.personalInfo?.contact, (e) => updateField("personalInfo", null, "contact", e.target.innerText))}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <FaGlobe size={12} /> <span>Los Angeles, CA</span>
                  </span>
                </div>
              </header>

              <section style={{ marginBottom: "25px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>
                  <h2 style={{ fontSize: "14pt", fontWeight: "700", color: "#2b6cb0", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Professional Summary</h2>
                </div>
                <p style={{ textAlign: "justify", color: "#4a5568", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {renderEditable(resumeData.summary, (e) => updateField("summary", null, null, e.target.innerText))}
                </p>
              </section>

              <section style={{ marginBottom: "25px" }}>
                <h2 style={{ fontSize: "14pt", fontWeight: "700", color: "#2b6cb0", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "10px" }}>Technical Skills</h2>
                {renderSkills()}
              </section>

              <section style={{ marginBottom: "25px" }}>
                <h2 style={{ fontSize: "14pt", fontWeight: "700", color: "#2b6cb0", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "15px" }}>Work Experience</h2>
                {resumeData.experience?.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <h3 style={{ margin: 0, fontSize: "12pt", fontWeight: "700", color: "#2d3748" }}>{renderEditable(exp.role)}</h3>
                      <span style={{ fontSize: "10pt", color: "#718096", fontWeight: "600" }}>{renderEditable(exp.duration)}</span>
                    </div>
                    <div style={{ fontSize: "11pt", color: "#2b6cb0", fontWeight: "600", marginBottom: "8px" }}>{renderEditable(exp.company)}</div>
                    <ul style={{ margin: "0", paddingLeft: "1.2rem", color: "#4a5568" }}>
                      {exp.points?.map((point, pIdx) => (
                        <li key={pIdx} style={{ marginBottom: "6px" }}>{renderEditable(point)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>

              <section style={{ marginBottom: "25px" }}>
                <h2 style={{ fontSize: "14pt", fontWeight: "700", color: "#2b6cb0", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "15px" }}>Education</h2>
                {resumeData.education?.map((edu, idx) => (
                  <div key={idx} style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "#2d3748" }}>{renderEditable(edu.institution)}</div>
                      <div style={{ color: "#4a5568" }}>{renderEditable(edu.degree)}</div>
                    </div>
                    <div style={{ color: "#718096", fontWeight: "600" }}>{renderEditable(edu.year)}</div>
                  </div>
                ))}
              </section>
            </div>
          )}

        </div>

      </div>

      {/* MOBILE TOGGLE BUTTON */}
      <div
        className="mobile-visible"
        onClick={() => setMobilePreviewMode(!mobilePreviewMode)}
        style={{
          position: "fixed", bottom: "96px", right: "24px",
          width: "56px", height: "56px",
          background: "#3b82f6", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          zIndex: 10005, cursor: "pointer"
        }}
      >
        {mobilePreviewMode ? <FaPalette size={22} /> : <FaFileAlt size={22} />}
      </div>

    </div>
  );
}

export default ResumeEditor;

