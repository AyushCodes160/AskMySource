# AskMySource — AI Knowledge Assistant

A complete, unified RAG (Retrieval-Augmented Generation) system to ask questions about your public GitHub repositories, documents (PDFs, DOCX, TXT), and web links. Powered by FAISS for rapid semantic retrieval, a FastAPI backend architecture, and an accessible Streamlit frontend.

You can also use a custom LoRA fine-tuned TinyLlama model for highly specialized, developer-style code explanations!

## 🌟 Features
- **GitHub Repo Code Ingestion**: Paste a GitHub URL to auto-clone and recursively read Python, JS, TS, JSX, and TSX files.
- **Document Analysis**: Upload documents directly into the UI. Supports PDFs, DOCX, TXT, CSV, and markdown files.
- **Web Link Scraping**: Input comma-separated URLs to scrape online documentation and articles.
- **Vector Search & FAISS**: Splits data into semantic chunks, embeds using `all-MiniLM-L6-v2`, and stores the references in robust local FAISS indexes.
- **Unified Streamlit Frontend**: Beautiful dark-mode UI with separate pages for handling Repos, Docs, and Links natively in Python.

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.10+ (recommend 3.12)

### 2. Backend & Dependencies Setup
Inside the target workspace, create your virtual environment and install all python requirements (this covers both FastAPI and Streamlit requirements):
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Start the Backend Server
Run the FastAPI backend. You can use the raw TinyLlama base model (since training your own takes time):
```bash
cd backend
source venv/bin/activate
USE_BASE_FALLBACK=true uvicorn app:app --host 0.0.0.0 --port 8000
```
*(If you are on an Apple Silicon Mac (M1/M2/M3), set `PYTORCH_ENABLE_MPS_FALLBACK=1` right before the command if you encounter tensor fallback errors).*

### 4. Start the Streamlit Frontend
In a new terminal wrapper:
```bash
# Ensure you are at the root code-rag level
source backend/venv/bin/activate
streamlit run streamlit_app.py
```
Open the provided `http://localhost:8501` URL in your browser and start asking questions!

### 5. Training the LoRA Model (Optional for Code RAG)
If you want the model to sound more like an expert developer and perfectly reference files:
1. Load a repository via the frontend first (so the `faiss_index` is created).
2. Stop the backend server.
3. Run the trainer:
```bash
cd backend
source venv/bin/activate
python train_lora.py
```
This takes a few hours on a standard CPU. Once done, it saves the optimized weights to the `lora_model/` directory. Restart the backend *without* `USE_BASE_FALLBACK=true` to automatically load and utilize it.

## 🏗 Architecture Layout

1. **User Input / Interface**: The user interacts with `streamlit_app.py` navigating between Code, Docs, and Links.
2. **Ingestion Pipelines**: Data is passed to `ingest.py`, `doc_ingest.py`, or `link_ingest.py` depending on the type.
3. **Chunking & Index Creation**: Text is split into fragments, embedded via sentence-transformers, and saved into three distinct FAISS databases (Code, Docs, Links).
4. **Retrieval**: FAISS logic (`rag.py`, `doc_rag.py`, `link_rag.py`) finds the top-K most semantically similar chunks to the user's query.
5. **Generation Output**: Context + Question goes into TinyLlama (via `model.py`) to stream out an informed response with citations.
