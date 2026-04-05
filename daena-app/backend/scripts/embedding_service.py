#!/usr/bin/env python3
"""
Daena Global Embedding Service (Singleton)
===========================================
Prevents catastrophic 100GB RAM explosion by instantiating the 
heavy PyTorch/SentenceTransformer models EXACTLY ONCE.

All components (Watchdog, Tool_Selector, Vector_Memory) must call 
this service instead of loading their own isolated copies of the model.
"""

from typing import Optional, List, Union
import functools

# Global singleton storage
_global_embedding_model = None
_model_failed_to_load = False

def get_embedding_model():
    """Lazily load and return the SentenceTransformer model singleton."""
    global _global_embedding_model, _model_failed_to_load
    
    if _global_embedding_model is not None:
        return _global_embedding_model
        
    if _model_failed_to_load:
        return None
        
    try:
        from sentence_transformers import SentenceTransformer
        print("[EmbeddingService] 🧠 Loading Singleton SentenceTransformer (all-MiniLM-L6-v2) into memory...")
        _global_embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[EmbeddingService] ✅ Singleton PyTorch Model Successfully Loaded!")
        return _global_embedding_model
    except ImportError:
        print("[EmbeddingService] ⚠️ WARNING: sentence-transformers not installed. Embedded memory will be disabled globally.")
        _model_failed_to_load = True
        return None
    except Exception as e:
        print(f"[EmbeddingService] ❌ FATAL ERROR loading PyTorch model: {e}")
        _model_failed_to_load = True
        return None

@functools.lru_cache(maxsize=1024)
def encode_text(text: str) -> Optional[List[float]]:
    """
    Encodes text into a list of floats (Vector representation).
    Uses caching to instantly return representations for known inputs!
    """
    model = get_embedding_model()
    if not model:
        return None
        
    try:
        # Generate the encoding natively
        vec = model.encode(text, normalize_embeddings=True)
        return vec.tolist()
    except Exception as e:
        print(f"[EmbeddingService] Encode failed: {e}")
        return None

def has_real_embeddings() -> bool:
    """Returns True if the PyTorch embedding engine is fully operational."""
    return get_embedding_model() is not None
