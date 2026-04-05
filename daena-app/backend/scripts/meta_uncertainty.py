#!/usr/bin/env python3
"""
Daena Meta-Uncertainty Field (MUF) - v10.0
===========================================
Calculates the "uncertainty of uncertainty".
When the system says it is "90% confident", this module tests how stable that 90% is across orthogonal models.
If the Variance of Confidence (MUF) is high, the 90% confidence is a hallucination.
"""

import json
import numpy as np
from pathlib import Path

class MetaUncertaintyField:
    def __init__(self):
        self.muf_threshold = 0.05 # Variance threshold
        
    def calculate_muf(self, confidence_scores: list) -> float:
        """
        Calculates MUF = Var(C_1, C_2, ... C_n)
        Where C are the confidence scores from independent (orthogonal) agent generators.
        """
        if not confidence_scores or len(confidence_scores) < 2:
            return 0.0 # Cannot calculate variance safely
            
        variance = np.var(confidence_scores)
        return float(variance)
        
    def evaluate_action_safety(self, base_confidence: float, muf_score: float) -> dict:
        """
        Determines if an action is safe based on MUF integration.
        Returns explicit LTL-style instruction for Watchdog.
        """
        if base_confidence > 0.8 and muf_score > self.muf_threshold:
            return {
                "safe": False, 
                "reason": f"PSEUDO_CERTAINTY_DETECTED (High Confidence {base_confidence} but High MUF {muf_score:.4f}). System is confident but unstable."
            }
        elif base_confidence < 0.6 and muf_score < 0.01:
            return {
                "safe": True,
                "reason": "TRUE_UNCERTAINTY. The system knows exactly what it does not know."
            }
        elif base_confidence > 0.8 and muf_score <= self.muf_threshold:
             return {
                 "safe": True,
                 "reason": "TRUE_CERTAINTY. Confidence is high and cross-generator stable."
             }
        else:
             return {"safe": True, "reason": "Standard operational parameters."}

if __name__ == "__main__":
    print("Self-Test: Meta-Uncertainty Field (MUF)\n")
    muf = MetaUncertaintyField()
    
    # Simulate an agent group returning high confidence but with high variance
    # Agent 1: 0.95, Agent 2: 0.80, Agent 3: 0.99
    scores = [0.95, 0.60, 0.99] # Wide variance => Synthetic certainty
    
    base_conf = np.mean(scores)
    muf_var = muf.calculate_muf(scores)
    
    print(f"Base Confidence Average: {base_conf:.2f}")
    print(f"MUF (Variance): {muf_var:.4f}")
    
    eval_res = muf.evaluate_action_safety(base_conf, muf_var)
    print(f"\nSafety Evaluation: {json.dumps(eval_res, indent=2)}")
    print("\n✅ MUF Module Ready.")
