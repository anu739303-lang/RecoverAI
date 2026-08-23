import pandas as pd
import random

from app.services.recovery_executor import execute_recovery


# Make results reproducible
random.seed(42)


# Load recovery decisions
df = pd.read_csv(
    "data/recovery_analysis.csv"
)


results = []


for _, row in df.iterrows():

    transaction = row.to_dict()

    action = transaction["recovery_action"]

    result = execute_recovery(
        transaction,
        action
    )

    results.append({
        "transaction_id": transaction["transaction_id"],
        "customer_id": transaction["customer_id"],
        "amount": float(transaction["amount"]),
        "payment_status": transaction["payment_status"],
        "failure_reason": transaction["failure_reason"],
        "retry_count": int(transaction["retry_count"]),
        "recovery_action": action,
        "priority": transaction["priority"],
        "executed": result["executed"],
        "success": result["success"],
        "recovered_amount": result["recovered_amount"],
        "result": result["result"],
        "message": result["message"]
    })


execution_df = pd.DataFrame(results)


# -----------------------------------
# Batch metrics
# -----------------------------------

total_transactions = len(execution_df)

total_attempts = len(
    execution_df[
        execution_df["executed"] == True
    ]
)

successful_recoveries = len(
    execution_df[
        execution_df["success"] == True
    ]
)

total_recovered = execution_df[
    "recovered_amount"
].sum()


# -----------------------------------
# Print metrics
# -----------------------------------

print("\n========== RECOVERAI EXECUTION ==========\n")

print(
    "Total Transactions:",
    total_transactions
)

print(
    "Recovery Attempts:",
    total_attempts
)

print(
    "Successful Recoveries:",
    successful_recoveries
)

print(
    "Revenue Recovered:",
    total_recovered
)


if total_attempts > 0:

    recovery_success_rate = (
        successful_recoveries /
        total_attempts
    ) * 100

else:

    recovery_success_rate = 0


print(
    "Recovery Success Rate:",
    round(recovery_success_rate, 2),
    "%"
)


# -----------------------------------
# Save results
# -----------------------------------

execution_df.to_csv(
    "data/recovery_execution.csv",
    index=False
)


print(
    "\nExecution results saved to "
    "data/recovery_execution.csv"
)

print(
    "\n=========================================\n"
)