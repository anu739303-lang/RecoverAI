import pandas as pd

from app.database import transactions_collection


# Load CSV
df = pd.read_csv(
    "data/transactions.csv"
)


# Convert DataFrame to dictionaries
records = df.to_dict(
    orient="records"
)


# Clear old records
transactions_collection.delete_many({})


# Insert fresh records
if records:

    transactions_collection.insert_many(
        records
    )


print(
    f"{len(records)} transactions "
    "inserted into MongoDB."
)