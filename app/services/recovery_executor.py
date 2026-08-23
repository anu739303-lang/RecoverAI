import random
from typing import Dict


def execute_recovery(transaction: Dict, action: str) -> Dict:
    """
    Simulate execution of a recovery action.

    This uses synthetic success probabilities.
    No real payment or customer communication is performed.
    """

    amount = float(transaction.get("amount", 0))
    retry_count = int(transaction.get("retry_count", 0))

    # -----------------------------------
    # Actions that should NOT be executed
    # -----------------------------------

    if action in ["NO_ACTION", "STOP", "MANUAL_REVIEW"]:

        return {
            "executed": False,
            "success": False,
            "recovered_amount": 0,
            "result": "NOT_EXECUTED",
            "message": "Action is outside automatic recovery scope."
        }

    # -----------------------------------
    # Safety: maximum retry limit
    # -----------------------------------

    if action == "RETRY_PAYMENT" and retry_count >= 3:

        return {
            "executed": False,
            "success": False,
            "recovered_amount": 0,
            "result": "STOPPED",
            "message": "Maximum retry limit reached."
        }

    # -----------------------------------
    # Success probabilities
    # -----------------------------------

    success_probability = {
        "RETRY_PAYMENT": 0.65,
        "PAYMENT_REMINDER": 0.45,
        "PRIORITY_REMINDER": 0.60,
        "ALTERNATIVE_PAYMENT": 0.70
    }

    probability = success_probability.get(action, 0)

    # -----------------------------------
    # Simulate recovery
    # -----------------------------------

    success = random.random() < probability

    if success:

        return {
            "executed": True,
            "success": True,
            "recovered_amount": amount,
            "result": "RECOVERED",
            "message": "Revenue successfully recovered."
        }

    return {
        "executed": True,
        "success": False,
        "recovered_amount": 0,
        "result": "FAILED",
        "message": "Recovery attempt was unsuccessful."
    }