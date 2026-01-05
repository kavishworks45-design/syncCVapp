import { useNavigate, useLocation } from 'react-router-dom';
import { FaRocket, FaHome, FaChartPie, FaCog, FaSignOutAlt, FaUserCircle, FaQuestionCircle, FaSearch } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import { motion } from 'framer-motion';

export default function Sidebar({ user, active }) {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = getAuth();

    // Determine active state: explicitly passed prop OR derived from URL
    const currentActive = active || (location.pathname.includes('tracker') ? 'tracker' : location.pathname.includes('jobs') ? 'jobs' : 'overview');

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const isActive = (key) => currentActive === key;

    // Zenith Button Style
    const getButtonStyle = (key) => {
        const activeState = isActive(key);
        return {
            width: "100%",
            padding: "16px 20px",
            borderRadius: "16px",
            background: activeState ? "#0f172a" : "transparent", // Dark Navy active, Transparent inactive
            color: activeState ? "white" : "#64748b",
            border: "none",
            fontWeight: activeState ? 700 : 600,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "0.95rem",
            position: "relative",
            transition: "all 0.2s ease"
        };
    };

    return (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="zenith-sidebar"
            style={{
                width: "280px",
                background: "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)", // Safari support
                borderRight: "1px solid rgba(255, 255, 255, 0.4)",
                display: "flex",
                flexDirection: "column",
                padding: "32px 24px",
                position: "sticky",
                top: 0,
                height: "100vh",
                zIndex: 50
            }}
        >
            {/* LOGO */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "56px", paddingLeft: "8px" }}>
                <div style={{
                    width: "42px", height: "42px",
                    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                    borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white",
                    boxShadow: "0 10px 20px -5px rgba(15, 23, 42, 0.3)"
                }}>
                    <FaRocket size={20} />
                </div>
                <div>
                    <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>SyncCV</span>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", marginTop: "2px" }}>Zenith</div>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>

                <Label text="Menu" />

                <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/dashboard')}
                    style={getButtonStyle('overview')}
                >
                    <FaHome size={18} opacity={isActive('overview') ? 1 : 0.7} />
                    <span>Overview</span>
                    {isActive('overview') && <ActiveDot />}
                </motion.button>

                <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/tracker')}
                    style={getButtonStyle('tracker')}
                >
                    <FaChartPie size={18} opacity={isActive('tracker') ? 1 : 0.7} />
                    <span>Job Tracker</span>
                    {isActive('tracker') && <ActiveDot />}
                </motion.button>

                <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/jobs')}
                    style={getButtonStyle('jobs')}
                >
                    <FaSearch size={18} opacity={isActive('jobs') ? 1 : 0.7} />
                    <span>Find Jobs</span>
                    {isActive('jobs') && <ActiveDot />}
                </motion.button>

                <div style={{ height: "24px" }}></div>
                <Label text="Preferences" />

                <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => navigate('/settings')}
                    style={getButtonStyle('settings')}
                >
                    <FaCog size={18} opacity={isActive('settings') ? 1 : 0.7} />
                    <span>Settings</span>
                </motion.button>

                <motion.button
                    whileHover={{ x: 4 }}
                    style={getButtonStyle('help')}
                >
                    <FaQuestionCircle size={18} opacity={isActive('help') ? 1 : 0.7} />
                    <span>Help Center</span>
                </motion.button>
            </nav>

            {/* USER PROFILE */}
            <div style={{ marginTop: "auto" }}>
                <div style={{
                    padding: "16px",
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#cbd5e1", overflow: "hidden", border: "2px solid white" }}>
                        {user?.photoURL ? <img src={user.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FaUserCircle size={40} color="#94a3b8" />}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.displayName?.split(' ')[0] || "User"}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Pro Account</div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    style={{
                        width: "100%", padding: "14px", borderRadius: "16px",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        background: "rgba(254, 242, 242, 0.5)",
                        color: "#ef4444", fontSize: "0.9rem", fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
                    }}
                >
                    <FaSignOutAlt /> Sign Out
                </motion.button>
            </div>
        </motion.div>
    );
}

// Sub-components for cleaner code
const Label = ({ text }) => (
    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginLeft: "12px", marginBottom: "8px" }}>
        {text}
    </div>
);

const ActiveDot = () => (
    <div style={{ width: "6px", height: "6px", background: "#38bdf8", borderRadius: "50%", marginLeft: "auto", boxShadow: "0 0 8px #38bdf8" }}></div>
);
