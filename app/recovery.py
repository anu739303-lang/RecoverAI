from fastapi import APIRouter, HTTPException

from app.database import recovery_collection


router = APIRouter(
    prefix="/api",
    tags=["Recovery"]
)


# -----------------------------------
# Get recovery records
# -----------------------------------

@router.get("/recovery")
def get_recovery_records():

    records = list(
        recovery_collection.find(
            {},
            {"_id": 0}
        ).limit(100)
    )

    return {
        "count": len(records),
        "records": records
    }


# -----------------------------------
# Get one recovery record
# -----------------------------------

@router.get("/recovery/{transaction_id}")
def get_recovery_record(
    transaction_id: str
):

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
            detail="Recovery record not found"
        )

    return record