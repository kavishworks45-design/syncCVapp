import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaSearch, FaMapMarkerAlt, FaBuilding, FaClock, FaBriefcase, FaExternalLinkAlt, FaGlobeAmericas } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';

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
        <div style={{ display: "flex", width: "100%", minHeight: "100vh", background: "#f8fafc", boxSizing: "border-box" }}>
            <Sidebar user={user} active="jobs" />
            <div style={{ flex: 1, padding: "40px", maxWidth: "1600px" }}>

                {/* --- HEADER --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 8px 0", color: "#0f172a" }}>Discover Roles</h1>
                        <p style={{ fontSize: "1.1rem", color: "#64748b", margin: 0 }}>Curated opportunities matching your profile.</p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {/* Could add lightweight filters here later */}
                    </div>
                </div>



                {/* --- FEED --- */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
                    <AnimatePresence>
                        {error && (
                            <div style={{ padding: "16px", background: "#fee2e2", color: "#b91c1c", borderRadius: "12px", border: "1px solid #fecaca", textAlign: "center" }}>
                                {error}
                            </div>
                        )}
                        {isLoading ? (
                            <div style={{ gridColumn: "1 / -1", height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--secondary)" }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-block", marginBottom: "16px" }}>
                                    <FaGlobeAmericas size={32} color="#3b82f6" />
                                </motion.div>
                                <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "#475569" }}>Curating the best opportunities for you...</p>
                                <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Gathering listings from top companies</p>
                            </div>
                        ) : jobs.length > 0 ? (
                            jobs.map((job, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="modern-card"
                                    style={{ background: "white", padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "16px", transition: "transform 0.2s" }}
                                    whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)" }}
                                >
                                    <div style={{
                                        width: "48px", height: "48px", borderRadius: "12px",
                                        background: `linear-gradient(135deg, ${getRandomColor(job.company || "?")} 0%, #ffffff 150%)`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.2rem", fontWeight: 700, color: "#475569", flexShrink: 0
                                    }}>
                                        {job.logo ? <img src={job.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "12px" }} onError={(e) => e.target.style.display = "none"} /> : (job.company || "J").charAt(0).toUpperCase()}
                                    </div>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)", marginBottom: "4px" }}>{job.title}</h3>
                                    <div style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaBuilding size={10} /> {job.company}</span>
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                                        <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>{job.type || "Full-time"}</span>
                                        <span style={{ background: "#f0f9ff", padding: "4px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, color: "#0284c7" }}>{job.location}</span>
                                    </div>

                                    <div style={{ fontSize: "0.85rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                        <FaClock size={10} /> {job.posted || "Recently"}
                                    </div>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
                                        <button
                                            onClick={() => handleTrack(job)}
                                            className="modern-btn"
                                            style={{ flex: 1, height: "40px", fontSize: "0.9rem", background: "white", color: "var(--primary)", border: "1px solid #e2e8f0" }}
                                            title="Save to Tracker"
                                        >
                                            + Track
                                        </button>
                                        <button
                                            onClick={() => window.open(job.applyLink, '_blank')}
                                            className="modern-btn"
                                            style={{ flex: 1, height: "40px", fontSize: "0.9rem", background: "#0f172a", color: "white", border: "none" }}
                                        >
                                            Apply <FaExternalLinkAlt size={10} style={{ marginLeft: "6px" }} />
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
        </div >
    );
}

export default JobsPage;
