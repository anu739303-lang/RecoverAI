from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from app.database import recovery_collection


router = APIRouter(
    prefix="/api",
    tags=["Manual Review"]
)


# =========================================================
# DETERMINE EXCEPTION TYPE
# =========================================================

def get_exception_type(record):

    # Recovery was attempted but failed
    if (
        record.get("executed") is True
        and record.get("success") is False
    ):
        return "RECOVERY_FAILURE"

    # Action was not executed
    if record.get("executed") is False:

        # No automatic action was selected
        if record.get("recovery_action") == "NO_ACTION":
            return "AUTOMATION_SCOPE_EXCEPTION"

        return "NOT_EXECUTED"

    return "UNKNOWN_EXCEPTION"


# =========================================================
# DETERMINE REVIEW REASON
# =========================================================

def get_review_reason(record, exception_type):

    if exception_type == "RECOVERY_FAILURE":
        return (
            "Automatic recovery attempt failed "
            "and requires human review."
        )

    if exception_type == "AUTOMATION_SCOPE_EXCEPTION":
        return (
            "Transaction is outside automatic "
            "recovery scope."
        )

    if exception_type == "NOT_EXECUTED":
        return (
            "Recovery action was not executed "
            "and requires human review."
        )

    return "Transaction requires manual review."


# =========================================================
# GET MANUAL REVIEW QUEUE
# =========================================================

@router.get("/manual-review")
def get_manual_review():

    records = list(
        recovery_collection.find(
            {
                "$or": [
                    {
                        "success": False,
                        "executed": True
                    },
                    {
                        "executed": False
                    }
                ]
            },
            {
                "_id": 0
            }
        )
    )

    # Add UI-friendly review information
    for record in records:

        exception_type = get_exception_type(record)

        record["exception_type"] = exception_type

        record["review_reason"] = get_review_reason(
            record,
            exception_type
        )

        # Keep existing priority from database.
        # Only calculate one if it does not exist.
        if not record.get("priority"):

            if exception_type == "RECOVERY_FAILURE":
                record["priority"] = "HIGH"

            elif exception_type == "AUTOMATION_SCOPE_EXCEPTION":
                record["priority"] = "LOW"

            else:
                record["priority"] = "MEDIUM"

        # If reviewer has not taken any action,
        # show it as PENDING.
        if not record.get("review_status"):
            record["review_status"] = "PENDING"

    return {
        "success": True,
        "count": len(records),

        "summary": {

            "failed_recoveries": sum(
                1
                for record in records
                if record.get("executed") is True
                and record.get("success") is False
            ),

            "not_executed": sum(
                1
                for record in records
                if record.get("executed") is False
            ),

            "total_exceptions": len(records),

            "pending": sum(
                1
                for record in records
                if record.get(
                    "review_status",
                    "PENDING"
                ) == "PENDING"
            ),

            "approved": sum(
                1
                for record in records
                if record.get("review_status")
                == "APPROVED"
            ),

            "rejected": sum(
                1
                for record in records
                if record.get("review_status")
                == "REJECTED"
            ),

            "escalated": sum(
                1
                for record in records
                if record.get("review_status")
                == "ESCALATED"
            )
        },

        "records": records
    }


# =========================================================
# FIND TRANSACTION
# =========================================================

def find_transaction(transaction_id):

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
            detail="Transaction not found."
        )

    return record


# =========================================================
# ADD REVIEW HISTORY
# =========================================================

def add_review_history(
    transaction_id,
    action,
    previous_status,
    new_status
):

    history_entry = {
        "action": action,
        "previous_status": previous_status,
        "new_status": new_status,
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat()
    }

    result = recovery_collection.update_one(
        {
            "transaction_id": transaction_id
        },
        {
            "$set": {
                "review_status": new_status,
                "review_action": action
            },
            "$push": {
                "review_history": history_entry
            }
        }
    )

    return result


# =========================================================
# GET REVIEW HISTORY
# =========================================================

@router.get(
    "/manual-review/{transaction_id}/history"
)
def get_review_history(transaction_id: str):

    record = find_transaction(transaction_id)

    history = record.get(
        "review_history",
        []
    )

    return {
        "success": True,
        "transaction_id": transaction_id,
        "current_status": record.get(
            "review_status",
            "PENDING"
        ),
        "history": history
    }


# =========================================================
# APPROVE MANUAL REVIEW
# =========================================================

@router.post(
    "/manual-review/{transaction_id}/approve"
)
def approve_manual_review(
    transaction_id: str
):

    # Make sure transaction exists
    record = find_transaction(
        transaction_id
    )

    previous_status = record.get(
        "review_status",
        "PENDING"
    )

    result = add_review_history(
        transaction_id=transaction_id,
        action="APPROVE",
        previous_status=previous_status,
        new_status="APPROVED"
    )

    if result.modified_count == 0:

        updated_record = find_transaction(
            transaction_id
        )

        if updated_record.get(
            "review_status"
        ) != "APPROVED":

            raise HTTPException(
                status_code=500,
                detail="Unable to approve transaction."
            )

    updated_record = find_transaction(
        transaction_id
    )

    return {
        "success": True,
        "message": "Transaction approved successfully.",
        "transaction_id": transaction_id,
        "review_status": updated_record.get(
            "review_status"
        ),
        "review_action": updated_record.get(
            "review_action"
        )
    }


# =========================================================
# REJECT MANUAL REVIEW
# =========================================================

@router.post(
    "/manual-review/{transaction_id}/reject"
)
def reject_manual_review(
    transaction_id: str
):

    # Make sure transaction exists
    record = find_transaction(
        transaction_id
    )

    previous_status = record.get(
        "review_status",
        "PENDING"
    )

    result = add_review_history(
        transaction_id=transaction_id,
        action="REJECT",
        previous_status=previous_status,
        new_status="REJECTED"
    )

    if result.modified_count == 0:

        updated_record = find_transaction(
            transaction_id
        )

        if updated_record.get(
            "review_status"
        ) != "REJECTED":

            raise HTTPException(
                status_code=500,
                detail="Unable to reject transaction."
            )

    updated_record = find_transaction(
        transaction_id
    )

    return {
        "success": True,
        "message": "Transaction rejected successfully.",
        "transaction_id": transaction_id,
        "review_status": updated_record.get(
            "review_status"
        ),
        "review_action": updated_record.get(
            "review_action"
        )
    }


# =========================================================
# ESCALATE MANUAL REVIEW
# =========================================================

@router.post(
    "/manual-review/{transaction_id}/escalate"
)
def escalate_manual_review(
    transaction_id: str
):

    # Make sure transaction exists
    record = find_transaction(
        transaction_id
    )

    previous_status = record.get(
        "review_status",
        "PENDING"
    )

    result = add_review_history(
        transaction_id=transaction_id,
        action="ESCALATE",
        previous_status=previous_status,
        new_status="ESCALATED"
    )

    if result.modified_count == 0:

        updated_record = find_transaction(
            transaction_id
        )

        if updated_record.get(
            "review_status"
        ) != "ESCALATED":

            raise HTTPException(
                status_code=500,
                detail="Unable to escalate transaction."
            )

    updated_record = find_transaction(
        transaction_id
    )

    return {
        "success": True,
        "message": "Transaction escalated successfully.",
        "transaction_id": transaction_id,
        "review_status": updated_record.get(
            "review_status"
        ),
        "review_action": updated_record.get(
            "review_action"
        )
    }