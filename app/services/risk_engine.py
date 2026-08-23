from typing import Dict


def calculate_revenue_risk(transaction: Dict) -> Dict:
    """
    Calculate revenue risk for a single transaction.
    """

    status = transaction.get("payment_status")
    amount = float(transaction.get("amount", 0))
    retry_count = int(transaction.get("retry_count", 0))

    risk_score = 0
    reasons = []

    # 1. Failed payment
    if status == "failed":
        risk_score += 50
        reasons.append("Payment failed")

    # 2. Abandoned checkout
    elif status == "abandoned":
        risk_score += 40
        reasons.append("Checkout was abandoned")

    # 3. Multiple retries
    if retry_count >= 2:
        risk_score += 20
        reasons.append("Multiple recovery attempts already made")

    # Successful transaction = no revenue risk
    if status == "success":
        risk_score = 0
        reasons = []

    # Keep score between 0 and 100
    risk_score = min(risk_score, 100)

    # Risk level
    if risk_score >= 70:
        risk_level = "HIGH"

    elif risk_score >= 40:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    # Revenue at risk
    if status in ["failed", "abandoned"]:
        revenue_at_risk = amount
    else:
        revenue_at_risk = 0

    return {
        "transaction_id": transaction.get("transaction_id"),
        "amount": amount,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "revenue_at_risk": revenue_at_risk,
        "reasons": reasons
    }