from app.services.recovery_executor import execute_recovery


transaction = {
    "transaction_id": "TXN_TEST_100",
    "amount": 2499,
    "retry_count": 0
}


actions = [
    "RETRY_PAYMENT",
    "PAYMENT_REMINDER",
    "ALTERNATIVE_PAYMENT",
    "STOP"
]


for action in actions:

    result = execute_recovery(
        transaction,
        action
    )

    print("\nAction:", action)
    print("Executed:", result["executed"])
    print("Success:", result["success"])
    print("Recovered Amount:", result["recovered_amount"])
    print("Result:", result["result"])
    print("Message:", result["message"])