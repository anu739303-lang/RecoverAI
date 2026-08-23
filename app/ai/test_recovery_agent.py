from recovery_agent import decide_recovery_action


transactions = [

    {
        "transaction_id": "TXN001",
        "amount": 2499,
        "payment_status": "failed",
        "failure_reason": "bank_timeout",
        "retry_count": 0,
        "customer_type": "returning"
    },

    {
        "transaction_id": "TXN002",
        "amount": 4999,
        "payment_status": "failed",
        "failure_reason": "insufficient_balance",
        "retry_count": 0,
        "customer_type": "returning"
    },

    {
        "transaction_id": "TXN003",
        "amount": 7999,
        "payment_status": "failed",
        "failure_reason": "card_declined",
        "retry_count": 1,
        "customer_type": "new"
    },

    {
        "transaction_id": "TXN004",
        "amount": 9999,
        "payment_status": "failed",
        "failure_reason": "bank_timeout",
        "retry_count": 3,
        "customer_type": "premium"
    },

    {
        "transaction_id": "TXN005",
        "amount": 2999,
        "payment_status": "success",
        "failure_reason": "none",
        "retry_count": 0,
        "customer_type": "returning"
    }
]


for transaction in transactions:

    result = decide_recovery_action(transaction)

    print("\nTransaction:", transaction["transaction_id"])
    print("Action:", result["action"])
    print("Priority:", result["priority"])
    print("Reason:", result["reason"])
    print("Execute:", result["should_execute"])