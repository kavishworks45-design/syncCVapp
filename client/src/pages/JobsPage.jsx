import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaSearch, FaMapMarkerAlt, FaBuilding, FaClock, FaBriefcase, FaExternalLinkAlt, FaGlobeAmericas } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function JobsPage({ user }) {
    const navigate = useNavigate();

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("Software Engineer");
    const [location, setLocation] = useState("United States");
    const [filter, setFilter] = useState("All");

    // Data State
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial Search on Mount
    useEffect(() => {
        handleSearch();
    }, []);

    // Re-run search when filter changes
    useEffect(() => {
        if (jobs.length > 0) handleSearch();
    }, [filter]);

    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
            const response = await axios.post(`${API_BASE}/api/find-jobs`, {
                query: searchTerm,
                location: location,
                type: filter
            });

            if (response.data.jobs) {
                setJobs(response.data.jobs);
            } else {
                setJobs([]);
            }
        } catch (err) {
            console.error("Search Failed", err);
            setError("Failed to fetch jobs. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    // Helper for generic logo colors
    const getRandomColor = (str) => {
        const colors = ['#fee2e2', '#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff', '#fce7f3'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const handleTrack = async (job) => {
        if (!user) {
            alert("Please login to save jobs.");
            return;
        }
        try {
            await addDoc(collection(db, `users/${user.uid}/jobs`), {
                company: job.company,
                role: job.title,
                url: job.applyLink,
                status: 'saved',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            alert("Job saved to Tracker!");
        } catch (error) {
            console.error("Error saving job:", error);
            alert("Failed to save job.");
        }
    };

    return (
        <div className="responsive-page-container" style={{ maxWidth: "800px", minHeight: "100vh", margin: "0 auto", paddingBottom: "80px" }}>

            {/* --- HEADER --- */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", padding: "20px 0", borderBottom: "1px solid #f1f5f9" }}>
                <button onClick={() => navigate('/dashboard')} className="hover-text-primary" style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "var(--secondary)" }}>
                    <FaArrowLeft /> Dashboard
                </button>
                <div style={{ fontWeight: 600, color: "var(--primary)" }}>Job Search Engine</div>
            </header>

            {/* --- HERO --- */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h1 className="hero-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Find Your Dream Job</h1>
                <p style={{ color: "var(--secondary)" }}>Aggregating the best opportunities from across the web.</p>
            </div>

            {/* --- SEARCH BAR --- */}
            <div className="modern-card" style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "8px", background: "white", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", padding: "8px" }}>
                    <FaSearch color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Job title, keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ border: "none", outline: "none", flex: 1, fontSize: "1rem", color: "var(--primary)" }}
                    />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px" }}>
                    <FaMapMarkerAlt color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ border: "none", outline: "none", flex: 1, fontSize: "1rem", color: "var(--primary)" }}
                    />
                    <button onClick={handleSearch} className="modern-btn" style={{ padding: "8px 24px", height: "auto" }}>Search</button>
                </div>
            </div>

            {/* --- FILTERS --- */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "1rem" }} className="hide-scrollbar">
                {["All", "Full-time", "Contract", "Remote", "Internship"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: "6px 16px", borderRadius: "20px", border: "1px solid",
                        borderColor: filter === f ? "var(--primary)" : "#e2e8f0", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap",
                        background: filter === f ? "var(--primary)" : "white", color: filter === f ? "white" : "var(--secondary)",
                        transition: "all 0.2s"
                    }}>{f}</button>
                ))}
            </div>

            {/* --- FEED --- */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <AnimatePresence>
                    {error && (
                        <div style={{ padding: "16px", background: "#fee2e2", color: "#b91c1c", borderRadius: "12px", border: "1px solid #fecaca", textAlign: "center" }}>
                            {error}
                        </div>
                    )}
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "4rem", color: "var(--secondary)" }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-block", marginBottom: "16px" }}>
                                <FaGlobeAmericas size={32} color="#3b82f6" />
                            </motion.div>
                            <p>Searching thousands of jobs...</p>
                        </div>
                    ) : jobs.length > 0 ? (
                        jobs.map((job, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="modern-card"
                                style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #f1f5f9", display: "flex", gap: "16px", alignItems: "flex-start" }}
                            >
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "12px",
                                    background: `linear-gradient(135deg, ${getRandomColor(job.company || "?")} 0%, #ffffff 150%)`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.2rem", fontWeight: 700, color: "#475569", flexShrink: 0
                                }}>
                                    {job.logo ? <img src={job.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "12px" }} onError={(e) => e.target.style.display = "none"} /> : (job.company || "J").charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)", marginBottom: "4px" }}>{job.title}</h3>
                                    <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaBuilding size={10} /> {job.company}</span>
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaMapMarkerAlt size={10} /> {job.location}</span>
                                        {job.type && <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>{job.type}</span>}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FaClock size={10} /> {job.posted || "Recently"}
                                        {job.salary && <span style={{ color: "#059669", fontWeight: 600 }}> • {job.salary}</span>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <button
                                        onClick={() => window.open(job.applyLink, '_blank')}
                                        className="modern-btn"
                                        style={{ height: "40px", padding: "0 20px", fontSize: "0.9rem", alignSelf: "center", background: "#f8fafc", color: "var(--primary)", border: "1px solid #e2e8f0", width: "100%" }}
                                    >
                                        Apply <FaExternalLinkAlt size={10} style={{ marginLeft: "6px" }} />
                                    </button>
                                    <button
                                        onClick={() => handleTrack(job)}
                                        className="modern-btn"
                                        style={{ height: "40px", padding: "0 20px", fontSize: "0.9rem", alignSelf: "center", background: "white", color: "var(--primary)", border: "1px solid #e2e8f0", width: "100%" }}
                                        title="Save to Tracker"
                                    >
                                        + Track
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ textAlign: "center", padding: "4rem", color: "var(--secondary)" }}>No jobs found. Try a different search.</div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default JobsPage;
