from fastapi import APIRouter

from app.database import transactions_collection
from app.database import recovery_collection


router = APIRouter(
    prefix="/api",
    tags=["Dashboard"]
)


@router.get("/dashboard")
def get_dashboard():

    # -----------------------------------
    # Total transactions
    # -----------------------------------

    total_transactions = transactions_collection.count_documents({})


    # -----------------------------------
    # Revenue at risk
    # -----------------------------------

    risk_pipeline = [
        {
            "$match": {
                "payment_status": {
                    "$in": ["failed", "abandoned"]
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
        revenue_at_risk = risk_result[0]["total"]
    else:
        revenue_at_risk = 0


    # -----------------------------------
    # Recovery metrics
    # -----------------------------------

    recovery_pipeline = [
        {
            "$group": {
                "_id": None,

                "revenue_recovered": {
                    "$sum": "$recovered_amount"
                },

                "successful_recoveries": {
                    "$sum": {
                        "$cond": [
                            {
                                "$eq": [
                                    "$success",
                                    True
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                "recovery_attempts": {
                    "$sum": {
                        "$cond": [
                            {
                                "$eq": [
                                    "$executed",
                                    True
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]


    recovery_result = list(
        recovery_collection.aggregate(
            recovery_pipeline
        )
    )


    if recovery_result:

        revenue_recovered = recovery_result[0][
            "revenue_recovered"
        ]

        successful_recoveries = recovery_result[0][
            "successful_recoveries"
        ]

        recovery_attempts = recovery_result[0][
            "recovery_attempts"
        ]

    else:

        revenue_recovered = 0
        successful_recoveries = 0
        recovery_attempts = 0


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
    # Final response
    # -----------------------------------

    return {

        "total_transactions":
            total_transactions,

        "revenue_at_risk":
            revenue_at_risk,

        "revenue_recovered":
            revenue_recovered,

        "recovery_rate":
            round(recovery_rate, 2),

        "recovery_attempts":
            recovery_attempts,

        "successful_recoveries":
            successful_recoveries
    }