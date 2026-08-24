from fastapi import APIRouter

from app.database import recovery_collection


router = APIRouter(
    prefix="/api",
    tags=["Manual Review"]
)


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

    return {
        "success": True,
        "count": len(records),
        "records": records
    }