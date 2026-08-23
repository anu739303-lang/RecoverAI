from typing import Dict


def decide_recovery_action(transaction: Dict) -> Dict:
    """
    Decide the safest recovery action for a transaction.
    """

    status = transaction.get("payment_status")
    failure_reason = transaction.get("failure_reason")
    retry_count = int(transaction.get("retry_count", 0))
    amount = float(transaction.get("amount", 0))
    customer_type = transaction.get("customer_type")

    # -----------------------------------
    # Successful payment
    # -----------------------------------

    if status == "success":

        return {
            "action": "NO_ACTION",
            "priority": "LOW",
            "reason": "Payment already completed.",
            "should_execute": False
        }

    # -----------------------------------
    # Stop rule
    # -----------------------------------

    if retry_count >= 3:

        return {
            "action": "STOP",
            "priority": "HIGH",
            "reason": "Maximum retry limit reached.",
            "should_execute": False
        }

    # -----------------------------------
    # Insufficient balance
    # -----------------------------------

    if failure_reason == "insufficient_balance":

        return {
            "action": "PAYMENT_REMINDER",
            "priority": "HIGH",
            "reason": "Customer may need to add funds before retrying.",
            "should_execute": True
        }

    # -----------------------------------
    # Temporary technical problems
    # -----------------------------------

    if failure_reason in [
        "network_error",
        "bank_timeout"
    ]:

        return {
            "action": "RETRY_PAYMENT",
            "priority": "MEDIUM",
            "reason": "Failure appears temporary and retry may succeed.",
            "should_execute": True
        }

    # -----------------------------------
    # Card related failure
    # -----------------------------------

    if failure_reason in [
        "card_declined",
        "authentication_failed"
    ]:

        return {
            "action": "ALTERNATIVE_PAYMENT",
            "priority": "MEDIUM",
            "reason": "Current payment method failed; suggest another method.",
            "should_execute": True
        }

    # -----------------------------------
    # Checkout abandonment
    # -----------------------------------

    if failure_reason == "checkout_abandoned":

        if customer_type == "premium":

            return {
                "action": "PRIORITY_REMINDER",
                "priority": "HIGH",
                "reason": "Premium customer abandoned checkout.",
                "should_execute": True
            }

        return {
            "action": "PAYMENT_REMINDER",
            "priority": "MEDIUM",
            "reason": "Customer abandoned checkout.",
            "should_execute": True
        }

    # -----------------------------------
    # Default action
    # -----------------------------------

    return {
        "action": "MANUAL_REVIEW",
        "priority": "LOW",
        "reason": "No safe automated recovery strategy identified.",
        "should_execute": False
    }