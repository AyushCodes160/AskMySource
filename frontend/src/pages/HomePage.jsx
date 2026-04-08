// ============================================================
// FILE: frontend/src/pages/HomePage.jsx
// PURPOSE: Futuristic brutalist-minimalist landing page
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import robotImg from "../assets/robot-hero.png";
import "./HomePage.css";

// --- Particle Component ---
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 6}s`,
    size: `${1 + Math.random() * 2}px`,
  }));

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

// --- Grid Lines Background ---
function GridLines() {
  return (
    <div className="grid-lines">
      {/* Horizontal lines */}
      <div className="grid-line-h" style={{ top: "25%", animationDelay: "0.2s" }} />
      <div className="grid-line-h" style={{ top: "50%", animationDelay: "0.4s" }} />
      <div className="grid-line-h" style={{ top: "75%", animationDelay: "0.6s" }} />
      {/* Vertical lines */}
      <div className="grid-line-v" style={{ left: "25%", animationDelay: "0.3s" }} />
      <div className="grid-line-v" style={{ left: "50%", animationDelay: "0.5s" }} />
      <div className="grid-line-v" style={{ left: "75%", animationDelay: "0.7s" }} />
    </div>
  );
}

// --- Typing Effect Hook ---
function useTypingEffect(text, speed = 40, delay = 1000) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeout;
    let idx = 0;

    const startTyping = () => {
      const type = () => {
        if (idx < text.length) {
          setDisplayed(text.slice(0, idx + 1));
          idx++;
          timeout = setTimeout(type, speed);
        } else {
          setDone(true);
        }
      };
      type();
    };

    timeout = setTimeout(startTyping, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardsRef = useRef(null);

  const { displayed: quote, done: quoteDone } = useTypingEffect(
    '"Understanding code is not about reading — it\'s about asking the right questions."',
    30,
    1500
  );

  // Track mouse for card glow effect
  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    // Update card glow positions
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".action-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const handleGithubAnalyse = () => {
    navigate("/chat");
  };

  return (
    <div className="home-page">
      {/* Background Effects */}
      <div className="grain-overlay" />
      <GridLines />
      <Particles />
      <div className="scanline" />

      {/* Navigation */}
      <nav className="nav animate-fade-in">
        <div className="nav-logo">
          <div className="nav-logo-icon">CR</div>
          <span>CodeRAG</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link">Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#" className="nav-link">About</a>
          <a href="#" className="nav-link">Docs</a>
        </div>
        <div className="nav-status">
          <div className="nav-status-dot" />
          <span>System Online</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        {/* Left Column */}
        <div className="hero-left">
          <div className="hero-badge animate-fade-in-up delay-2">
            <span className="hero-badge-dot" />
            AI-Powered Code Analysis
          </div>

          <h1 className="hero-title animate-fade-in-up delay-3">
            <span className="hero-title-line">Understand</span>
            <span className="hero-title-line">Any <span className="hero-title-accent">Codebase</span></span>
            <span className="hero-title-line">Instantly.</span>
          </h1>

          <p className="hero-subtitle animate-fade-in-up delay-4">
            Ask questions about GitHub repositories, PDFs, documentation — and get precise,
            context-aware answers powered by RAG and fine-tuned AI models.
          </p>

          <div className="hero-quote animate-fade-in-up delay-5">
            <span>{quote}</span>
            {!quoteDone && <span style={{
              borderRight: '2px solid var(--accent)',
              marginLeft: '2px',
              animation: 'blink 1s step-end infinite'
            }}>&nbsp;</span>}
          </div>

          <div className="hero-stats animate-fade-in-up delay-7">
            <div className="hero-stat">
              <span className="hero-stat-number">∞</span>
              <span className="hero-stat-label">Repos Supported</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">&lt;3s</span>
              <span className="hero-stat-label">Avg Response</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">RAG</span>
              <span className="hero-stat-label">Powered Engine</span>
            </div>
          </div>
        </div>

        {/* Right Column — Robot */}
        <div className="hero-right">
          <div className="robot-container animate-fade-in delay-4">
            <div className="robot-glow" />
            <div className="robot-glow" />
            <div className="robot-glow" />
            <img
              src={robotImg}
              alt="AI Code Analysis Robot"
              className="robot-image"
              draggable={false}
            />
          </div>
          <div className="hero-big-number animate-fade-in delay-8">AI</div>
          <div className="hero-side-label animate-fade-in delay-10">
            Next Generation Code Intelligence — @2026
          </div>
        </div>
      </section>

      {/* Action Cards Section */}
      <section className="actions-section" id="features" ref={cardsRef}>
        <div className="actions-header">
          <div className="actions-label animate-fade-in-up delay-2">Choose Your Source</div>
          <h2 className="actions-title animate-fade-in-up delay-3">
            What would you like to analyse?
          </h2>
          <p className="actions-desc animate-fade-in-up delay-4">
            Select a source type below to begin your AI-powered code analysis session.
          </p>
        </div>

        <div className="actions-grid">
          {/* Card 1 — GitHub (Active) */}
          <div
            className="action-card animate-fade-in-up delay-5"
            onClick={handleGithubAnalyse}
            role="button"
            tabIndex={0}
            id="analyse-github"
          >
            <div className="action-card-icon">⟐</div>
            <h3 className="action-card-title">Analyse GitHub Repo</h3>
            <p className="action-card-desc">
              Clone any public GitHub repository and ask intelligent questions about its codebase using AI.
            </p>
            <div className="action-card-cta">
              <span>Get Started</span>
              <span className="action-card-cta-arrow">→</span>
            </div>
          </div>

          {/* Card 2 — PDF/Doc (Active) */}
          <div
            className="action-card animate-fade-in-up delay-6"
            onClick={() => navigate("/doc")}
            role="button"
            tabIndex={0}
            id="analyse-pdf"
          >
            <div className="action-card-icon">⊞</div>
            <h3 className="action-card-title">Analyse PDF / Doc</h3>
            <p className="action-card-desc">
              Upload research papers, documentation, or any text files and extract insights instantly.
            </p>
            <div className="action-card-cta">
              <span>Get Started</span>
              <span className="action-card-cta-arrow">→</span>
            </div>
          </div>

          {/* Card 3 — Link (Active) */}
          <div
            className="action-card animate-fade-in-up delay-7"
            onClick={() => navigate("/link")}
            role="button"
            tabIndex={0}
            id="analyse-link"
          >
            <div className="action-card-icon">⊕</div>
            <h3 className="action-card-title">Analyse Link</h3>
            <p className="action-card-desc">
              Paste any documentation URL, wiki page, or article link and query the content with AI.
            </p>
            <div className="action-card-cta">
              <span>Get Started</span>
              <span className="action-card-cta-arrow">→</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">© 2026 CodeRAG — AI Code Analysis</div>
        <div className="footer-right">
          <a href="#" className="footer-link">GitHub</a>
          <a href="#" className="footer-link">Documentation</a>
          <a href="#" className="footer-link">About</a>
        </div>
      </footer>
    </div>
  );
}
