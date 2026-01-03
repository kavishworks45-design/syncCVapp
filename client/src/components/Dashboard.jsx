import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { FaPlus, FaBriefcase, FaArrowRight, FaMagic, FaChartLine, FaCheckCircle, FaClock, FaCommentDots, FaFire, FaExclamationTriangle, FaFileAlt, FaEdit } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

function Dashboard({ user, onNewResume }) {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Jobs & Resumes Data
    useEffect(() => {
        if (!user) return;

        // Jobs Query
        const qJobs = query(
            collection(db, `users/${user.uid}/jobs`),
            orderBy('updatedAt', 'desc')
        );

        // Resumes Query
        const qResumes = query(
            collection(db, `users/${user.uid}/resumes`),
            orderBy('updatedAt', 'desc')
        );

        const unsubJobs = onSnapshot(qJobs, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setJobs(jobsData);
        });

        const unsubResumes = onSnapshot(qResumes, (snapshot) => {
            const resumesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResumes(resumesData);
            setLoading(false);
        });

        return () => {
            unsubJobs();
            unsubResumes();
        };
    }, [user]);

    // Derived Stats
    const interviewCount = jobs.filter(j => j.status === 'interview').length;
    const offerCount = jobs.filter(j => j.status === 'offer').length;
    const appliedCount = jobs.filter(j => j.status === 'applied').length;
    const recentJobs = jobs.slice(0, 3);

    // Weekly Goal Logic (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyCount = jobs.filter(j => {
        const d = j.createdAt?.seconds ? new Date(j.createdAt.seconds * 1000) : new Date();
        return d > sevenDaysAgo;
    }).length;
    const weeklyGoal = 5; // Configurable goal
    const goalProgress = Math.min((weeklyCount / weeklyGoal) * 100, 100);

    // Stale Jobs Logic (Applied > 7 days ago without update)
    const staleJobs = jobs.filter(j => {
        if (j.status !== 'applied') return false;
        const d = j.updatedAt?.seconds ? new Date(j.updatedAt.seconds * 1000) : new Date();
        const diffTime = Math.abs(new Date() - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 7;
    });

    // Staggered animation for children
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'interview': return '#f59e0b'; // Amber
            case 'offer': return '#10b981'; // Emerald
            case 'rejected': return '#ef4444'; // Red
            case 'applied': return '#3b82f6'; // Blue
            default: return '#6b7280'; // Gray
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            interview: 'Interviewing',
            offer: 'Offer',
            rejected: 'Rejected',
            applied: 'Applied',
            saved: 'Saved'
        };
        return labels[status] || status;
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "6rem", position: "relative" }}>

            {/* AMBIENT BACKGROUND GLOW */}
            <div style={{ position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)", width: "80%", height: "400px", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(255,255,255,0) 70%)", filter: "blur(60px)", zIndex: -1 }}></div>

            <motion.div variants={container} initial="hidden" animate="show">

                {/* HEADER */}
                <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#86868b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Workspace</div>
                        <h1 style={{ fontSize: "3rem", fontWeight: 800, margin: 0, color: "#1d1d1f", letterSpacing: "-0.03em", lineHeight: 1 }}>
                            Welcome back, {user?.displayName ? user.displayName.split(' ')[0] : 'Creator'}
                        </h1>
                    </div>
                    {/* User Profile Pill */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "6px 8px 6px 16px", borderRadius: "100px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{user?.displayName || "Creator"}</span>
                        {user?.photoURL && <img src={user.photoURL} style={{ width: "32px", height: "32px", borderRadius: "50%" }} alt="" />}
                    </div>
                </motion.div>

                {/* PRIMARY ACTIONS GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginBottom: "24px" }} className="responsive-grid-split">

                    {/* HERO ACTION CARD */}
                    <motion.div
                        variants={item}
                        onClick={onNewResume}
                        style={{
                            background: "linear-gradient(120deg, #1d1d1f 0%, #3f3f46 100%)",
                            borderRadius: "32px", padding: "40px",
                            color: "white", position: "relative", overflow: "hidden", cursor: "pointer",
                            display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "300px"
                        }}
                        whileHover={{ scale: 1.01, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Abstract Decor */}
                        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", background: "linear-gradient(to bottom left, #3b82f6, #8b5cf6)", borderRadius: "50%", filter: "blur(60px)", opacity: 0.6 }}></div>

                        <div style={{ position: "relative", zIndex: 1, maxWidth: "70%" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", padding: "6px 12px", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, marginBottom: "20px" }}>
                                <FaMagic size={12} /> AI POWERED
                            </div>
                            <h2 style={{ fontSize: "2.2rem", fontWeight: 700, lineHeight: 1.1, marginBottom: "16px" }}>Create a new tailored resume.</h2>
                            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>Use our advanced AI to analyze job descriptions and optimize your CV in seconds.</p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
                            <button style={{ height: "56px", padding: "0 32px", borderRadius: "100px", background: "white", color: "#1d1d1f", fontWeight: 600, fontSize: "1rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                                Start Optimization <FaArrowRight size={14} />
                            </button>
                        </div>
                    </motion.div>

                    {/* TRACKER WIDGET / RECENT ACTIVITY */}
                    <motion.div
                        variants={item}
                        style={{
                            background: "white", borderRadius: "32px", padding: "32px",
                            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 10px 40px rgba(0,0,0,0.02)",
                            position: "relative", display: "flex", flexDirection: "column", gap: "24px"
                        }}
                    >
                        {/* Widget Header & Goal */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Goal</h3>
                                    <FaFire color={weeklyCount >= weeklyGoal ? "#f59e0b" : "#e5e7eb"} />
                                </div>
                                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#86868b" }}>
                                    {weeklyCount} / {weeklyGoal} this week
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "100px", overflow: "hidden" }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${goalProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    style={{ height: "100%", background: weeklyCount >= weeklyGoal ? "#10b981" : "#3b82f6", borderRadius: "100px" }}
                                />
                            </div>
                        </div>

                        {/* Stale Jobs Alert */}
                        {staleJobs.length > 0 && (
                            <div
                                onClick={() => navigate('/tracker')}
                                style={{
                                    padding: "12px 16px", background: "#fff1f2", border: "1px solid #fecdd3",
                                    borderRadius: "16px", display: "flex", gap: "12px", alignItems: "center",
                                    cursor: "pointer"
                                }}
                            >
                                <FaExclamationTriangle color="#e11d48" size={14} />
                                <div style={{ fontSize: "0.9rem", color: "#9f1239", fontWeight: 500 }}>
                                    <strong>{staleJobs.length} applications</strong> need follow-up
                                </div>
                            </div>
                        )}

                        {/* Recent Activity List */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h4 style={{ margin: 0, fontSize: "1rem", color: "#86868b", fontWeight: 600 }}>Recent Activity</h4>
                                <button
                                    onClick={() => navigate('/tracker')}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 600 }}
                                >
                                    <FaPlus size={10} /> Add
                                </button>
                            </div>

                            {recentJobs.length > 0 ? (
                                recentJobs.map(job => (
                                    <div
                                        key={job.id}
                                        onClick={() => navigate('/tracker')}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "12px", background: "#f8fafc", borderRadius: "12px", cursor: "pointer"
                                        }}
                                    >
                                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#334155" }}>{job.company}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{job.role}</div>
                                        </div>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: "100px", background: "white", color: getStatusColor(job.status), border: "1px solid", borderColor: `${getStatusColor(job.status)}20` }}>
                                            {getStatusLabel(job.status)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.9rem", padding: "10px" }}>No applications yet. Start tracking!</div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* SAVED RESUMES SECTION */}
                <motion.div variants={item} style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>My Resumes</h3>
                        <div style={{ background: "#e0f2fe", padding: "4px 10px", borderRadius: "100px", color: "#0284c7", fontSize: "0.8rem", fontWeight: 700 }}>
                            {resumes.length}
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                        {resumes.map(resume => (
                            <motion.div
                                key={resume.id}
                                onClick={() => navigate(`/builder?resumeId=${resume.id}`)}
                                whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
                                style={{
                                    background: "white", borderRadius: "20px", padding: "24px",
                                    border: "1px solid rgba(0,0,0,0.06)", cursor: "pointer",
                                    position: "relative", overflow: "hidden"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                                    <div style={{ padding: "12px", background: "#f0fdf4", color: "#16a34a", borderRadius: "12px" }}>
                                        <FaFileAlt size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>{resume.title || "Untitled Resume"}</h4>
                                        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                            Edited {resume.updatedAt?.seconds ? new Date(resume.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button style={{ background: "transparent", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                        Open Editor <FaEdit />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        {resumes.length === 0 && !loading && (
                            <div style={{ padding: "40px", border: "2px dashed #e2e8f0", borderRadius: "20px", color: "#94a3b8", textAlign: "center" }}>
                                No saved resumes yet. Save one after generating!
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* INSIGHTS GRID - Real Data */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }} className="responsive-grid-split">
                    {/* ... (Keeping existing Stats) ... */}
                    {/* ACTION CARD: INTERVIEWS */}
                    <motion.div variants={item} style={{ padding: "24px", background: "white", borderRadius: "24px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ padding: "10px", borderRadius: "10px", background: "#fff7ed", color: "#f97316" }}>
                                <FaCommentDots />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Interviews</span>
                        </div>
                        <div style={{ fontSize: "2rem", fontWeight: 700 }}>{interviewCount}</div>
                        <div style={{ fontSize: "0.85rem", color: "#86868b", marginTop: "4px" }}>Active interview processes</div>
                    </motion.div>

                    {/* STAT CARD: APPLIED */}
                    <motion.div variants={item} style={{ padding: "24px", background: "white", borderRadius: "24px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ padding: "10px", borderRadius: "10px", background: "#eff6ff", color: "#3b82f6" }}>
                                <FaClock />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Applied</span>
                        </div>
                        <div style={{ fontSize: "2rem", fontWeight: 700 }}>{appliedCount}</div>
                        <div style={{ fontSize: "0.85rem", color: "#86868b", marginTop: "4px" }}>Awaiting response</div>
                    </motion.div>

                    {/* STAT CARD: OFFERS */}
                    <motion.div variants={item} style={{ padding: "24px", background: "white", borderRadius: "24px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ padding: "10px", borderRadius: "10px", background: "#ecfdf5", color: "#10b981" }}>
                                <FaCheckCircle />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Offers</span>
                        </div>
                        <div style={{ fontSize: "2rem", fontWeight: 700 }}>{offerCount}</div>
                        <div style={{ fontSize: "0.85rem", color: "#86868b", marginTop: "4px" }}>Offers received</div>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
}

export default Dashboard;
