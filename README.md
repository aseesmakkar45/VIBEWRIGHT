<div align="center">

# 🚀 VIBEWRIGHT (PersonaTwin.AI)

### Timeline-Grounded AI Persona & Conversational Digital Twin

#### An interactive, multimodal AI digital twin engine grounded in real-world post history and timelines using Retrieval-Augmented Generation (RAG), LangGraph, and Google Gemma 4.

### 🎥 [Watch the Live Demo & Pitch Video Here](https://drive.google.com/drive/folders/1EibN3f_KXpm2IH3N51PIC2vmBicsyOAH?usp=sharing)

<p>

[![Primary LLM](https://img.shields.io/badge/Primary_LLM-Gemma_4-4285F4?style=for-the-badge&logo=google&logoColor=white)]()
[![Embedding](https://img.shields.io/badge/Embeddings-BGE--Base--EN-FF6F00?style=for-the-badge)]()
[![Framework](https://img.shields.io/badge/Orchestration-LangGraph-1C3C3C?style=for-the-badge)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)]()
[![Frontend](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![Database](https://img.shields.io/badge/Vector_DB-ChromaDB-orange?style=for-the-badge)]()
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![License](https://img.shields.io/badge/License-BSD%203--Clause-yellow?style=for-the-badge)](LICENSE)

</p>

---

### ⚡ Timeline Grounding • Voice-First • Multimodal Document Ingestion • Real-Time SSE Streaming

[Features](#-features) •
[System Architecture](#-system-architecture) •
[Tech Stack](#-tech-stack) •
[Quickstart](#-quickstart-guide) •
[Configuration](#-configuration) •
[API Reference](#-api-reference)

</div>

---

# 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Core Features](#-features)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
  - [Timeline Vector Ingestion](#1-timeline-vector-ingestion)
  - [LangGraph Retrieval Pipeline](#2-langgraph-retrieval-pipeline)
  - [Model Routing & Generation](#3-model-routing--generation)
  - [Real-Time SSE Streaming](#4-real-time-sse-streaming)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Quickstart Guide](#-quickstart-guide)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [License](#-license)

---

# 📖 Project Overview

**VIBEWRIGHT (PersonaTwin.ai)** is a highly authentic, interactive digital twin of Elon Musk, designed to dynamically simulate his unique conversational style and first-principles mental models. At its core, the application leverages an advanced Retrieval-Augmented Generation (RAG) pipeline powered by ChromaDB, which ingests a massive dataset of historical tweets. This allows the AI to ground its answers strictly in actual past statements rather than hallucinating facts. 

To ensure absolute tonal accuracy, the system introduces dynamic "Vibe Modes"—allowing users to seamlessly switch between the punchy, meme-heavy "X Mode," the hardcore engineering depth of "First Principles," and the expansive, philosophical "Visionary" scale. 

The architecture is built on a high-performance FastAPI backend integrated with LangGraph for state management, while **Swytchcode** serves as the robust execution layer orchestrating Google's powerful Gemini models. To handle novel or current events, the application features an intelligent DuckDuckGo factual search fallback, smoothly blending real-time knowledge into the conversation without falsely attributing it to the persona’s past. 

Crucially, we implemented an autonomous "Persona Critic" mechanism. Before streaming the response to our sleek, responsive React frontend, a secondary LLM evaluates the candidate output for stylistic consistency, appropriate length, and historical accuracy—automatically triggering revisions if the response feels like a forced caricature. The result is a profoundly realistic, voice-enabled AI companion.

### Key Highlights:
- **Factually Grounded Persona**: Retrieves authentic timeline posts and statements before crafting replies.
- **Multimodal Interactions**: Record voice queries from the browser, drag-and-drop reference files (PDF, TXT, MD, CSV), or type standard prompts.
- **Real-Time Token Streaming**: Streams generated tokens via Server-Sent Events (SSE) for instant feedback.
- **Dynamic Multi-Session Chat**: Support for pinned chats, session renaming, message editing, branch regeneration, and local text-to-speech.

---

# ✨ Features

### 👤 Interactive User Experience
- **🎙️ Voice-First Input**: Record audio directly in-browser with automatic transcription through Whisper / multimodal STT.
- **📄 Multimodal Document Attachment**: Upload PDFs, TXTs, or markdown notes to provide ad-hoc context alongside queries.
- **⚡ Fluid Token Streaming**: Real-time response streaming with Markdown and code syntax highlighting.
- **✏️ Message Editing & Branching**: Edit previous user turns to fork conversations and regenerate responses.
- **📌 Multi-Chat Management**: Pin favorite sessions, rename topics, search history, and sort by recent activity.
- **🔊 Read Aloud (TTS)**: Built-in browser speech synthesis to listen to replies hands-free.

### 🧠 AI & Engineering Capabilities
- **Semantic Vector Search**: High-dimensional embeddings with `BAAI/bge-base-en-v1.5` over ChromaDB collections.
- **LangGraph State Orchestration**: Modular graph workflow isolating retrieval, state checkpoints, and generation.
- **Model Router**: Dynamic switching between **Gemma 4 26B MoE** and **Gemma 4 31B Dense** models.
- **FastAPI Async Gateway**: High-throughput asynchronous backend designed with clean boundary separation.

---

# 🏗 System Architecture

```mermaid
flowchart LR

User["👤 User"]

subgraph Frontend ["⚛️ React 19 + Vite Frontend"]
    Input["🎙️ Voice / 📄 Files / ⌨️ Text"]
    UI["💬 Streaming Chat Container"]
    State["🗂️ Session & History Management"]
end

subgraph Backend ["⚡ FastAPI Gateway"]
    Router["POST /api/chat/stream"]
    AudioProc["🎙️ Audio Transcriber"]
    DocProc["📄 PyMuPDF Document Parser"]
end

subgraph Intelligence ["🧠 LangGraph & Vector Engine"]
    Graph["LangGraph StateGraph"]
    VectorDB[("📚 ChromaDB (Timeline Embeddings)")]
    LLM["🤖 Google Gemma 4 (MoE / Dense)"]
end

User --> Input
Input --> Router
Router --> AudioProc
Router --> DocProc
AudioProc --> Graph
DocProc --> Graph
Router --> Graph
Graph --> VectorDB
VectorDB --> Graph
Graph --> LLM
LLM --> Router
Router --> UI
UI --> User
```

---

# 🔍 How It Works

### 1. Timeline Vector Ingestion
Historical posts and timeline data (`all_musk_posts.csv`) are filtered, indexed, and embedded using `BAAI/bge-base-en-v1.5`. Chunks preserve engagement metrics (likes, retweets, timestamps) in vector metadata for rich prompt grounding.

```bash
python backend/scripts/ingest_tweets.py
```

### 2. LangGraph Retrieval Pipeline
Incoming queries pass into a compiled LangGraph workflow:
1. **Query Ingestion**: Normalizes user text and any transcribed voice input.
2. **Context Retrieval**: Performs cosine similarity search against ChromaDB collections (`n_results=10`).
3. **Prompt Injection**: Formats retrieved posts with timestamps and engagement context into a specialized system prompt.

### 3. Model Routing & Generation via Swytchcode
The backend executes calls to Google's Gemini/Gemma models using **Swytchcode** as the robust execution integration layer. Before the response is finalized, an autonomous **Persona Critic** evaluates the candidate generation for tone, length, and historical accuracy, triggering a revision loop if the response fails stylistic checks. 

### 4. External Factual Search (DuckDuckGo Fallback)
If the query involves current events or topics outside the persona's dataset (determined by knowledge confidence scoring), a lightweight DuckDuckGo Lite search is triggered to inject real-time facts into the context, without falsely claiming the persona previously knew them.

### 5. Real-Time SSE Streaming
Responses are streamed incrementally over HTTP using Server-Sent Events (`text/event-stream`), delivering low latency and immediate UI updates.

---

# 🛠 Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS | High-performance interactive UI with Lucide icons |
| **Backend** | FastAPI, Uvicorn | Async Python API gateway with CORS and multipart support |
| **Orchestration** | LangGraph, LangChain | Stateful graph execution and conversation checkpoints |
| **Vector DB** | ChromaDB | Persistent local vector store for semantic timeline search |
| **Embeddings** | SentenceTransformers (`BAAI/bge-base-en-v1.5`) | Dense text embeddings |
| **LLM Engine** | Google Gemma 4 / Gemini API | Advanced reasoning and grounded generation |
| **Speech** | Web MediaRecorder API, Whisper STT | Browser-native voice capture and audio transcription |

---

# 📁 Repository Structure

```text
VIBEWRITE/
├── backend/
│   ├── api/
│   │   └── routes/
│   │       └── chat.py          # Streaming chat and audio endpoints
│   ├── core/
│   │   └── config.py            # Application settings and environment config
│   ├── scripts/
│   │   ├── ingest_tweets.py     # Script to embed timeline posts into ChromaDB
│   │   └── ingest_docs.py       # Document ingestion utilities
│   ├── services/
│   │   ├── audio_engine.py      # Audio transcription and processing
│   │   └── rag_engine.py        # LangGraph workflow, ChromaDB & LLM stream
│   ├── main.py                  # FastAPI application entry point
│   ├── requirements.txt         # Python backend dependencies
│   └── .env.example             # Template for API keys and configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx  # Primary chat interface & message list
│   │   │   ├── MessageInput.jsx   # Input bar with voice & file attachment
│   │   │   └── Sidebar.jsx        # Multi-chat sessions and pinned list
│   │   ├── App.jsx              # Main React application shell
│   │   └── index.css            # Tailwind styling rules
│   ├── package.json             # Node dependencies and scripts
│   └── vite.config.js           # Vite build configuration
├── docs/                        # Development logs and verification playbooks
├── test_bot.py                  # CLI test script for terminal RAG streaming
└── README.md                    # Project documentation
```

---

# 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Gemini / Google AI API Key**

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux / macOS:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` to `backend/.env`.

5. *(Optional)* Ingest or update timeline data into ChromaDB:
   ```bash
   python scripts/ingest_tweets.py
   ```

6. Start the FastAPI development server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Backend will be running at `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`).

---

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node packages:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser to interact with VIBEWRITE!

---

# ⚙️ Configuration

Create a `.env` file in `backend/` with the following variables:

```env
# Google GenAI / Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Application Configuration
APP_NAME=PersonaTwin.AI
DEBUG=True
```

---

# 📡 API Reference

### `POST /api/chat/stream`
Handles multimodal conversation streaming using Server-Sent Events.

- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `text` *(string, optional)*: User prompt or message.
  - `chatId` *(string, required)*: Unique session identifier for memory checkpointing.
  - `model_requested` *(string, optional)*: Model choice (e.g., `Gemma 4 26B MoE`).
  - `files` *(binary list, optional)*: Audio recording (`.webm`, `.wav`) or document attachments (`.pdf`, `.txt`, `.md`).
- **Response**: `text/event-stream` containing sequential token chunks:
  ```text
  data: Hello
  data:  world!
  data: [DONE]
  ```

### `POST /api/transcribe`
Converts raw audio bytes into text.

- **Content-Type**: `multipart/form-data`
- **Parameters**: `file` (Audio file)
- **Response**: `{"text": "transcribed string"}`

---

# 📄 License

This project is licensed under the [BSD 3-Clause License](LICENSE).
