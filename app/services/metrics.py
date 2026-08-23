import pandas as pd


# Load transaction data
transactions = pd.read_csv(
    "data/transactions.csv"
)

# Load execution results
execution = pd.read_csv(
    "data/recovery_execution.csv"
)


# -----------------------------------
# Revenue at risk
# -----------------------------------

risk_transactions = transactions[
    transactions["payment_status"].isin(
        ["failed", "abandoned"]
    )
]

total_revenue_at_risk = risk_transactions[
    "amount"
].sum()


# -----------------------------------
# Recovery metrics
# -----------------------------------

recovery_attempts = len(
    execution[
        execution["executed"] == True
    ]
)

successful_recoveries = len(
    execution[
        execution["success"] == True
    ]
)

failed_recoveries = len(
    execution[
        (execution["executed"] == True)
        &
        (execution["success"] == False)
    ]
)

revenue_recovered = execution[
    "recovered_amount"
].sum()


# -----------------------------------
# Recovery rate
# -----------------------------------

if total_revenue_at_risk > 0:

    revenue_recovery_rate = (
        revenue_recovered /
        total_revenue_at_risk
    ) * 100

else:

    revenue_recovery_rate = 0


# -----------------------------------
# Attempt success rate
# -----------------------------------

if recovery_attempts > 0:

    attempt_success_rate = (
        successful_recoveries /
        recovery_attempts
    ) * 100

else:

    attempt_success_rate = 0


# -----------------------------------
# Print final metrics
# -----------------------------------

print("\n========================================")
print("       RECOVERAI FINAL METRICS")
print("========================================\n")

print(
    "Revenue At Risk:",
    total_revenue_at_risk
)

print(
    "Recovery Attempts:",
    recovery_attempts
)

print(
    "Successful Recoveries:",
    successful_recoveries
)

print(
    "Failed Recoveries:",
    failed_recoveries
)

print(
    "Revenue Recovered:",
    revenue_recovered
)

print(
    "Revenue Recovery Rate:",
    round(
        revenue_recovery_rate,
        2
    ),
    "%"
)

print(
    "Attempt Success Rate:",
    round(
        attempt_success_rate,
        2
    ),
    "%"
)

print("\n========================================")