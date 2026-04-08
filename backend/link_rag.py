# ============================================================
# FILE: backend/link_rag.py
# PURPOSE: Retrieve relevant chunks from the link FAISS index
#          using semantic similarity search.
# ============================================================

import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# ── Configuration ────────────────────────────────────────────
LINK_INDEX_DIR = "link_faiss_index"
EMBED_MODEL    = "sentence-transformers/all-MiniLM-L6-v2"

# ── Module-level singletons ──────────────────────────────────
_faiss_index = None
_metadata    = None
_embed_model = None

def _load_resources():
    """Load the link FAISS index, metadata, and embedding model."""
    global _faiss_index, _metadata, _embed_model

    index_path    = os.path.join(LINK_INDEX_DIR, "index.faiss")
    metadata_path = os.path.join(LINK_INDEX_DIR, "metadata.json")

    if not os.path.isfile(index_path):
        raise FileNotFoundError(
            f"Link FAISS index not found at '{index_path}'. "
            "Scrape links first via /load_link."
        )
    if not os.path.isfile(metadata_path):
        raise FileNotFoundError(
            f"Link metadata not found at '{metadata_path}'. "
            "Scrape links first via /load_link."
        )

    _faiss_index = faiss.read_index(index_path)

    with open(metadata_path, "r", encoding="utf-8") as f:
        _metadata = json.load(f)

    if _embed_model is None:
        _embed_model = SentenceTransformer(EMBED_MODEL)

    print(f"[LinkRAG] Index loaded — {_faiss_index.ntotal} vectors, "
          f"{len(_metadata)} metadata entries.")


def reload_index():
    """Force-reload the link FAISS index after new scrape."""
    global _faiss_index, _metadata
    _faiss_index = None
    _metadata    = None
    _load_resources()


def retrieve(question: str, top_k: int = 5) -> list[dict]:
    """Retrieve the top-k most relevant link chunks."""
    global _faiss_index, _metadata, _embed_model

    if _faiss_index is None:
        _load_resources()

    query_vector = _embed_model.encode(
        [question],
        normalize_embeddings=True,
        convert_to_numpy=True,
    ).astype(np.float32)
    faiss.normalize_L2(query_vector)

    scores, indices = _faiss_index.search(query_vector, top_k)

    results = []
    for i, idx in enumerate(indices[0]):
        if idx == -1:
            continue
        meta = _metadata[idx]
        results.append({
            "url":        meta["url"],
            "chunk_text": meta["chunk_text"],
            "score":      float(scores[0][i]),
        })

    return results


def get_chunk_count() -> int:
    """Return the number of chunks in the loaded link index."""
    global _faiss_index
    if _faiss_index is None:
        try:
            _load_resources()
        except FileNotFoundError:
            return 0
    return _faiss_index.ntotal


def is_loaded() -> bool:
    """Check if a link index is currently loaded."""
    try:
        if _faiss_index is not None:
            return True
        _load_resources()
        return True
    except FileNotFoundError:
        return False
