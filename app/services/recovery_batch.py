import pandas as pd

from app.ai.recovery_agent import decide_recovery_action


# Load original transaction dataset
df = pd.read_csv("data/transactions.csv")


results = []


# Process every transaction
for _, row in df.iterrows():

    transaction = row.to_dict()

    recovery = decide_recovery_action(transaction)

    results.append({
        "transaction_id": transaction["transaction_id"],
        "customer_id": transaction["customer_id"],
        "amount": transaction["amount"],
        "payment_status": transaction["payment_status"],
        "failure_reason": transaction["failure_reason"],
        "retry_count": transaction["retry_count"],
        "recovery_action": recovery["action"],
        "priority": recovery["priority"],
        "reason": recovery["reason"],
        "should_execute": recovery["should_execute"]
    })


# Convert results into DataFrame
recovery_df = pd.DataFrame(results)


# -----------------------------------
# Recovery statistics
# -----------------------------------

total_transactions = len(recovery_df)

action_counts = recovery_df["recovery_action"].value_counts()


retry_count = len(
    recovery_df[
        recovery_df["recovery_action"] == "RETRY_PAYMENT"
    ]
)

reminder_count = len(
    recovery_df[
        recovery_df["recovery_action"].isin([
            "PAYMENT_REMINDER",
            "PRIORITY_REMINDER"
        ])
    ]
)

alternative_count = len(
    recovery_df[
        recovery_df["recovery_action"] == "ALTERNATIVE_PAYMENT"
    ]
)

stop_count = len(
    recovery_df[
        recovery_df["recovery_action"] == "STOP"
    ]
)

manual_review_count = len(
    recovery_df[
        recovery_df["recovery_action"] == "MANUAL_REVIEW"
    ]
)

no_action_count = len(
    recovery_df[
        recovery_df["recovery_action"] == "NO_ACTION"
    ]
)


# -----------------------------------
# Print results
# -----------------------------------

print("\n========== RECOVERAI RECOVERY ANALYSIS ==========\n")

print("Total Transactions:", total_transactions)

print("\nRecovery Actions:")

print("Retry Payment:", retry_count)

print("Payment Reminder:", reminder_count)

print("Alternative Payment:", alternative_count)

print("Stop:", stop_count)

print("Manual Review:", manual_review_count)

print("No Action:", no_action_count)

print("\nAction Distribution:")
print(action_counts)

print("\n==================================================\n")


# Save results
recovery_df.to_csv(
    "data/recovery_analysis.csv",
    index=False
)

print("Recovery analysis saved to data/recovery_analysis.csv")