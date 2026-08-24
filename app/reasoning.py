from fastapi import APIRouter, HTTPException

from app.database import recovery_collection


router = APIRouter(
    prefix="/api",
    tags=["AI Reasoning"]
)


@router.get("/reasoning/{transaction_id}")
def get_reasoning(transaction_id: str):

    record = recovery_collection.find_one(
        {
            "transaction_id": transaction_id
        },
        {
            "_id": 0
        }
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )


    amount = record.get("amount", 0)
    failure_reason = record.get(
        "failure_reason",
        "Unknown"
    )

    action = record.get(
        "recovery_action",
        "NO_ACTION"
    )

    executed = record.get(
        "executed",
        False
    )

    success = record.get(
        "success",
        False
    )

    recovered_amount = record.get(
        "recovered_amount",
        0
    )


    # -----------------------------------
    # Determine risk
    # -----------------------------------

    if amount >= 5000:
        risk_level = "HIGH"

    elif amount >= 2000:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"


    # -----------------------------------
    # Generate reasoning
    # -----------------------------------

    if action == "RETRY_PAYMENT":

        reason = (
            "Payment failure detected. "
            "A payment retry was selected because "
            "the transaction appears recoverable."
        )

    elif action == "SEND_REMINDER":

        reason = (
            "The transaction appears recoverable "
            "through customer follow-up, so a "
            "payment reminder was selected."
        )

    elif action == "MANUAL_REVIEW":

        reason = (
            "The transaction requires additional "
            "review before automated recovery."
        )

    else:

        reason = (
            "No automated recovery action was "
            "considered appropriate."
        )


    # -----------------------------------
    # Execution result
    # -----------------------------------

    if success:

        result = "RECOVERED"

    elif executed:

        result = "FAILED"

    else:

        result = "NOT_EXECUTED"


    return {

        "transaction_id":
            transaction_id,

        "amount":
            amount,

        "risk_level":
            risk_level,

        "problem":
            failure_reason,

        "decision":
            action,

        "reason":
            reason,

        "execution":
            executed,

        "result":
            result,

        "recovered_amount":
            recovered_amount
    }