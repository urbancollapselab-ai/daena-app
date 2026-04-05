#!/usr/bin/env python3
"""
Daena Temporal Self-Disagreement Engine (TSDE) - v10.0
======================================================
Solves "Identity Fracture" vs "Cognitive Freezing".
Evaluates tasks against past snapshots of the policy model.
If the divergence is too high, the identity is fracturing.
If the divergence is zero, the model has stopped learning.
"""

import json
from scipy.spatial.distance import jensenshannon
import numpy as np

class TemporalDisagreementEngine:
    def __init__(self):
        # Simulated historical snapshots (In a real system, these are pulled from graph_memory.db lineage)
        self.snapshots = {
            "1_month_ago": np.array([0.7, 0.2, 0.1]),
            "3_months_ago": np.array([0.65, 0.25, 0.1]),
        }

    def measure_divergence(self, current_policy_vector: list) -> float:
        """
        Calculates Jensen-Shannon Temporal Divergence against the 1-month snapshot.
        current_policy_vector: The agent's current probability distribution over outputs (e.g., [0.8, 0.15, 0.05])
        Returns divergence value.
        """
        current = np.array(current_policy_vector)
        past = self.snapshots["1_month_ago"]
        
        # JSD returns distance, square it to get divergence
        js_distance = jensenshannon(current, past)
        divergence = js_distance ** 2
        
        return divergence

    def analyze_cognitive_state(self, divergence: float) -> str:
        """Determines the diagnostic state of the AI."""
        if divergence < 0.01:
            return "FROZEN_COGNITION (Warning: System is no longer evolving its worldview)."
        elif divergence > 0.4:
            return "UNSTABLE_IDENTITY (Warning: Core beliefs are shifting too rapidly)."
        else:
            return "HEALTHY_EVOLUTION (System is learning at a stable rate)."


if __name__ == "__main__":
    print("Self-Test: Temporal Self-Disagreement Engine (TSDE)\n")
    engine = TemporalDisagreementEngine()
    
    # Simulate a current intent vector for a familiar task
    current_intent = [0.75, 0.20, 0.05]
    div = engine.measure_divergence(current_intent)
    
    print(f"Jensen-Shannon Temporal Divergence: {div:.4f}")
    print(f"Cognitive State: {engine.analyze_cognitive_state(div)}")
    print("\n✅ TSDE Module Ready.")
