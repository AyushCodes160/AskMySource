// ============================================================
// FILE: frontend/src/pages/ChatPage.jsx
// PURPOSE: Dark-themed chat interface for the Code RAG system.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadRepo, askQuestion, getStatus } from "../api";
import ReactMarkdown from "react-markdown";
import "./ChatPage.css";

export default function ChatPage() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState(null);

  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoMessage, setRepoMessage] = useState("");

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

  const handleLoadRepo = async () => {
    if (!repoUrl) return;
    setLoadingRepo(true);
    setRepoMessage("");
    setErrorItem(null);
    setChatHistory([]);
    try {
      const res = await loadRepo(repoUrl);
      setRepoMessage(res.message);
      await fetchStatus();
    } catch (e) {
      setErrorItem(`Failed to load repo: ${e.message}`);
    } finally {
      setLoadingRepo(false);
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
      const res = await askQuestion(currentQ, historyForAPI);
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
          <span className="chat-nav-title">GitHub Repo Analyser</span>
        </div>
        <div className={`chat-nav-status ${status?.index_loaded ? "indexed" : ""}`}>
          <div className="chat-status-dot" />
          <span>
            {status?.index_loaded
              ? `Indexed: ${status.current_repo}`
              : "No repo loaded"}
          </span>
        </div>
      </div>

      {/* Repo Input Panel */}
      <div className="repo-panel">
        <div className="repo-panel-inner">
          <div className="repo-panel-label">
            <span className="repo-panel-label-num">1</span>
            Clone & Index Repository
          </div>
          <div className="repo-input-row">
            <input
              type="text"
              className="repo-input"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
            />
            <button
              className="repo-load-btn"
              onClick={handleLoadRepo}
              disabled={loadingRepo || !repoUrl}
            >
              {loadingRepo ? "Loading..." : "Load Repo"}
            </button>
          </div>
          {repoMessage && (
            <p className="repo-message success">{repoMessage}</p>
          )}
          {status?.index_loaded && (
            <p className="repo-message info">
              Indexed {status.chunk_count} chunks from{" "}
              <strong>{status.current_repo}</strong>
            </p>
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
              <div className="chat-empty-icon">⟐</div>
              <div className="chat-empty-text">
                {status?.index_loaded
                  ? "Repo loaded — start chatting below"
                  : "Load a repository to begin analysis"}
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${msg.role}`}
              >
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
              status?.index_loaded
                ? "Ask a question about the code... (Enter to send)"
                : "Load a repo first..."
            }
            disabled={!status?.index_loaded || asking}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleAsk}
            disabled={asking || !status?.index_loaded || !question.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
