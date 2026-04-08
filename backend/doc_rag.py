# ============================================================
# FILE: backend/doc_rag.py
# PURPOSE: Retrieve relevant document chunks from the document
#          FAISS index using semantic similarity search.
#          This is separate from rag.py (which handles code).
# ============================================================

import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer


# ── Configuration ────────────────────────────────────────────
DOC_INDEX_DIR = "doc_faiss_index"
EMBED_MODEL   = "sentence-transformers/all-MiniLM-L6-v2"

# ── Module-level singletons ──────────────────────────────────
_faiss_index = None
_metadata    = None
_embed_model = None


def _load_resources():
    """
    Load the document FAISS index, metadata, and embedding model.

    Raises:
        FileNotFoundError: If the document index doesn't exist.
    """
    global _faiss_index, _metadata, _embed_model

    index_path    = os.path.join(DOC_INDEX_DIR, "index.faiss")
    metadata_path = os.path.join(DOC_INDEX_DIR, "metadata.json")

    if not os.path.isfile(index_path):
        raise FileNotFoundError(
            f"Document FAISS index not found at '{index_path}'. "
            "Upload documents first via /doc/upload."
        )
    if not os.path.isfile(metadata_path):
        raise FileNotFoundError(
            f"Document metadata not found at '{metadata_path}'. "
            "Upload documents first via /doc/upload."
        )

    _faiss_index = faiss.read_index(index_path)

    with open(metadata_path, "r", encoding="utf-8") as f:
        _metadata = json.load(f)

    if _embed_model is None:
        _embed_model = SentenceTransformer(EMBED_MODEL)

    print(f"[DocRAG] Index loaded — {_faiss_index.ntotal} vectors, "
          f"{len(_metadata)} metadata entries.")


def reload_index():
    """Force-reload the document FAISS index after new uploads."""
    global _faiss_index, _metadata
    _faiss_index = None
    _metadata    = None
    _load_resources()


def retrieve(question: str, top_k: int = 5) -> list[dict]:
    """
    Retrieve the top-k most relevant document chunks.

    Args:
        question: Natural language query.
        top_k:    Number of results to return.

    Returns:
        List of dicts with file_name, chunk_text, and score.
    """
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
            "file_name":  meta["file_name"],
            "chunk_text": meta["chunk_text"],
            "score":      float(scores[0][i]),
        })

    return results


def get_chunk_count() -> int:
    """Return the number of chunks in the loaded document index."""
    global _faiss_index
    if _faiss_index is None:
        _load_resources()
    return _faiss_index.ntotal


def is_loaded() -> bool:
    """Check if a document index is currently loaded."""
    try:
        if _faiss_index is not None:
            return True
        _load_resources()
        return True
    except FileNotFoundError:
        return False
