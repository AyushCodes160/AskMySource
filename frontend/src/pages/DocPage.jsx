// ============================================================
// FILE: frontend/src/pages/DocPage.jsx
// PURPOSE: Document Analysis Interface (PDF/Docx/Txt RAG)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocs, askDocQuestion, getStatus } from "../api";
import ReactMarkdown from "react-markdown";
import "./ChatPage.css"; // Reuse existing dark theme chat styles

export default function DocPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

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

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadMessage("");
    setErrorItem(null);
    setChatHistory([]);
    try {
      const res = await uploadDocs(selectedFiles);
      setUploadMessage(res.message);
      await fetchStatus();
    } catch (e) {
      setErrorItem(`Failed to upload: ${e.message}`);
    } finally {
      setUploading(false);
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
      const res = await askDocQuestion(currentQ, historyForAPI);
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
          <span className="chat-nav-title">Document Analyser</span>
        </div>
        <div className={`chat-nav-status ${status?.doc_index_loaded ? "indexed" : ""}`}>
          <div className="chat-status-dot" />
          <span>
            {status?.doc_index_loaded
              ? `Docs Indexed (${status.doc_chunk_count} chunks)`
              : "No documents loaded"}
          </span>
        </div>
      </div>

      {/* Upload Input Panel */}
      <div className="repo-panel">
        <div 
          className={`repo-panel-inner drag-drop-zone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="repo-panel-label" style={{ justifyContent: "center" }}>
            <span className="repo-panel-label-num">1</span>
            Upload & Index Documents (PDF, DOCX, TXT)
          </div>
          
          <div className="drag-drop-text">
            Drag and drop files here, or click to select
          </div>

          <div className="repo-input-row" style={{ alignItems: "center", justifyContent: "center" }}>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.rtf"
              onChange={handleFileChange}
              id="file-upload"
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload" className="file-upload-label">
              Choose Files
            </label>
            <span className="selected-files-count">
              {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : ""}
            </span>
            <button
              className="repo-load-btn"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? "Uploading..." : "Upload & Index"}
            </button>
          </div>

          {uploadMessage && (
            <p className="repo-message success">{uploadMessage}</p>
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
              <div className="chat-empty-icon">⊞</div>
              <div className="chat-empty-text">
                {status?.doc_index_loaded
                  ? "Documents loaded — start chatting below"
                  : "Upload documents to begin analysis"}
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
              status?.doc_index_loaded
                ? "Ask a question about the documents... (Enter to send)"
                : "Upload documents first..."
            }
            disabled={!status?.doc_index_loaded || asking}
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleAsk}
            disabled={asking || !status?.doc_index_loaded || !question.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
