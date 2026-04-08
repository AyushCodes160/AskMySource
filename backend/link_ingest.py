# ============================================================
# FILE: backend/link_ingest.py
# PURPOSE: Scrape content from provided URLs, chunk it,
#          embed with SentenceTransformers, and store in a
#          separate FAISS index for link-based RAG.
# ============================================================

import os
import json
import numpy as np
import faiss
import requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer


# ── Configuration ────────────────────────────────────────────
LINK_INDEX_DIR  = "link_faiss_index"    # separate from code/doc index
CHUNK_CHARS     = 1500                   # ~300 words per chunk
OVERLAP_CHARS   = 200                    # character overlap
BATCH_SIZE      = 32
EMBED_MODEL     = "sentence-transformers/all-MiniLM-L6-v2"


def ensure_dirs():
    """Create necessary directories."""
    os.makedirs(LINK_INDEX_DIR, exist_ok=True)


# ── Scraper ──────────────────────────────────────────────────

def scrape_url(url: str) -> str:
    """
    Fetch and extract clean text from a URL.
    
    Args:
        url: The web URL to scrape.
        
    Returns:
        Cleaned text from the main content of the web page.
        
    Raises:
        ValueError: If unable to fetch or parse the text.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, "html.parser")
        
        # Remove noisy elements
        for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
            script.extract()
            
        # Get text
        text = soup.get_text(separator="\n")
        
        # Clean up excessive newlines/spaces
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = "\n\n".join(chunk for chunk in chunks if chunk)
        
        return text
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to fetch {url}: {e}")
    except Exception as e:
        raise ValueError(f"Failed to parse {url}: {e}")


# ── Chunking ─────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = CHUNK_CHARS,
               overlap: int = OVERLAP_CHARS) -> list[str]:
    """Split text into overlapping character-based chunks."""
    if not text.strip():
        return []

    if len(text) <= chunk_size:
        return [text.strip()]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        if end < len(text):
            para_break = text.rfind("\n\n", start + chunk_size // 2, end + 100)
            if para_break != -1:
                end = para_break
            else:
                sent_break = text.rfind(". ", start + chunk_size // 2, end + 50)
                if sent_break != -1:
                    end = sent_break + 1
                else:
                    newline_break = text.rfind("\n", start + chunk_size // 2, end + 50)
                    if newline_break != -1:
                        end = newline_break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap
        if start >= len(text):
            break

    return chunks


# ── Index Building ───────────────────────────────────────────

def build_link_index(urls: list[str], index_dir: str = LINK_INDEX_DIR) -> int:
    """
    Main pipeline: scrape URLs → chunk → embed → build FAISS index.

    Args:
        urls: List of web URLs to scrape.
        index_dir: Directory to save FAISS index and metadata.

    Returns:
        Total number of chunks indexed.
    """
    os.makedirs(index_dir, exist_ok=True)

    all_chunks = []
    all_metadata = []

    for url in urls:
        print(f"\nScraping: {url}")

        try:
            content = scrape_url(url)
        except Exception as e:
            print(f"  WARNING: Failed to scrape '{url}': {e}")
            continue

        if not content.strip():
            print(f"  WARNING: No text extracted from '{url}'")
            continue

        chunks = chunk_text(content)
        print(f"  Extracted {len(content)} chars → {len(chunks)} chunks")

        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadata.append({
                "chunk_id": len(all_metadata),
                "url": url,
                "chunk_index": i,
                "chunk_text": chunk,
            })

    print(f"\nTotal chunks to embed: {len(all_chunks)}")

    if not all_chunks:
        return 0

    print(f"Loading embedding model: {EMBED_MODEL}")
    model = SentenceTransformer(EMBED_MODEL)

    print("Embedding chunks...")
    embeddings = model.encode(
        all_chunks,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    embeddings = embeddings.astype(np.float32)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    faiss.normalize_L2(embeddings)
    index.add(embeddings)

    index_path = os.path.join(index_dir, "index.faiss")
    metadata_path = os.path.join(index_dir, "metadata.json")

    faiss.write_index(index, index_path)
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(all_metadata, f, ensure_ascii=False, indent=2)

    print(f"  FAISS index saved: {index_path}")
    print(f"  Metadata saved:    {metadata_path}")
    print(f"  Total vectors:     {index.ntotal}")

    return index.ntotal
