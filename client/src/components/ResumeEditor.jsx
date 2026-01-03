import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaTimes, FaEnvelope, FaGlobe, FaMagic, FaExclamationCircle, FaPen, FaArrowDown, FaPalette, FaGoogle, FaLock, FaFileAlt, FaLinkedin, FaCopy, FaSave } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from 'axios';
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase"; // Added db import
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"; // Added Firestore imports

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
  }
};

function ResumeEditor({ data, file, onBack, user }) {
  const [resumeData, setResumeData] = useState(data);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState("classic");
  const [showCritiqueModal, setShowCritiqueModal] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [savedDocId, setSavedDocId] = useState(data.id || null); // support editing existing
  const [saveStatus, setSaveStatus] = useState(null); // 'saved', 'error'

  // Cover Letter State
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState(null);

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
    try {
      const resumePayload = {
        ...resumeData,
        template: activeTemplate,
        updatedAt: serverTimestamp(),
        // Ensure we save job details if present for context
        jobDetails: data.jobDetails || null
      };

      if (savedDocId) {
        // Update existing
        await updateDoc(doc(db, `users/${user.uid}/resumes`, savedDocId), resumePayload);
      } else {
        // Create New
        // Generate a default title
        const title = resumeData.jobDetails?.company
          ? `Resume for ${resumeData.jobDetails.company}`
          : `Tailored Resume ${new Date().toLocaleDateString()}`;

        const docRef = await addDoc(collection(db, `users/${user.uid}/resumes`), {
          ...resumePayload,
          title: title,
          createdAt: serverTimestamp()
        });
        setSavedDocId(docRef.id);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Error saving resume:", error);
      setSaveStatus('error');
      alert("Failed to save resume.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    handleAuthAction(async () => {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Tailored_Resume.pdf");

      // Auto-save on download if not saved
      if (!savedDocId) handleSave();
    });
  };

  const handleGenerateCoverLetter = async () => {
    if (!file) {
      // If we don't have the file (e.g. loaded from save), we might need another way.
      // For now, alert if missing.
      alert("Original file is missing. Cannot generate cover letter.");
      return;
    }

    setIsGeneratingCoverLetter(true);
    setShowCoverLetterModal(true);

    const formData = new FormData();
    formData.append('resume', file);
    if (data.jobDetails) {
      if (data.jobDetails.text) formData.append('jobText', data.jobDetails.text);
      if (data.jobDetails.url) formData.append('jobUrl', data.jobDetails.url);
    }

    try {
      const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
      const response = await axios.post(`${API_BASE}/api/cover-letter`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCoverLetterData(response.data);
    } catch (error) {
      console.error("Cover Letter Error", error);
      setCoverLetterData({ error: "Failed to generate. Please try again." });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
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
          <span key={i} style={{
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
    <div className="resume-editor-container" style={{ display: "flex", gap: "2rem", flexDirection: "column", alignItems: "center", position: 'relative', width: "100%" }}>

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

        /* Nuclear layout fix */
        .resume-preview-paper * {
            box-sizing: border-box;
            overflow-wrap: break-word; /* Modern wrapping */
            word-wrap: break-word; /* Legacy */
            max-width: 100%;
        }
      `}</style>

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

      {/* COVER LETTER MODAL */}
      <AnimatePresence>
        {showCoverLetterModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modern-card"
              style={{ width: "90%", maxWidth: "700px", height: "80vh", padding: "0", background: "white", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              {isGeneratingCoverLetter ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid #f3f4f6", borderTopColor: "#3b82f6" }}
                  />
                  <p style={{ color: "#64748b", fontWeight: 500 }}>Drafting your cover letter...</p>
                </div>
              ) : coverLetterData?.error ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ color: "#ef4444" }}>{coverLetterData.error}</p>
                  <button onClick={() => setShowCoverLetterModal(false)}>Close</button>
                </div>
              ) : (
                <>
                  <div style={{ padding: "20px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                      <FaFileAlt color="#3b82f6" /> Your Cover Letter
                    </h3>
                    <button onClick={() => setShowCoverLetterModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><FaTimes size={18} /></button>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "30px", display: "flex", flexDirection: "column", gap: "30px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Cover Letter</label>
                        <button onClick={() => copyToClipboard(coverLetterData?.coverLetter)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>Copy Text</button>
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#334155", background: "white", padding: "20px", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                        {coverLetterData?.coverLetter}
                      </div>
                    </div>

                    <div style={{ background: "#f0f9ff", padding: "20px", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0284c7", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}><FaLinkedin /> LinkedIn Connection Message</label>
                        <button onClick={() => copyToClipboard(coverLetterData?.linkedinMessage)} style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>Copy</button>
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#0c4a6e" }}>
                        {coverLetterData?.linkedinMessage}
                      </div>
                    </div>
                  </div>
                </>
              )}
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

      {/* Templates Selector */}
      <div className="modern-card" style={{ padding: "12px 24px", width: "100%", maxWidth: "210mm", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaPalette color="var(--secondary)" />
          <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.9rem" }}>Choose Template:</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {Object.entries(TEMPLATES).map(([key, tpl]) => (
            <button
              key={key}
              className={`template-btn ${activeTemplate === key ? 'active' : ''}`}
              onClick={() => setActiveTemplate(key)}
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="actions-bar" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: "210mm",
        position: "sticky",
        top: "20px",
        zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        padding: "10px 20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 20px -10px rgba(0,0,0,0.1)"
      }}>
        <button onClick={onBack} className="modern-btn modern-btn-secondary" style={{ padding: "0 20px", height: "44px", fontSize: "0.9rem" }}>
          <FaTimes /> Cancel
        </button>

        {/* CENTER: AI TOOLS & SAVE */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="modern-btn modern-btn-secondary"
            onClick={handleGenerateCoverLetter}
            style={{ height: "44px", fontSize: "0.9rem", display: "flex", gap: "8px", alignItems: "center", background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
            title={!file ? "Original file needed" : "Draft a cover letter"}
          >
            <FaFileAlt /> Cover Letter
          </button>

          <button
            className="modern-btn modern-btn-secondary"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              height: "44px",
              fontSize: "0.9rem",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              background: saveStatus === 'saved' ? "#dcfce7" : "#f1f5f9",
              color: saveStatus === 'saved' ? "#166534" : "#475569",
              borderColor: saveStatus === 'saved' ? "#bbf7d0" : "#e2e8f0"
            }}
          >
            {isSaving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 14, height: 14, border: "2px solid currentColor", borderRadius: "50%", borderTopColor: "transparent" }} />
            ) : (
              saveStatus === 'saved' ? <FaCheck /> : <FaSave />
            )}
            {saveStatus === 'saved' ? "Saved" : "Save"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {pendingSkills.length > 0 ? (
            <button className="modern-btn" onClick={() => skillsRef.current?.scrollIntoView({ block: 'center' })} style={{ background: "#f59e0b", color: "white", height: "44px", fontSize: "0.9rem" }}>
              Resolve {pendingSkills.length} Suggestions <FaArrowDown />
            </button>
          ) : (
            <button className="modern-btn" onClick={handleDownload} style={{ background: "#10b981", color: "white", height: "44px", fontSize: "0.9rem" }}>
              <FaCheck /> Accept & Download PDF
            </button>
          )}
        </div>
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

      {/* === BOTTOM ACTIONS === */}
      <div style={{ marginTop: "40px", marginBottom: "60px", width: "100%", maxWidth: "210mm", display: "flex", justifyContent: "flex-end" }}>
        {pendingSkills.length > 0 ? (
          <button className="modern-btn" onClick={() => skillsRef.current?.scrollIntoView({ block: 'center' })} style={{ background: "#f59e0b", color: "black", height: "50px", fontSize: "1rem", width: "100%" }}>
            Resolve {pendingSkills.length} Pending Suggestions <FaArrowDown />
          </button>
        ) : (
          <button className="modern-btn" onClick={handleDownload} style={{ background: "#10b981", color: "black", height: "50px", fontSize: "1rem", width: "100%" }}>
            <FaCheck /> Confirm & Download Resume
          </button>
        )}
      </div>

    </div>
  );
}

export default ResumeEditor;

