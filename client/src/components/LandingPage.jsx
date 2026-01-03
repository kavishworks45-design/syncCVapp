import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaRocket, FaMagic, FaCheckCircle, FaArrowRight, FaFileAlt, FaRobot, FaGoogle, FaBriefcase, FaSearch, FaApple, FaAmazon, FaMicrosoft, FaLightbulb, FaPen, FaTrophy, FaChartLine } from "react-icons/fa";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";

const FloatingIcon = ({ icon: Icon, color, top, left, delay, size }) => (
    <motion.div
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [0, -20, 0], opacity: 1 }}
        transition={{
            y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: delay },
            opacity: { duration: 1, delay: delay } // Animate opacity once
        }}
        style={{
            position: "absolute",
            top: top,
            left: left,
            zIndex: 0,
            filter: "blur(0.5px)", // Reduced blur for cleaner look
            transform: "rotate(-10deg)"
        }}
    >
        <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: size || "80px",
            height: size || "80px"
        }}>
            <Icon size={size ? parseInt(size) / 2 : 40} color={color} />
        </div>
    </motion.div>
);

const ParallaxCard = ({ children, offset = 0 }) => {
    // const { scrollYProgress } = useScroll();
    // const y = useTransform(scrollYProgress, [0, 1], [0, offset]);

    return (
        <motion.div>
            {children}
        </motion.div>
    );
};

