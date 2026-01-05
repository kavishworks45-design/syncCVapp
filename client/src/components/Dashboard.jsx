import { useState, useEffect, useMemo } from 'react';
import { motion } from "framer-motion";
import { FaPlus, FaEdit, FaTrash, FaRocket, FaClock, FaCommentDots, FaMagic, FaFileAlt, FaCalendarCheck } from "react-icons/fa";
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import Sidebar from './Sidebar';

// Simple helper to format dates
const timeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};



function Dashboard({ user }) {
    const navigate = useNavigate();
    const [resumes, setResumes] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- REAL DATA DERIVATION ---
    const activityFeed = useMemo(() => {
        const rItems = resumes.map(r => ({ ...r, type: 'resume', date: r.updatedAt }));
        const jItems = jobs.map(j => ({ ...j, type: 'job', date: j.updatedAt || j.createdAt })); // Use update or create time

        const combined = [...rItems, ...jItems];
        combined.sort((a, b) => {
            const dateA = a.date?.seconds || 0;
            const dateB = b.date?.seconds || 0;
            return dateB - dateA; // Descending
        });
        return combined.slice(0, 3);
    }, [resumes, jobs]);



    const jobStats = useMemo(() => {
        const stats = { applied: 0, interview: 0, offer: 0 };
        jobs.forEach(j => {
            if (j.status === 'applied') stats.applied++;
            if (j.status === 'interview') stats.interview++;
            if (j.status === 'offer') stats.offer++;
        });
        return stats;
    }, [jobs]);

    const upcomingInterviews = useMemo(() => {
        return jobs.filter(j => j.status === 'interview').slice(0, 3);
    }, [jobs]);


    // Fetch Resumes
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `users/${user.uid}/resumes`), orderBy("updatedAt", "desc"), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResumes(docs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Fetch Jobs
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `users/${user.uid}/jobs`)); // Fetch all for stats
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setJobs(docs);
        });
        return () => unsubscribe();
    }, [user]);


    const deleteResume = async (resumeId) => {
        if (window.confirm("Are you sure you want to delete this resume? Action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, `users/${user.uid}/resumes`, resumeId));
            } catch (error) {
                console.error("Error deleting resume:", error);
            }
        }
    };

    // --- ZENITH DESIGN SYSTEM CONSTANTS ---
    const GLASS_CARD = { background: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(24px)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.5)", boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)" };
    const SOLID_CARD = { background: "#ffffff", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" };

    return (
        <div style={{ display: "flex", width: "100%", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>

            {/* AMBIENT AURORA BACKGROUND */}
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "100vh", zIndex: 0, pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "800px", height: "800px", background: "#cffafe", filter: "blur(120px)", opacity: 0.6, borderRadius: "50%" }}></div>
                <div style={{ position: "absolute", top: "10%", right: "-5%", width: "600px", height: "600px", background: "#e0e7ff", filter: "blur(100px)", opacity: 0.6, borderRadius: "50%" }}></div>
                <div style={{ position: "absolute", bottom: "-10%", left: "30%", width: "700px", height: "700px", background: "#fdf4ff", filter: "blur(140px)", opacity: 0.5, borderRadius: "50%" }}></div>
            </div>

            {/* === SIDEBAR === */}
            <Sidebar user={user} active="overview" />

            {/* === MAIN SCROLLABLE DASHBOARD === */}
            <div className="dashboard-main" style={{ flex: 1, padding: "32px 48px", overflowY: "auto", position: "relative", zIndex: 1, height: "100vh" }}>
                <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "40px" }}>

                    {/* 1. GREETING & HEADER */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "40px" }}>
                        <div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                                <p style={{ fontSize: "1rem", color: "#64748b", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Workspace</p>
                                <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.1 }}>
                                    Hello, {user?.displayName ? user.displayName.split(' ')[0] : 'Creator'}
                                    <span style={{ color: "#3b82f6" }}>.</span>
                                </h1>
                            </motion.div>
                        </div>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ ...GLASS_CARD, padding: "12px 24px", display: "flex", alignItems: "center", gap: "12px", background: "white" }}>
                                <span style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%" }}></span>
                                <span style={{ fontWeight: 600, color: "#334155" }}>Basic Plan Active</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. TOP METRICS */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "48px" }}>

                        {/* STAT 1: Applications */}
                        <motion.div whileHover={{ y: -5 }} style={{ ...SOLID_CARD, padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden", minHeight: "200px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", zIndex: 2 }}>
                                <div>
                                    <h3 style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>Active Applications</h3>
                                    <h2 style={{ fontSize: "3.5rem", fontWeight: 800, color: "#0f172a", margin: "8px 0 0 0" }}>{jobStats.applied}</h2>
                                </div>
                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FaRocket size={20} />
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", zIndex: 2 }}>
                                <div style={{ padding: "4px 8px", background: "#f0f9ff", color: "#0284c7", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700 }}>Total</div>
                                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Career Opportunities</span>
                            </div>
                            <div style={{ position: "absolute", bottom: -20, right: -20, width: "140px", height: "140px", borderRadius: "50%", border: "20px solid #f1f5f9", opacity: 0.5 }} />
                        </motion.div>

                        {/* STAT 2: Interview Pipeline */}
                        <motion.div whileHover={{ y: -5 }} style={{ ...SOLID_CARD, padding: "32px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "32px" }}>
                                <div>
                                    <h3 style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>Interviewing</h3>
                                    <h2 style={{ fontSize: "3.5rem", fontWeight: 800, color: "white", margin: "8px 0 0 0" }}>{jobStats.interview}</h2>
                                </div>
                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FaCommentDots size={20} />
                                </div>
                            </div>
                            <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "100px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(jobStats.interview / (jobStats.applied || 1)) * 100}%`, background: "#fbbf24", borderRadius: "100px" }}></div>
                            </div>
                            <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "#94a3b8" }}>Conversion Rate</div>
                        </motion.div>

                        {/* STAT 3: Offers */}
                        <motion.div whileHover={{ y: -5 }} style={{ ...SOLID_CARD, padding: "0", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "32px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <div>
                                        <h3 style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>Offers</h3>
                                        <h2 style={{ fontSize: "3.5rem", fontWeight: 800, color: "#10b981", margin: "8px 0 0 0" }}>{jobStats.offer}</h2>
                                    </div>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <FaCalendarCheck size={20} />
                                    </div>
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                                    {jobStats.offer > 0 ? "Congratulations! 🎉" : "Keep applying!"}
                                </div>
                            </div>
                        </motion.div>

                    </div>

                    {/* 3. WORKSPACE SPLIT */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }}>

                        {/* LEFT: Documents */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>My Documents</h2>
                                <Link to="/builder" style={{ textDecoration: 'none' }}>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ background: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "100px", border: "none", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
                                        <FaPlus size={12} /> Create New
                                    </motion.button>
                                </Link>
                            </div>

                            {/* Resume Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                                {loading ? (
                                    <div style={{ padding: "40px", color: "#94a3b8" }}>Loading...</div>
                                ) : resumes.length === 0 ? (
                                    <div style={{ gridColumn: "1/-1", padding: "60px", background: "rgba(255,255,255,0.5)", border: "2px dashed #cbd5e1", borderRadius: "24px", textAlign: "center" }}>
                                        <p style={{ color: "#64748b" }}>No resumes found. Create your first one!</p>
                                    </div>
                                ) : (
                                    resumes.map((doc, idx) => (
                                        <Link to={`/builder?resumeId=${doc.id}`} key={doc.id} style={{ textDecoration: 'none' }}>
                                            <motion.div
                                                whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
                                                style={{ ...SOLID_CARD, padding: "24px", transition: "all 0.3s ease" }}
                                            >
                                                {/* Paper Preview - FIXED CONTRAST & SIZING */}
                                                <div style={{ width: "100%", height: "140px", background: "#f1f5f9", borderRadius: "12px", marginBottom: "20px", display: "flex", flexDirection: "column", padding: "16px", gap: "8px", overflow: "hidden", border: "1px solid #e2e8f0", boxSizing: "border-box" }}>
                                                    <div style={{ width: "40%", height: "8px", background: "#cbd5e1", borderRadius: "4px" }}></div>
                                                    <div style={{ width: "80%", height: "6px", background: "#e2e8f0", borderRadius: "4px" }}></div>
                                                    <div style={{ width: "90%", height: "6px", background: "#e2e8f0", borderRadius: "4px" }}></div>
                                                    <div style={{ width: "75%", height: "6px", background: "#e2e8f0", borderRadius: "4px" }}></div>
                                                    <div style={{ marginTop: "12px", width: "30%", height: "8px", background: "#cbd5e1", borderRadius: "4px" }}></div>
                                                    <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "4px" }}></div>
                                                </div>

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>{doc.title || "Untitled"}</h4>
                                                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Edited {timeAgo(doc.updatedAt)}</span>
                                                    </div>
                                                    <div style={{ width: "32px", height: "32px", background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                                                        <FaEdit size={12} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Real Activity & Interviews */}
                        <div>
                            {/* UPCOMING INTERVIEWS (Replaces Fake Timer) */}
                            {upcomingInterviews.length > 0 ? (
                                <div style={{ background: "#f59e0b", borderRadius: "24px", padding: "32px", color: "white", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "1rem", opacity: 0.9, margin: "0 0 16px 0" }}>Upcoming Interviews</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {upcomingInterviews.map(job => (
                                            <div key={job.id} style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 600 }}>
                                                {job.company} - {job.jobTitle}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ ...SOLID_CARD, padding: "24px", marginBottom: "24px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white" }}>
                                    <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Weekly Goal</h3>
                                    <div style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "16px" }}>Apply to 5 high-quality roles.</div>
                                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "100px" }}>
                                        <div style={{ width: `${Math.min((jobStats.applied % 5) / 5 * 100, 100)}%`, height: "100%", background: "#3b82f6", borderRadius: "100px" }}></div>
                                    </div>
                                </div>
                            )}

                            {/* ACTIVITY FEED (Real Data) */}
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Activity Feed</h2>
                            </div>
                            <div style={{ ...GLASS_CARD, padding: "24px" }}>
                                {activityFeed.length === 0 ? (
                                    <div style={{ color: "#94a3b8", textAlign: "center", fontSize: "0.9rem" }}>No activity yet.</div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                        {activityFeed.map((item, i) => (
                                            <div key={item.id || i} style={{ display: "flex", gap: "16px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                    <div style={{ width: "36px", height: "36px", borderRadius: "100px", background: `rgba(255,255,255,0.8)`, border: `2px solid ${item.type === 'job' ? '#3b82f6' : '#64748b'}`, display: "flex", alignItems: "center", justifyContent: "center", color: item.type === 'job' ? '#3b82f6' : '#64748b', fontSize: "0.9rem" }}>
                                                        {item.type === 'job' ? <FaRocket /> : <FaFileAlt />}
                                                    </div>
                                                    {i !== activityFeed.length - 1 && <div style={{ width: "2px", flex: 1, background: "#e2e8f0", marginTop: "8px" }}></div>}
                                                </div>
                                                <div style={{ paddingTop: "4px" }}>
                                                    <div style={{ fontWeight: 600, color: "#334155", fontSize: "0.95rem" }}>
                                                        {item.type === 'job' ? `Applied to ${item.company || 'Job'}` : `Edited ${item.title}`}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{timeAgo(item.date)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.05)", textAlign: "center" }}>
                                    <Link to="/tracker" style={{ fontSize: "0.9rem", color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>View Full History →</Link>
                                </div>
                            </div>



                        </div>

                    </div>
                </div>
            </div>

            <div className="mobile-nav-spacer"></div>

            <style>{`
                .dashboard-main::-webkit-scrollbar { width: 8px; }
                .dashboard-main::-webkit-scrollbar-track { background: transparent; }
                .dashboard-main::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 4px; }
            `}</style>
        </div>
    );
}

export default Dashboard;
