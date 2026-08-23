import csv
import random
from datetime import datetime, timedelta

random.seed(42)

NUM_TRANSACTIONS = 500

payment_methods = [
    "UPI",
    "Credit Card",
    "Debit Card",
    "Net Banking",
    "Wallet"
]

customer_types = [
    "new",
    "returning",
    "premium"
]

failure_reasons = [
    "insufficient_balance",
    "bank_timeout",
    "network_error",
    "card_declined",
    "authentication_failed"
]

subscription_statuses = [
    "active",
    "inactive",
    "not_applicable"
]

rows = []

start_date = datetime(2026, 8, 1)

for i in range(1, NUM_TRANSACTIONS + 1):

    transaction_id = f"TXN{i:04d}"
    customer_id = f"CUST{random.randint(1000, 1199)}"

    amount = random.randint(199, 15000)

    customer_type = random.choice(customer_types)
    payment_method = random.choice(payment_methods)

    status_probability = random.random()

    if status_probability < 0.55:
        payment_status = "success"
        failure_reason = "none"

    elif status_probability < 0.85:
        payment_status = "failed"
        failure_reason = random.choice(failure_reasons)

    else:
        payment_status = "abandoned"
        failure_reason = "checkout_abandoned"

    if payment_status == "success":
        retry_count = 0
    else:
        retry_count = random.randint(0, 3)

    if customer_type == "premium":
        subscription_status = random.choice(["active", "active", "inactive"])
    else:
        subscription_status = random.choice(subscription_statuses)

    days_since_last_payment = random.randint(0, 60)

    transaction_time = (
        start_date + timedelta(
            minutes=random.randint(0, 60 * 24 * 30)
        )
    )

    rows.append({
        "transaction_id": transaction_id,
        "customer_id": customer_id,
        "amount": amount,
        "payment_status": payment_status,
        "failure_reason": failure_reason,
        "retry_count": retry_count,
        "customer_type": customer_type,
        "payment_method": payment_method,
        "subscription_status": subscription_status,
        "days_since_last_payment": days_since_last_payment,
        "transaction_time": transaction_time.strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    })


file_path = "data/transactions.csv"

with open(file_path, "w", newline="", encoding="utf-8") as file:

    fieldnames = rows[0].keys()

    writer = csv.DictWriter(
        file,
        fieldnames=fieldnames
    )

    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {NUM_TRANSACTIONS} transactions.")
print(f"Saved to: {file_path}")