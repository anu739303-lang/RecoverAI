import pandas as pd

from risk_engine import calculate_revenue_risk


# Load transaction dataset
df = pd.read_csv("data/transactions.csv")


results = []

# Process every transaction
for _, row in df.iterrows():

    transaction = row.to_dict()

    result = calculate_revenue_risk(transaction)

    results.append(result)


# Convert results to DataFrame
risk_df = pd.DataFrame(results)


# -----------------------------
# Overall statistics
# -----------------------------

total_transactions = len(risk_df)

total_revenue = risk_df["amount"].sum()

total_revenue_at_risk = risk_df["revenue_at_risk"].sum()

average_risk_score = risk_df["risk_score"].mean()


# -----------------------------
# Risk distribution
# -----------------------------

high_risk = len(
    risk_df[risk_df["risk_level"] == "HIGH"]
)

medium_risk = len(
    risk_df[risk_df["risk_level"] == "MEDIUM"]
)

low_risk = len(
    risk_df[risk_df["risk_level"] == "LOW"]
)


# -----------------------------
# Print results
# -----------------------------

print("\n========== RECOVERAI BATCH ANALYSIS ==========\n")

print("Total Transactions:", total_transactions)

print("Total Revenue:", total_revenue)

print("Revenue At Risk:", total_revenue_at_risk)

print("Average Risk Score:", round(average_risk_score, 2))

print("\nRisk Distribution:")

print("HIGH:", high_risk)

print("MEDIUM:", medium_risk)

print("LOW:", low_risk)

print("\n==============================================")


risk_df.to_csv(
    "data/risk_analysis.csv",
    index=False
)

print("\nRisk analysis saved to data/risk_analysis.csv")