function LandingPage({ onStart, isLoggedIn, onLogin }) {
    // ... existing state and handlers ...
    const [loading, setLoading] = useState(false);

    // ... existing variants ...
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { loop: Infinity, staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const handleAction = () => {
        onStart();
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>

            {/* FLOATING BACKGROUND ELEMENTS */}
            {/* ... existing floating icons ... */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
                <FloatingIcon icon={FaFileAlt} color="#3b82f6" top="15%" left="5%" delay={0} />
                <FloatingIcon icon={FaBriefcase} color="#f59e0b" top="20%" left="85%" delay={2} />
                <FloatingIcon icon={FaSearch} color="#10b981" top="55%" left="8%" delay={1} size="60px" />
                <FloatingIcon icon={FaMagic} color="#8b5cf6" top="50%" left="88%" delay={3} size="70px" />

                {/* NEW FLOATING ICONS */}
                <FloatingIcon icon={FaLightbulb} color="#eab308" top="10%" left="92%" delay={1.5} size="50px" />
                <FloatingIcon icon={FaPen} color="#ec4899" top="35%" left="94%" delay={2.5} size="45px" />
                <FloatingIcon icon={FaTrophy} color="#f59e0b" top="70%" left="4%" delay={0.5} size="65px" />
                <FloatingIcon icon={FaChartLine} color="#06b6d4" top="75%" left="82%" delay={3.5} size="55px" />
            </div>

            {/* Hero Section */}
            {/* ... hero section remains the same ... */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                style={{ textAlign: "center", marginBottom: "4rem", maxWidth: "800px", zIndex: 2, position: "relative" }}
            >
                <motion.div variants={itemVariants} style={{ display: "inline-flex", alignItems: "center", marginBottom: "1.5rem", padding: "8px 16px", background: "white", borderRadius: "99px", border: "1px solid #e2e8f0", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaRocket color="#3b82f6" /> v2.0 Now Live
                    </span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="hero-title" style={{ fontSize: "clamp(3rem, 6vw, 5rem)", marginBottom: "1.5rem", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                    Stop Sending <br />
                    <span style={{ position: "relative", display: "inline-block" }}>
                        <span style={{ color: "var(--secondary)" }}>Generic Resumes.</span>
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 1.2, duration: 0.6, ease: "circOut" }}
                            style={{
                                position: "absolute",
                                top: "55%",
                                left: "-2%",
                                width: "104%", // Slightly wider than text
                                height: "0.15em", // Responsive thickness
                                background: "#ff3b30", // Apple Red
                                opacity: 0.9,
                                borderRadius: "99px",
                                transform: "rotate(-2deg)", // Slight tilt
                                transformOrigin: "left center"
                            }}
                        />
                    </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="hero-subtitle" style={{ fontSize: "1.25rem", maxWidth: "600px", margin: "0 auto 3rem auto", color: "var(--secondary)", lineHeight: 1.6 }}>
                    SyncCV analyzes the job description and rewrites your resume to match it perfectly.
                    Beat the ATS and get hired faster.
                </motion.p>

                <motion.button
                    variants={itemVariants}
                    className="modern-btn"
                    onClick={handleAction}
                    disabled={loading}
                    style={{ height: "64px", fontSize: "1.1rem", padding: "0 48px", minWidth: "260px", background: "var(--primary)", color: "white" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {loading ? (
                        "Connecting to Google..."
                    ) : (
                        <>Start Optimization <FaArrowRight /></>
                    )}
                </motion.button>

                {/* TRUSTED BY SECTION */}
                <motion.div variants={itemVariants} style={{ marginTop: "4rem", opacity: 0.7 }}>
                    <p style={{ fontSize: "0.9rem", color: "var(--secondary)", marginBottom: "1.5rem", fontWeight: 500 }}>Used by candidates hired at</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "2rem", alignItems: "center", flexWrap: "wrap", color: "#a1a1aa" }}>
                        <FaGoogle size={22} />
                        <FaApple size={26} style={{ paddingBottom: "4px" }} />
                        <FaMicrosoft size={22} />
                        <FaAmazon size={26} style={{ paddingTop: "4px" }} />
                    </div>
                </motion.div>
            </motion.div>


            {/* Feature Grid with PARALLAX */}
            <motion.div
                initial={{ opacity: 1, y: 0 }} // DEBUG: Force visible
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "32px",
                    width: "100%",
                    textAlign: "left",
                    zIndex: 2,
                    position: "relative"
                }}
            >
                {/* Feature 1 - Slight upward pull */}
                <ParallaxCard offset={-50}>
                    <div className="modern-card" style={{ padding: "40px", height: "100%" }}>
                        <div style={{ width: "56px", height: "56px", background: "#eff6ff", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                            <FaFileAlt size={28} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px", color: "var(--primary)" }}>Upload Resume</h3>
                        <p style={{ color: "var(--secondary)", lineHeight: 1.7, fontSize: "1rem" }}>
                            Upload your existing PDF. We preserve your contact details and history while preparing it for AI analysis.
                        </p>
                    </div>
                </ParallaxCard>

                {/* Feature 2 - Deeper parallax (moves more) */}
                <ParallaxCard offset={-100}>
                    <div className="modern-card" style={{ padding: "40px", height: "100%" }}>
                        <div style={{ width: "56px", height: "56px", background: "#f5f3ff", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                            <FaRobot size={28} color="#8b5cf6" />
                        </div>
                        <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px", color: "var(--primary)" }}>AI Analysis</h3>
                        <p style={{ color: "var(--secondary)", lineHeight: 1.7, fontSize: "1rem" }}>
                            Our Gemini-powered engine extracts keywords from the Job Description and suggests targeted improvements.
                        </p>
                    </div>
                </ParallaxCard>

                {/* Feature 3 - Slight upward pull */}
                <ParallaxCard offset={-50}>
                    <div className="modern-card" style={{ padding: "40px", height: "100%" }}>
                        <div style={{ width: "56px", height: "56px", background: "#ecfdf5", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                            <FaMagic size={28} color="#10b981" />
                        </div>
                        <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px", color: "var(--primary)" }}>Instant Adaptation</h3>
                        <p style={{ color: "var(--secondary)", lineHeight: 1.7, fontSize: "1rem" }}>
                            Watch as your Experience and Skills are rewritten in real-time to align with what recruiters want.
                        </p>
                    </div>
                </ParallaxCard>
            </motion.div>

            {/* --- HOW IT WORKS SECTION --- */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                style={{ marginTop: "12rem", textAlign: "center", width: "100%", maxWidth: "900px" }}
            >
                <h2 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "4rem", color: "var(--primary)" }}>How it works.</h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px", textAlign: "left" }}>
                    {[
                        { step: "01", title: "Upload PDF", desc: "Drag and drop your current resume. We parse it instantly." },
                        { step: "02", title: "Paste Job URL", desc: "Tell us the role you're applying for. We extract keywords." },
                        { step: "03", title: "Get Hired", desc: "Download your perfectly tailored, ATS-friendly resume." }
                    ].map((item, i) => (
                        <div key={i} style={{ position: "relative" }}>
                            <span style={{ fontSize: "5rem", fontWeight: 800, color: "#cbd5e1", opacity: 0.5, position: "absolute", top: "-40px", left: "-10px", zIndex: 0 }}>{item.step}</span>
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "10px", color: "var(--primary)" }}>{item.title}</h3>
                                <p style={{ color: "var(--secondary)", fontSize: "1.1rem", lineHeight: 1.5 }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div >

            {/* --- PRICING SECTION --- */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{ marginTop: "12rem", width: "100%", textAlign: "center" }}
            >
                <h2 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "1rem", color: "var(--primary)" }}>Simple, transparent pricing.</h2>
                <p style={{ fontSize: "1.2rem", color: "var(--secondary)", marginBottom: "4rem" }}>Choose the plan that fits your career goals.</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", maxWidth: "1100px", margin: "0 auto" }}>

                    {/* FREE PLAN */}
                    <div className="modern-card" style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "4px 12px", borderRadius: "99px", marginBottom: "20px" }}>Starter</span>
                        <h3 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: "8px" }}>₹0</h3>
                        <p style={{ color: "var(--secondary)", marginBottom: "30px", fontSize: "0.95rem" }}>Perfect for trying out the platform.</p>
                        <ul style={{ listStyle: "none", padding: 0, marginBottom: "40px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                            {["1 Resume Optimization", "Basic Job Search", "PDF Export", "Manual Customization"].map((feat, i) => (
                                <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", fontSize: "0.95rem" }}>
                                    <FaCheckCircle color="#cbd5e1" /> {feat}
                                </li>
                            ))}
                        </ul>
                        <button className="modern-btn" onClick={handleAction} style={{ width: "100%", background: "white", border: "1px solid #e2e8f0", color: "var(--primary)" }}>Get Started</button>
                    </div>

                    {/* PRO PLAN */}
                    <div className="modern-card" style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", border: "2px solid #3b82f6", position: "relative", overflow: "visible" }}>
                        <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#3b82f6", color: "white", padding: "4px 16px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 600 }}>MOST POPULAR</div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3b82f6", background: "#eff6ff", padding: "4px 12px", borderRadius: "99px", marginBottom: "20px" }}>Pro</span>
                        <h3 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: "8px" }}>₹200<span style={{ fontSize: "1rem", color: "#94a3b8", fontWeight: 500 }}>/mo</span></h3>
                        <p style={{ color: "var(--secondary)", marginBottom: "30px", fontSize: "0.95rem" }}>For serious job seekers.</p>
                        <ul style={{ listStyle: "none", padding: 0, marginBottom: "40px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                            {["Unlimited Optimizations", "Smart AI Tailoring", "Advanced Job Search", "Cover Letter Generator", "Priority Email Support"].map((feat, i) => (
                                <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", fontSize: "0.95rem" }}>
                                    <FaCheckCircle color="#3b82f6" /> {feat}
                                </li>
                            ))}
                        </ul>
                        <button className="modern-btn" onClick={handleAction} style={{ width: "100%", background: "#3b82f6", color: "white" }}>Upgrade to Pro</button>
                    </div>

                    {/* POWER PLAN */}
                    <div className="modern-card" style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#a855f7", background: "#f3e8ff", padding: "4px 12px", borderRadius: "99px", marginBottom: "20px" }}>Power</span>
                        <h3 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: "8px" }}>₹500<span style={{ fontSize: "1rem", color: "#94a3b8", fontWeight: 500 }}>/mo</span></h3>
                        <p style={{ color: "var(--secondary)", marginBottom: "30px", fontSize: "0.95rem" }}>For ultimate career growth.</p>
                        <ul style={{ listStyle: "none", padding: 0, marginBottom: "40px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                            {["Everything in Pro", "LinkedIn Profile Audit", "1-on-1 Career Coaching", "Salary Negotiation Tips", "24/7 Dedicated Support"].map((feat, i) => (
                                <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", fontSize: "0.95rem" }}>
                                    <FaCheckCircle color="#a855f7" /> {feat}
                                </li>
                            ))}
                        </ul>
                        <button className="modern-btn" onClick={handleAction} style={{ width: "100%", background: "white", border: "1px solid #e2e8f0", color: "var(--primary)" }}>Contact Sales</button>
                    </div>

                </div>
            </motion.div>

            {/* --- CALL TO ACTION --- */}
            < motion.div
                initial={{ opacity: 0, scale: 0.95 }
                }
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                style={{
                    marginTop: "12rem",
                    width: "100%",
                    borderRadius: "40px",
                    background: "#1d1d1f",
                    padding: "6rem 2rem",
                    textAlign: "center",
                    color: "white",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* Abstract background blur in CTA */}
                < div style={{ position: "absolute", top: "-50%", left: "0", width: "100%", height: "200%", background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)", zIndex: 0 }}></div >

                <div style={{ position: "relative", zIndex: 1 }}>
                    <h2 style={{ fontSize: "3.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Ready to stand out?</h2>
                    <p style={{ fontSize: "1.25rem", color: "#94a3b8", marginBottom: "3rem", maxWidth: "600px", margin: "0 auto 3rem auto" }}>
                        Join thousands of job seekers who are getting more interviews with SyncCV.
                    </p>
                    <button
                        className="modern-btn"
                        onClick={handleAction}
                        style={{ background: "white", color: "black", height: "64px", fontSize: "1.2rem", padding: "0 60px" }}
                    >
                        Build My Resume Free
                    </button>
                    <p style={{ marginTop: "20px", fontSize: "0.9rem", color: "#64748b" }}>No credit card required.</p>
                </div>
            </motion.div >

            {/* --- FOOTER --- */}
            < footer style={{ marginTop: "8rem", borderTop: "1px solid #e2e8f0", paddingTop: "4rem", width: "100%", textAlign: "center", color: "var(--secondary)", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                    <FaRocket color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>SyncCV</span>
                </div>
                <p>&copy; {new Date().getFullYear()} SyncCV. Crafted for job seekers.</p>
                <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Contact</span>
                </div>
            </footer >

        </div >
    );
}

export default LandingPage;
