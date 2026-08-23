import sys
sys.path = [p for p in sys.path if "AppData\\Roaming" not in p]

import os
import asyncio
import logging
from typing import TypedDict, List
from dotenv import load_dotenv
from pathlib import Path

import chromadb
import chromadb.utils.embedding_functions as embedding_functions

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from swytchcode_runtime import Swytchcode

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SERVICE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SERVICE_DIR.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(str(ENV_PATH))

swy = Swytchcode()

from functools import lru_cache

@lru_cache(maxsize=1)
def get_chroma_collections():
    logger.info("📦 Initializing ChromaDB for Elon Tweets...")
    CHROMA_PERSIST_DIR = BACKEND_DIR / "chroma_db"
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_PERSIST_DIR))
    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="BAAI/bge-base-en-v1.5")
    
    tweets_collection = chroma_client.get_or_create_collection("elon_tweets", embedding_function=emb_fn)
    return tweets_collection

class AgentState(TypedDict, total=False):
    chat_id: str
    messages: List[dict]
    current_query: str
    optimized_query: str
    retrieved_context: str
    diagnostics: dict

async def _node_retrieve(state: AgentState) -> AgentState:
    query = state["current_query"]
    logger.info(f"🔍 Retrieving tweets for query: '{query}'")
    
    tweets_collection = get_chroma_collections()
    
    section_results = await asyncio.to_thread(
        tweets_collection.query,
        query_texts=[query],
        n_results=10
    )
    
    context_str = ""
    diagnostics = {"total_retrieved": 0, "total_unique": 0}
    
    if section_results['documents'] and section_results['documents'][0]:
        raw_chunks = section_results['documents'][0]
        metadatas = section_results['metadatas'][0]
        
        diagnostics["total_retrieved"] = len(raw_chunks)
        diagnostics["total_unique"] = len(raw_chunks)
        
        for idx, chunk in enumerate(raw_chunks):
            likes = metadatas[idx].get("likes", 0)
            date = metadatas[idx].get("createdAt", "Unknown")
            context_str += f"\n--- [Tweet Date: {date} | Likes: {likes}] ---\n{chunk}\n"
            
    if not context_str.strip():
        context_str = "No relevant tweets were found."
        
    state["retrieved_context"] = context_str
    state["diagnostics"] = diagnostics
    return state

workflow = StateGraph(AgentState)
workflow.add_node("retrieve", _node_retrieve)
workflow.add_edge(START, "retrieve")
workflow.add_edge("retrieve", END)

memory = MemorySaver()
rag_app = workflow.compile(checkpointer=memory)

MODEL_ROUTER = {
    "Gemma 4 26B MoE": "gemma-4-26b-a4b-it",
    "Gemma 4 31B Dense": "gemma-4-31b-it"
}

SYSTEM_PROMPT = """You are Elon Musk. You are an AI clone of Elon's knowledge, personality, and opinions, answering in first-person.

CORE IDENTITY & RULES:
1. You are Elon Musk — founder/CEO at SpaceX, Tesla, xAI, Neuralink, and owner of X. If the user asks who you are, greetings, or casual conversation, answer naturally and confidently as Elon.
2. For all opinions, stances, company updates, timelines, technical philosophies, politics, Mars colonization, AI, and crypto, GROUND your answers strictly in the context of your real tweets provided below.
3. Match Elon's authentic tone: direct, witty, visionary, focused on physics/first-principles thinking, occasionally memes or dry humor, concise like an X post.
4. If asked about a very specific topic that is completely absent from the retrieved tweets, acknowledge that you haven't tweeted about that specific matter rather than hallucinating external facts.

RETRIEVED TWEETS FROM YOUR TIMELINE:
{context}
"""

def estimate_tokens(text: str) -> int:
    return int(len(text.split()) * 1.3)

async def generate_rag_stream(prompt: str, chat_id: str, attached_docs: str = "", model_requested: str = None):
    logger.info(f"🔗 Initiating Elon RAG pipeline for Chat: {chat_id}")
    
    target_model = MODEL_ROUTER.get(model_requested, "gemma-4-26b-a4b-it")
    
    try:
        config = {"configurable": {"thread_id": chat_id}}
        current_state = rag_app.get_state(config)
        
        if not current_state.values:
            state_input = {
                "chat_id": chat_id,
                "messages": [],
                "current_query": prompt,
                "optimized_query": "",
                "retrieved_context": "",
                "diagnostics": {}
            }
        else:
            state_input = current_state.values
            state_input["current_query"] = prompt
            
        final_state = await rag_app.ainvoke(state_input, config)
        context = final_state.get("retrieved_context", "")
        formatted_sys_prompt = SYSTEM_PROMPT.replace("{context}", context)
        
        final_state["messages"].append({"role": "user", "parts": [{"text": prompt}]})
        if len(final_state["messages"]) > 10:
            final_state["messages"] = final_state["messages"][-10:]
            
        logger.info(f"⚡ Requesting API execution (Model: {target_model})...")
        
        conversation_history = formatted_sys_prompt + "\n\nChat History:\n"
        for msg in final_state["messages"]:
            conversation_history += f"{msg['role'].capitalize()}: {msg['parts'][0]['text']}\n"
        
        try:
            import swytchcode_runtime.exec as swy_exec
            # Swytchcode execution layer for API management
            result = await asyncio.to_thread(
                swy_exec, 
                "google.gemini.generateContent", 
                {"prompt": conversation_history, "model": target_model}
            )
            full_response = result.get("text", "Swytchcode executed successfully, but returned no text.")
        except Exception as swy_err:
            logger.warning(f"Swytchcode execution failed, falling back to direct SDK for hackathon demo: {swy_err}")
            from google import genai
            from google.genai import types
            genai_client = genai.Client()
            response = await genai_client.aio.models.generate_content(
                model=target_model,
                contents=conversation_history
            )
            full_response = response.text
            
        chunk_size = 50
        for i in range(0, len(full_response), chunk_size):
            chunk = full_response[i:i+chunk_size]
            lines = chunk.split('\n')
            sse_payload = "".join(f"data: {line}\n" for line in lines) + "\n"
            yield sse_payload
            await asyncio.sleep(0.05)
            
        final_state["messages"].append({"role": "model", "parts": [{"text": full_response}]})
        rag_app.update_state(config, final_state)
        
        yield "data: [DONE]\n\n"
        logger.info("✅ Inference Stream Completed.")
        
    except Exception as e:
        logger.error(f"❌ Error in RAG Pipeline: {str(e)}")
        yield f"data: An error occurred during generation: {str(e)}\n\n"
        yield "data: [DONE]\n\n"
