// ============================================================
// FILE: frontend/src/pages/LinkPage.jsx
// PURPOSE: Link Analysis Interface (Web Scraping RAG)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadLinks, askLinkQuestion, getStatus } from "../api";
import ReactMarkdown from "react-markdown";
import "./ChatPage.css"; // Reuse existing dark theme chat styles

export default function LinkPage() {
  const navigate = useNavigate();
  const [urlsInput, setUrlsInput] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState("");

  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [errorItem, setErrorItem] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, asking]);

  const fetchStatus = async () => {
    try {
      const data = await getStatus();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadLinks = async () => {
    if (!urlsInput.trim()) return;
    
    // Split by comma or newline and clean
    const urls = urlsInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u && (u.startsWith("http://") || u.startsWith("https://")));

    if (urls.length === 0) {
      setErrorItem("Please enter valid URL(s) starting with http:// or https://");
      return;
    }

    setLoading(true);
    setLoadMessage("");
    setErrorItem(null);
    setChatHistory([]);
    try {
      const res = await loadLinks(urls);
      setLoadMessage(res.message);
      await fetchStatus();
    } catch (e) {
      setErrorItem(`Failed to scrape links: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const currentQ = question;
    const historyForAPI = chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    setChatHistory((prev) => [...prev, { role: "user", content: currentQ }]);
    setQuestion("");
    setAsking(true);
    setErrorItem(null);

    try {
      const res = await askLinkQuestion(currentQ, historyForAPI);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          sources: res.sources,
          latency_ms: res.latency_ms,
        },
      ]);
    } catch (e) {
      setErrorItem(`Failed to answer: ${e.message}`);
    } finally {
      setAsking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="chat-page">
      {/* Top Nav */}
      <div className="chat-nav">
        <div className="chat-nav-left">
          <button className="chat-back-btn" onClick={() => navigate("/")}>
            ← Back
          </button>
          <span className="chat-nav-title">Link Analyser</span>
        </div>
        <div className={`chat-nav-status ${status?.link_index_loaded ? "indexed" : ""}`}>
          <div className="chat-status-dot" />
          <span>
            {status?.link_index_loaded
              ? `Links Indexed (${status.link_chunk_count} chunks)`
              : "No links loaded"}
          </span>
        </div>
      </div>

      {/* Input Panel */}
      <div className="repo-panel">
        <div className="repo-panel-inner">
          <div className="repo-panel-label">
            <span className="repo-panel-label-num">1</span>
            Enter URLs to scrape (separated by commas)
          </div>
          <div className="repo-input-row">
            <input
              type="text"
              className="repo-input"
              placeholder="e.g. https://wikipedia.org/wiki/AI, https://docs.python.org"
              value={urlsInput}
              onChange={(e) => setUrlsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadLinks()}
            />
            <button
              className="repo-load-btn"
              onClick={handleLoadLinks}
              disabled={loading || !urlsInput.trim()}
            >
              {loading ? "Scraping..." : "Scrape & Index"}
            </button>
          </div>
          {loadMessage && (
            <p className="repo-message success">{loadMessage}</p>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorItem && <div className="error-banner">{errorItem}</div>}

      {/* Chat Messages */}
      <div className="chat-messages">
        <div className="chat-messages-inner">
          {chatHistory.length === 0 && !asking ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">⊕</div>
              <div className="chat-empty-text">
                {status?.link_index_loaded
                  ? "Links loaded — start chatting below"
                  : "Submit links to begin analysis"}
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-bubble">
                  {msg.role === "user" ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  ) : (
                    <div>
                      <div className="markdown">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.sources && (
                        <div className="message-meta">
                          <span className="message-latency">
                            ⏱️ {msg.latency_ms}ms
                          </span>
                          <details>
                            <summary className="message-sources-toggle">
                              View Sources ({msg.sources.length})
                            </summary>
                            <ul className="message-sources-list">
                              {msg.sources.map((s, sIdx) => (
                                <li key={sIdx}>{s.file_path}</li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {asking && (
            <div className="message assistant">
              <div className="thinking-bubble">
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="chat-input-area">
        <div className="chat-input-inner">
          <textarea
            className="chat-textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              status?.link_index_loaded
                ? "Ask a question about the web pages... (Enter to send)"
                : "Load links first..."
            }
            disabled={!status?.link_index_loaded || asking}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleAsk}
            disabled={asking || !status?.link_index_loaded || !question.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
