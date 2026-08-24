from fastapi import APIRouter

from app.database import recovery_collection


router = APIRouter(
    prefix="/api",
    tags=["Safety Rules"]
)


MAX_RETRIES = 3
HIGH_VALUE_LIMIT = 10000


@router.get("/safety/{transaction_id}")
def check_safety(transaction_id: str):

    record = recovery_collection.find_one(
        {
            "transaction_id": transaction_id
        },
        {
            "_id": 0
        }
    )

    if not record:

        return {
            "transaction_id": transaction_id,
            "found": False
        }


    amount = record.get(
        "amount",
        0
    )

    retry_count = record.get(
        "retry_count",
        0
    )

    success = record.get(
        "success",
        False
    )

    executed = record.get(
        "executed",
        False
    )


    # -----------------------------------
    # Rule 1: Already recovered
    # -----------------------------------

    if success:

        return {

            "transaction_id":
                transaction_id,

            "decision":
                "STOP",

            "reason":
                "Payment already recovered.",

            "escalation":
                False,

            "action":
                "NO_FURTHER_ACTION"
        }


    # -----------------------------------
    # Rule 2: High value transaction
    # -----------------------------------

    if amount > HIGH_VALUE_LIMIT:

        return {

            "transaction_id":
                transaction_id,

            "decision":
                "ESCALATE",

            "reason":
                "High-value transaction requires manual review.",

            "escalation":
                True,

            "action":
                "MANUAL_REVIEW"
        }


    # -----------------------------------
    # Rule 3: Retry limit
    # -----------------------------------

    if retry_count >= MAX_RETRIES:

        return {

            "transaction_id":
                transaction_id,

            "decision":
                "STOP",

            "reason":
                "Maximum retry limit reached.",

            "escalation":
                True,

            "action":
                "MANUAL_REVIEW"
        }


    # -----------------------------------
    # Rule 4: Not executed yet
    # -----------------------------------

    if not executed:

        return {

            "transaction_id":
                transaction_id,

            "decision":
                "EXECUTE",

            "reason":
                "Recovery action is allowed under current safety rules.",

            "escalation":
                False,

            "action":
                "RECOVERY_ALLOWED"
        }


    # -----------------------------------
    # Default
    # -----------------------------------

    return {

        "transaction_id":
            transaction_id,

        "decision":
            "STOP",

        "reason":
            "No further automated recovery action allowed.",

        "escalation":
            False,

        "action":
            "NO_FURTHER_ACTION"
    }