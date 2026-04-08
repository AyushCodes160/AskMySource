// ============================================================
// FILE: frontend/src/api.js
// PURPOSE: Fetch wrappers for the FastAPI backend endpoints.
// ============================================================

const API_URL = "http://localhost:8000";

/**
 * Load a GitHub repository — clones it and builds the FAISS index.
 *
 * @param {string} repoUrl - Full GitHub URL (e.g., "https://github.com/user/repo")
 * @param {boolean} forceReclone - If true, delete existing clone and re-clone
 * @returns {Promise<object>} Response from /load_repo
 */
export async function loadRepo(repoUrl, forceReclone = false) {
  const res = await fetch(`${API_URL}/load_repo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo_url: repoUrl,
      force_reclone: forceReclone,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to load repository");
  }

  return res.json();
}

/**
 * Ask a question about the loaded codebase.
 *
 * @param {string} question - The user's question
 * @returns {Promise<object>} Response from /ask
 */
export async function askQuestion(question, history = []) {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to get answer");
  }

  return res.json();
}

/**
 * Get the backend status — index loaded, model loaded, chunk count.
 *
 * @returns {Promise<object>} Response from /status
 */
export async function getStatus() {
  const res = await fetch(`${API_URL}/status`);
  if (!res.ok) throw new Error("Backend not reachable");
  return res.json();
}

/**
 * Upload documents to be indexed.
 *
 * @param {File[]} files - Array of File objects
 * @returns {Promise<object>} Response from /upload_doc
 */
export async function uploadDocs(files) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  const res = await fetch(`${API_URL}/upload_doc`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to upload document(s)");
  }

  return res.json();
}

/**
 * Ask a question about the loaded documents.
 * 
 * @param {string} question - The user's question
 * @param {Array} history - Chat history
 * @returns {Promise<object>} Response from /ask_doc
 */
export async function askDocQuestion(question, history = []) {
  const res = await fetch(`${API_URL}/ask_doc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to get answer");
  }

  return res.json();
}

/**
 * Load and scrape URLs.
 *
 * @param {string[]} urls - Array of URLs
 * @returns {Promise<object>} Response from /load_link
 */
export async function loadLinks(urls) {
  const res = await fetch(`${API_URL}/load_link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to load link(s)");
  }

  return res.json();
}

/**
 * Ask a question about the scraped links.
 * 
 * @param {string} question - The user's question
 * @param {Array} history - Chat history
 * @returns {Promise<object>} Response from /ask_link
 */
export async function askLinkQuestion(question, history = []) {
  const res = await fetch(`${API_URL}/ask_link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to get answer");
  }

  return res.json();
}
