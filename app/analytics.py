from fastapi import APIRouter

from app.database import transactions_collection
from app.database import recovery_collection


router = APIRouter(
    prefix="/api",
    tags=["Analytics"]
)


@router.get("/analytics")
def get_analytics():

    # -----------------------------------
    # Total transactions
    # -----------------------------------

    total_transactions = (
        transactions_collection.count_documents({})
    )


    # -----------------------------------
    # Total recovery records
    # -----------------------------------

    total_recovery_records = (
        recovery_collection.count_documents({})
    )


    # -----------------------------------
    # Recovery attempts
    # -----------------------------------

    recovery_attempts = (
        recovery_collection.count_documents(
            {
                "executed": True
            }
        )
    )


    # -----------------------------------
    # Successful recoveries
    # -----------------------------------

    successful_recoveries = (
        recovery_collection.count_documents(
            {
                "success": True
            }
        )
    )


    # -----------------------------------
    # Failed recoveries
    # -----------------------------------

    failed_recoveries = (
        recovery_collection.count_documents(
            {
                "executed": True,
                "success": False
            }
        )
    )


    # -----------------------------------
    # Not executed
    # -----------------------------------

    not_executed = (
        recovery_collection.count_documents(
            {
                "executed": False
            }
        )
    )


    # -----------------------------------
    # Revenue recovered
    # -----------------------------------

    recovered_pipeline = [

        {
            "$group": {
                "_id": None,

                "total": {
                    "$sum": "$recovered_amount"
                }
            }
        }

    ]

    recovered_result = list(
        recovery_collection.aggregate(
            recovered_pipeline
        )
    )


    if recovered_result:
        revenue_recovered = (
            recovered_result[0]["total"]
        )
    else:
        revenue_recovered = 0


    # -----------------------------------
    # Revenue at risk
    # -----------------------------------

    risk_pipeline = [

        {
            "$match": {
                "payment_status": {
                    "$in": [
                        "failed",
                        "abandoned"
                    ]
                }
            }
        },

        {
            "$group": {
                "_id": None,

                "total": {
                    "$sum": "$amount"
                }
            }
        }

    ]

    risk_result = list(
        transactions_collection.aggregate(
            risk_pipeline
        )
    )


    if risk_result:
        revenue_at_risk = (
            risk_result[0]["total"]
        )
    else:
        revenue_at_risk = 0


    # -----------------------------------
    # Recovery rate
    # -----------------------------------

    if revenue_at_risk > 0:

        recovery_rate = (
            revenue_recovered /
            revenue_at_risk
        ) * 100

    else:

        recovery_rate = 0


    # -----------------------------------
    # Average transaction value
    # -----------------------------------

    average_pipeline = [

        {
            "$group": {
                "_id": None,

                "average": {
                    "$avg": "$amount"
                }
            }
        }

    ]

    average_result = list(
        transactions_collection.aggregate(
            average_pipeline
        )
    )


    if average_result:

        average_transaction_value = (
            average_result[0]["average"]
        )

    else:

        average_transaction_value = 0


    # -----------------------------------
    # Recovery action distribution
    # -----------------------------------

    action_pipeline = [

        {
            "$group": {

                "_id": "$recovery_action",

                "count": {
                    "$sum": 1
                },

                "recovered_amount": {
                    "$sum": "$recovered_amount"
                }

            }
        },

        {
            "$sort": {
                "count": -1
            }
        }

    ]


    action_result = list(
        recovery_collection.aggregate(
            action_pipeline
        )
    )


    action_distribution = []

    for item in action_result:

        action_distribution.append(
            {
                "action": item["_id"],
                "count": item["count"],
                "recovered_amount": item[
                    "recovered_amount"
                ]
            }
        )


    # -----------------------------------
    # Final response
    # -----------------------------------

    return {

        "batch": {

            "total_transactions":
                total_transactions,

            "total_recovery_records":
                total_recovery_records

        },

        "financial": {

            "revenue_at_risk":
                round(revenue_at_risk, 2),

            "revenue_recovered":
                round(revenue_recovered, 2),

            "recovery_rate":
                round(recovery_rate, 2),

            "average_transaction_value":
                round(
                    average_transaction_value,
                    2
                )

        },

        "execution": {

            "recovery_attempts":
                recovery_attempts,

            "successful_recoveries":
                successful_recoveries,

            "failed_recoveries":
                failed_recoveries,

            "not_executed":
                not_executed

        },

        "action_distribution":
            action_distribution
    }