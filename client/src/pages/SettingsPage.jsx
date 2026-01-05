import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { FaUser, FaBell, FaSave } from 'react-icons/fa';

import { updateProfile } from 'firebase/auth';

function SettingsPage({ user }) {
    const [notifications, setNotifications] = useState(true);
    const [fullName, setFullName] = useState(user?.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update Auth Profile
            if (user && fullName !== user.displayName) {
                await updateProfile(user, { displayName: fullName });
            }

            // Artificial delay to show process
            await new Promise(r => setTimeout(r, 800));

            // Show Toast
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            // In a real app we might show an error toast here
        } finally {
            setIsSaving(false);
        }
    };

    const SECTION_STYLE = {
        background: "white",
        borderRadius: "20px",
        padding: "30px",
        marginBottom: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        border: "1px solid #f1f5f9"
    };

    const INPUT_STYLE = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        fontSize: "0.95rem",
        color: "#1e293b",
        marginTop: "8px",
        outline: "none"
    };

    const LABEL_STYLE = {
        fontSize: "0.85rem",
        fontWeight: 700,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    };

    return (
        <div style={{ display: "flex", width: "100%", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            <Sidebar user={user} active="settings" />

            <div style={{ flex: 1, padding: "32px 48px", overflowY: "auto", height: "100vh", position: "relative" }}>
                <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>

                    <div style={{ marginBottom: "40px" }}>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>Settings</h1>
                        <p style={{ fontSize: "1.1rem", color: "#64748b" }}>Manage your account and preferences.</p>
                    </div>

                    {/* ACCOUNT SECTION */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={SECTION_STYLE}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                            <div style={{ padding: "10px", background: "#eff6ff", borderRadius: "10px", color: "#3b82f6" }}><FaUser /></div>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Account Information</h2>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                                <label style={LABEL_STYLE}>Full Name</label>
                                <input style={INPUT_STYLE} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </div>
                            <div>
                                <label style={LABEL_STYLE}>Email Address</label>
                                <input style={INPUT_STYLE} type="email" defaultValue={user?.email} disabled />
                            </div>
                        </div>
                    </motion.div>

                    {/* NOTIFICATIONS */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={SECTION_STYLE}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                            <div style={{ padding: "10px", background: "#fef3c7", borderRadius: "10px", color: "#d97706" }}><FaBell /></div>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Notifications</h2>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <div style={{ fontWeight: 600, color: "#334155" }}>Email Alerts</div>
                                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Get updates on job application status</div>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                style={{
                                    width: "48px", height: "28px", borderRadius: "100px",
                                    background: notifications ? "#3b82f6" : "#cbd5e1",
                                    position: "relative", border: "none", cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                <div style={{ width: "20px", height: "20px", background: "white", borderRadius: "50%", position: "absolute", top: "4px", left: notifications ? "24px" : "4px", transition: "all 0.2s" }}></div>
                            </button>
                        </div>
                    </motion.div>

                    <div style={{ textAlign: "right" }}>
                        <button
                            className="modern-btn"
                            style={{ padding: "12px 32px", opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'wait' : 'pointer' }}
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <FaSave style={{ marginRight: "8px" }} /> {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>

                {/* TOAST NOTIFICATION */}
                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: "-50%" }}
                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0, y: 20, x: "-50%" }}
                            style={{
                                position: "fixed",
                                bottom: "40px",
                                left: "57%", // Offset slightly to account for sidebar
                                transform: "translateX(-50%)",
                                background: "white",
                                color: "#166534",
                                padding: "12px 24px",
                                borderRadius: "100px",
                                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                zIndex: 9999,
                                border: "1px solid #dcfce7"
                            }}
                        >
                            <div style={{ width: "24px", height: "24px", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Settings saved successfully</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SettingsPage;
