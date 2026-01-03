import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaExternalLinkAlt, FaSearch, FaBriefcase, FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle, FaCommentAlt, FaChevronRight } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const STATUS_CONFIG = {
    saved: { label: 'Saved', color: '#687076', bg: '#f1f3f5', icon: FaBriefcase },
    applied: { label: 'Applied', color: '#0091ff', bg: '#e6f4ff', icon: FaClock },
    interview: { label: 'Interviewing', color: '#f5a623', bg: '#fff7e6', icon: FaCommentAlt },
    offer: { label: 'Offer', color: '#13ce66', bg: '#e3f9e9', icon: FaCheckCircle },
    rejected: { label: 'Rejected', color: '#e03131', bg: '#ffe3e3', icon: FaTimesCircle }
};

const COLUMNS = Object.keys(STATUS_CONFIG).map(key => ({ id: key, ...STATUS_CONFIG[key] }));

// --- COMPONENTS ---

const CompanyLogo = ({ name }) => {
    const initials = name ? name.substring(0, 2).toUpperCase() : '??';
    // Pastel gradients for a premium look matching dashboard vibes
    const gradients = [
        'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ];
    // Deterministic selection
    const charSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bg = gradients[charSum % gradients.length];

    return (
        <div style={{
            width: "42px", height: "42px", borderRadius: "14px", background: bg,
            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem", fontWeight: 700, flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
            {initials}
        </div>
    );
};

function JobTrackerPage({ user }) {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [draggedJobId, setDraggedJobId] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [newJob, setNewJob] = useState({ company: '', role: '', url: '', status: 'saved' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        const q = query(collection(db, `users/${user.uid}/jobs`), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleAddJob = (e) => {
        e.preventDefault();
        if (!newJob.company || !newJob.role) {
            alert("Please fill in Company and Role.");
            return;
        }

        // Optimistic UI: Close modal immediately
        setIsAdding(false);
        const jobToSave = { ...newJob }; // Capture current state
        setNewJob({ company: '', role: '', url: '', status: 'saved' });

        // Submit to Firestore in background
        addDoc(collection(db, `users/${user.uid}/jobs`), {
            ...jobToSave,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }).catch((error) => {
            console.error("Add failed", error);
            alert("Failed to save application to the server. Please check your connection.");
        });
    };

    const handleDelete = async (jobId, e) => {
        e.stopPropagation();
        if (window.confirm("Archive this application?")) {
            await deleteDoc(doc(db, `users/${user.uid}/jobs`, jobId));
        }
    };

    const handleMove = async (jobId, newStatus) => {
        try {
            await updateDoc(doc(db, `users/${user.uid}/jobs`, jobId), { status: newStatus, updatedAt: serverTimestamp() });
        } catch (e) { console.error(e); }
    };

    const onDragStart = (e, id) => { setDraggedJobId(id); e.dataTransfer.effectAllowed = "move"; };
    const onDragOver = (e, colId) => { e.preventDefault(); setDragOverColumn(colId); };
    const onDrop = async (e, colId) => {
        e.preventDefault();
        const id = draggedJobId;
        setDragOverColumn(null); setDraggedJobId(null);
        if (id) await handleMove(id, colId);
    };



    if (!user) return <div style={{ padding: "4rem", textAlign: "center" }}>Please Log In</div>;

    // --- DASHBOARD STYLE VARIANTS ---
    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    return (
        <div style={{ maxWidth: "1600px", margin: "0 auto", paddingBottom: "4rem", minHeight: "90vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

            {/* HEADER SECTION (Matching Dashboard) */}
            <div style={{ padding: "2rem 2rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
                <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#86868b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Workspace</div>
                    <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
                        Application Tracker
                    </h1>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>


                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            background: "#1d1d1f", color: "white", border: "none", padding: "0 24px", height: "46px",
                            borderRadius: "100px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                        }}
                    >
                        <FaPlus size={10} /> Add Application
                    </button>
                </div>
            </div>

            {/* BOARD AREA */}
            <motion.div
                variants={containerVariants} initial="hidden" animate="show"
                style={{ overflowX: "auto", padding: "0 2rem 2rem", display: "flex", gap: "32px", paddingBottom: "40px", height: "calc(100vh - 180px)" }}
            >
                {COLUMNS.map((col, index) => {
                    const colJobs = jobs.filter(j => j.status === col.id);
                    const isDragOver = dragOverColumn === col.id;
                    const Icon = col.icon;

                    return (
                        <div
                            key={col.id}
                            onDragOver={(e) => onDragOver(e, col.id)}
                            onDrop={(e) => onDrop(e, col.id)}
                            style={{
                                flex: "0 0 340px", display: "flex", flexDirection: "column",
                                background: isDragOver ? `${col.bg}90` : "transparent",
                                borderRadius: "24px", padding: "12px", transition: "background 0.2s"
                            }}
                        >
                            {/* Column Header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "0 8px", position: "relative" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>
                                    <div style={{ padding: "6px", background: col.bg, borderRadius: "8px", color: col.color, display: "flex" }}>
                                        <Icon size={12} />
                                    </div>
                                    {col.label}
                                </div>
                                <div style={{ background: "rgba(0,0,0,0.04)", padding: "2px 10px", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
                                    {colJobs.length}
                                </div>

                                {/* Flow Arrow */}
                                {index < COLUMNS.length - 1 && (
                                    <div style={{ position: "absolute", right: "-32px", top: "50%", transform: "translateY(-50%)", color: "#d1d5db", fontSize: "1.2rem", pointerEvents: "none" }}>
                                        <FaChevronRight />
                                    </div>
                                )}
                            </div>

                            {/* Cards Container */}
                            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", padding: "4px" }}>
                                <AnimatePresence>
                                    {colJobs.map(job => (
                                        <motion.div
                                            key={job.id}
                                            layoutId={job.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, job.id)}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            whileHover={{ y: -4, boxShadow: "0 12px 24px -10px rgba(0,0,0,0.12)" }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            style={{
                                                background: "white", borderRadius: "20px",
                                                padding: "20px", cursor: "grab", position: "relative",
                                                border: "1px solid rgba(0,0,0,0.04)",
                                                boxShadow: "0 4px 6px -2px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.02)"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                                <div style={{ display: "flex", gap: "14px" }}>
                                                    <CompanyLogo name={job.company} />
                                                    <div>
                                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", fontWeight: 700, color: "#1d1d1f" }}>
                                                            {job.role}
                                                        </h4>
                                                        <div style={{ fontSize: "0.9rem", color: "#86868b" }}>
                                                            {job.company}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #f9fafb" }}>
                                                <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#9ca3af", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <FaCalendarAlt size={12} />
                                                    {job.updatedAt?.seconds
                                                        ? new Date(job.updatedAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                        : new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    }
                                                </div>

                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    {job.url && (
                                                        <a href={job.url} target="_blank" rel="noreferrer" style={{ color: "#d1d5db", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "#3b82f6"}>
                                                            <FaExternalLinkAlt size={14} />
                                                        </a>
                                                    )}
                                                    <button onClick={(e) => handleDelete(job.id, e)} style={{ border: "none", background: "none", color: "#d1d5db", cursor: "pointer", padding: 0 }} onMouseOver={e => e.currentTarget.style.color = "#ef4444"}>
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {colJobs.length === 0 && (
                                    <div style={{
                                        padding: "40px", textAlign: "center", border: "2px dashed #f3f4f6", borderRadius: "20px",
                                        color: "#d1d5db", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center"
                                    }}>
                                        <div style={{ fontSize: "1.5rem", opacity: 0.4 }}>+</div>
                                        <div style={{ fontWeight: 500 }}>Drag Applications Here</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </motion.div>

            {/* ADD MODAL */}
            <AnimatePresence>
                {isAdding && (
                    <div style={{
                        position: "fixed", inset: 0, zIndex: 2000,
                        background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                width: "480px", background: "white", borderRadius: "32px",
                                boxShadow: "0 40px 100px -20px rgba(0,0,0,0.15)", overflow: "hidden",
                                border: "1px solid rgba(0,0,0,0.04)"
                            }}
                        >
                            <div style={{ padding: "40px 40px 24px" }}>
                                <h2 style={{ margin: "0 0 8px 0", fontSize: "1.8rem", fontWeight: 800, color: "#1d1d1f", letterSpacing: "-0.02em" }}>New Application</h2>
                                <p style={{ margin: 0, color: "#86868b", fontSize: "1rem" }}>Add a job to your pipeline.</p>
                            </div>

                            <form onSubmit={handleAddJob} style={{ padding: "0 40px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
                                <input
                                    autoFocus
                                    placeholder="Company Name"
                                    value={newJob.company}
                                    onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                                    required
                                    style={{ width: "100%", padding: "18px", borderRadius: "16px", background: "#f5f5f7", border: "1px solid transparent", fontSize: "1.05rem", fontWeight: 500, outline: "none", color: "#1d1d1f" }}
                                    onFocus={e => e.target.style.background = "white"}
                                    onBlur={e => e.target.style.background = "#f5f5f7"}
                                />
                                <input
                                    placeholder="Role Title"
                                    value={newJob.role}
                                    onChange={e => setNewJob({ ...newJob, role: e.target.value })}
                                    required
                                    style={{ width: "100%", padding: "18px", borderRadius: "16px", background: "#f5f5f7", border: "1px solid transparent", fontSize: "1.05rem", fontWeight: 500, outline: "none", color: "#1d1d1f" }}
                                    onFocus={e => e.target.style.background = "white"}
                                    onBlur={e => e.target.style.background = "#f5f5f7"}
                                />
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <select
                                        value={newJob.status}
                                        onChange={e => setNewJob({ ...newJob, status: e.target.value })}
                                        style={{ flex: 1, padding: "18px", borderRadius: "16px", background: "#f5f5f7", border: "1px solid transparent", fontSize: "1rem", outline: "none", cursor: "pointer", color: "#1d1d1f", fontWeight: 500 }}
                                    >
                                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <input
                                    placeholder="Job Post URL (Optional)"
                                    value={newJob.url}
                                    onChange={e => setNewJob({ ...newJob, url: e.target.value })}
                                    style={{ width: "100%", padding: "18px", borderRadius: "16px", background: "#f5f5f7", border: "1px solid transparent", fontSize: "1.05rem", fontWeight: 500, outline: "none", color: "#1d1d1f" }}
                                    onFocus={e => e.target.style.background = "white"}
                                    onBlur={e => e.target.style.background = "#f5f5f7"}
                                />

                                <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        style={{ flex: 1, padding: "18px", borderRadius: "100px", background: "transparent", border: "none", color: "#86868b", fontWeight: 700, cursor: "pointer", fontSize: "1rem" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        style={{
                                            flex: 1, padding: "18px", borderRadius: "100px",
                                            background: isSubmitting ? "#9ca3af" : "#1d1d1f",
                                            color: "white", border: "none", fontWeight: 700,
                                            cursor: isSubmitting ? "not-allowed" : "pointer",
                                            boxShadow: isSubmitting ? "none" : "0 10px 20px -5px rgba(0,0,0,0.2)", fontSize: "1rem",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                                        }}
                                    >
                                        {isSubmitting ? "Saving..." : "Create Application"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Scrollbars */}
            <style>{`
                ::-webkit-scrollbar { height: 8px; width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #d1d5db; borderRadius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                input::placeholder { color: #9ca3af; }
            `}</style>
        </div>
    );
}

export default JobTrackerPage;
