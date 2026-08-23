from risk_engine import calculate_revenue_risk


transaction = {
    "transaction_id": "TXN_TEST_003",
    "amount": 5000,
    "payment_status": "success",
    "retry_count": 0
}


result = calculate_revenue_risk(transaction)

print(result)