#!/usr/bin/env python3
"""
Daena Global Embedding Service (Singleton)
===========================================
Prevents catastrophic RAM explosion by instantiating the
heavy PyTorch/SentenceTransformer models EXACTLY ONCE with strict
resource limits.

All components (Watchdog, Tool_Selector, Vector_Memory) must call
this service instead of loading their own isolated copies of the model.
"""

import os
import sys
import functools
import threading
from typing import Optional, List

# Global singleton storage
_global_embedding_model = None
_model_failed_to_load = False
_model_load_lock = threading.Lock()
_is_frozen = getattr(sys, 'frozen', False)  # True inside PyInstaller


def get_embedding_model():
    """Lazily load and return the FastEmbed model singleton.
    Thread-safe with double-checked locking."""
    global _global_embedding_model, _model_failed_to_load

    if _global_embedding_model is not None:
        return _global_embedding_model

    if _model_failed_to_load:
        return None

    with _model_load_lock:
        # Double-check after acquiring lock
        if _global_embedding_model is not None:
            return _global_embedding_model
        if _model_failed_to_load:
            return None

        try:
            from fastembed import TextEmbedding
            print("[EmbeddingService] Loading FastEmbed (all-MiniLM-L6-v2) via ONNX Runtime...")
            # Automatically downloads the model if not present, runs purely on CPU via ONNX
            _global_embedding_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
            print("[EmbeddingService] Model loaded successfully (ONNX Runtime, Ultra-Light).")
            return _global_embedding_model
        except ImportError:
            print("[EmbeddingService] fastembed not installed. Using FTS5 fallback.")
            _model_failed_to_load = True
            return None
        except Exception as e:
            print(f"[EmbeddingService] Failed to load ONNX model: {e}")
            _model_failed_to_load = True
            return None


@functools.lru_cache(maxsize=256)
def encode_text(text: str) -> Optional[List[float]]:
    """Encodes text into a normalized float vector. Results are cached."""
    model = get_embedding_model()
    if not model:
        return None

    try:
        # fastembed returns an iterator of numpy arrays, we evaluate the first one
        vec = list(model.embed([text]))[0]
        # fastembed is already normalized. Convert to list for FAISS / JSON
        return vec.tolist()
    except Exception as e:
        print(f"[EmbeddingService] FastEmbed Encode failed: {e}")
        return None


def has_real_embeddings() -> bool:
    """Returns True if the ONNX embedding engine is operational.
    NOTE: This is LAZY — it will trigger model load on first call."""
    return get_embedding_model() is not None


def has_real_embeddings_cached() -> bool:
    """Returns whether the model has already been loaded (no side effects)."""
    return _global_embedding_model is not None
