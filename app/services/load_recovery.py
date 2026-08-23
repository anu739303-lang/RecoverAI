import pandas as pd

from app.database import recovery_collection


# Load recovery results
df = pd.read_csv(
    "data/recovery_execution.csv"
)


# Convert to dictionaries
records = df.to_dict(
    orient="records"
)


# Clear previous results
recovery_collection.delete_many({})


# Insert recovery results
if records:
    recovery_collection.insert_many(records)


print(
    f"{len(records)} recovery results "
    "inserted into MongoDB."
)