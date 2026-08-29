import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./Dashboard.css";

function Dashboard() {
  // ==========================================
  // STATE
  // ==========================================

  const [dashboard, setDashboard] = useState(null);
  const [recovery, setRecovery] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // AI Decision
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reasoningLoading, setReasoningLoading] = useState(false);

  // Safety
  const [safetyResult, setSafetyResult] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(false);

  // Manual Review Queue
  const [manualReview, setManualReview] = useState([]);
  const [manualReviewLoading, setManualReviewLoading] = useState(false);

  // Review Action
  const [reviewActionLoading, setReviewActionLoading] = useState(null);

  // Review History
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewHistoryLoading, setReviewHistoryLoading] =
    useState(false);

  // Main loading/error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // API BASE URL
  // ==========================================

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  // ==========================================
  // FETCH ALL DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardResponse,
          recoveryResponse,
          analyticsResponse,
          manualReviewResponse,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/dashboard`),
          axios.get(`${API_BASE_URL}/recovery`),
          axios.get(`${API_BASE_URL}/analytics`),
          axios.get(`${API_BASE_URL}/manual-review`),
        ]);

        setDashboard(dashboardResponse.data);

        setRecovery(
          recoveryResponse.data?.records || []
        );

        setAnalytics(
          analyticsResponse.data
        );

        setManualReview(
          manualReviewResponse.data?.records || []
        );
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ==========================================
  // VIEW AI REASONING
  // ==========================================

  const viewReasoning = async (transactionId) => {
    try {
      setReasoningLoading(true);

      // Clear previous data
      setSafetyResult(null);
      setReviewHistory([]);

      // Get AI reasoning
      const response = await axios.get(
        `${API_BASE_URL}/reasoning/${transactionId}`
      );

      setSelectedTransaction(
        response.data
      );

      // Get Review History
      await fetchReviewHistory(transactionId);
    } catch (err) {
      console.error(
        "Reasoning error:",
        err
      );

      alert(
        "Unable to load AI reasoning."
      );
    } finally {
      setReasoningLoading(false);
    }
  };

  // ==========================================
  // FETCH REVIEW HISTORY
  // ==========================================

  const fetchReviewHistory = async (
    transactionId
  ) => {
    try {
      setReviewHistoryLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/manual-review/${transactionId}/history`
      );

      setReviewHistory(
        response.data?.history || []
      );
    } catch (error) {
      console.error(
        "Review History Error:",
        error
      );

      setReviewHistory([]);
    } finally {
      setReviewHistoryLoading(false);
    }
  };

  // ==========================================
  // CLOSE AI DECISION
  // ==========================================

  const closeDecision = () => {
    setSelectedTransaction(null);
    setSafetyResult(null);
    setReviewHistory([]);
  };

  // ==========================================
  // CHECK SAFETY
  // ==========================================

  const checkSafety = async (
    transactionId
  ) => {
    try {
      setSafetyLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/safety/${transactionId}`
      );

      setSafetyResult(
        response.data
      );
    } catch (err) {
      console.error(
        "Safety check error:",
        err
      );

      alert(
        "Unable to load safety decision."
      );
    } finally {
      setSafetyLoading(false);
    }
  };

  // ==========================================
  // REFRESH MANUAL REVIEW QUEUE
  // ==========================================

  const fetchManualReview = async () => {
    try {
      setManualReviewLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/manual-review`
      );

      console.log(
        "Manual Review Refresh Response:",
        response.data
      );

      const records =
        response.data?.records || [];

      setManualReview(records);
    } catch (err) {
      console.error(
        "Manual Review Refresh Error:",
        err
      );

      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to refresh manual review queue.";

      alert(message);
    } finally {
      setManualReviewLoading(false);
    }
  };

  // ==========================================
  // MANUAL REVIEW ACTION
  // APPROVE / REJECT / ESCALATE
  // ==========================================

  const handleReviewAction = async (
    transactionId,
    action
  ) => {
    try {
      const loadingKey =
        `${transactionId}-${action}`;

      setReviewActionLoading(
        loadingKey
      );

      let endpoint = "";

      if (action === "approve") {
        endpoint =
          `${API_BASE_URL}/manual-review/${transactionId}/approve`;
      } else if (action === "reject") {
        endpoint =
          `${API_BASE_URL}/manual-review/${transactionId}/reject`;
      } else if (action === "escalate") {
        endpoint =
          `${API_BASE_URL}/manual-review/${transactionId}/escalate`;
      } else {
        throw new Error(
          "Invalid review action."
        );
      }

      const response =
        await axios.post(endpoint);

      console.log(
        "Review Action Response:",
        response.data
      );

      const backendStatus =
        response.data?.review_status ||
        response.data?.status ||
        action.toUpperCase();

      // Update row immediately
      setManualReview(
        (previousRecords) =>
          previousRecords.map(
            (item) =>
              item.transaction_id ===
              transactionId
                ? {
                    ...item,
                    review_status:
                      backendStatus,
                    review_action:
                      action.toUpperCase(),
                  }
                : item
          )
      );

      // Update selected transaction if open
      if (
        selectedTransaction?.transaction_id ===
        transactionId
      ) {
        setSelectedTransaction(
          (previous) =>
            previous
              ? {
                  ...previous,
                  review_status:
                    backendStatus,
                  review_action:
                    action.toUpperCase(),
                }
              : previous
        );

        // Refresh history
        await fetchReviewHistory(
          transactionId
        );
      }

      // Success message
      if (action === "approve") {
        alert(
          "Transaction approved successfully."
        );
      } else if (action === "reject") {
        alert(
          "Transaction rejected successfully."
        );
      } else if (action === "escalate") {
        alert(
          "Transaction escalated successfully."
        );
      }
    } catch (err) {
      console.error(
        "Review action error:",
        err
      );

      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to update manual review status.";

      alert(message);
    } finally {
      setReviewActionLoading(null);
    }
  };

  // ==========================================
  // RECOVERY OUTCOME DATA
  // ==========================================

  const outcomeData = [
    {
      name: "Recovered",
      value: recovery.filter(
        (item) =>
          item.success === true
      ).length,
    },

    {
      name: "Failed",
      value: recovery.filter(
        (item) =>
          item.executed === true &&
          item.success === false
      ).length,
    },

    {
      name: "Not Executed",
      value: recovery.filter(
        (item) =>
          item.executed === false
      ).length,
    },
  ];

  // ==========================================
  // RECOVERY ACTION DATA
  // ==========================================

  const actionCounts = {};

  recovery.forEach((item) => {
    const action =
      item.recovery_action ||
      "Unknown";

    actionCounts[action] =
      (actionCounts[action] || 0) + 1;
  });

  const actionData =
    Object.entries(actionCounts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

  // ==========================================
  // MANUAL REVIEW PRIORITY COUNTS
  // ==========================================

  const highPriorityCount =
    manualReview.filter(
      (item) =>
        String(
          item.priority || ""
        ).toUpperCase() === "HIGH"
    ).length;

  const mediumPriorityCount =
    manualReview.filter(
      (item) =>
        String(
          item.priority || ""
        ).toUpperCase() === "MEDIUM"
    ).length;

  const lowPriorityCount =
    manualReview.filter(
      (item) =>
        String(
          item.priority || ""
        ).toUpperCase() === "LOW"
    ).length;

  // ==========================================
  // REVIEW ANALYTICS
  // ==========================================

  const pendingReviewCount =
    manualReview.filter(
      (item) =>
        String(
          item.review_status || "PENDING"
        ).toUpperCase() === "PENDING"
    ).length;

  const approvedReviewCount =
    manualReview.filter(
      (item) =>
        String(
          item.review_status || ""
        ).toUpperCase() === "APPROVED"
    ).length;

  const rejectedReviewCount =
    manualReview.filter(
      (item) =>
        String(
          item.review_status || ""
        ).toUpperCase() === "REJECTED"
    ).length;

  const escalatedReviewCount =
    manualReview.filter(
      (item) =>
        String(
          item.review_status || ""
        ).toUpperCase() === "ESCALATED"
    ).length;

  const reviewOutcomeData = [
    {
      name: "Pending",
      value: pendingReviewCount,
    },
    {
      name: "Approved",
      value: approvedReviewCount,
    },
    {
      name: "Rejected",
      value: rejectedReviewCount,
    },
    {
      name: "Escalated",
      value: escalatedReviewCount,
    },
  ];

  // ==========================================
  // AI DECISION PANEL
  // ==========================================

  const renderDecisionPanel = () => {
    if (!selectedTransaction) {
      return null;
    }

    return (
      <div className="inline-decision-panel">

        {/* HEADER */}

        <div className="reasoning-header">

          <div>
            <h2>
              AI Decision & Audit Trail
            </h2>

            <p>
              Explainable recovery decision for{" "}
              <strong>
                {
                  selectedTransaction.transaction_id
                }
              </strong>
            </p>
          </div>

          <button
            className="close-btn"
            onClick={closeDecision}
          >
            Close
          </button>

        </div>

        {/* REASONING GRID */}

        <div className="reasoning-grid">

          <div className="reasoning-item">
            <span>
              Transaction
            </span>

            <strong>
              {
                selectedTransaction.transaction_id ||
                "-"
              }
            </strong>
          </div>

          <div className="reasoning-item">
            <span>
              Amount
            </span>

            <strong>
              ₹
              {Number(
                selectedTransaction.amount || 0
              ).toLocaleString()}
            </strong>
          </div>

          <div className="reasoning-item">
            <span>
              Risk Level
            </span>

            <strong className="risk-value">
              {
                selectedTransaction.risk_level ||
                "-"
              }
            </strong>
          </div>

          <div className="reasoning-item">
            <span>
              AI Decision
            </span>

            <strong>
              {
                selectedTransaction.decision ||
                "-"
              }
            </strong>
          </div>

          <div className="reasoning-item">
            <span>
              Execution
            </span>

            <strong>
              {
                selectedTransaction.execution
                  ? "EXECUTED"
                  : "NOT EXECUTED"
              }
            </strong>
          </div>

          <div className="reasoning-item">
            <span>
              Result
            </span>

            <strong>
              {
                selectedTransaction.result ||
                "-"
              }
            </strong>
          </div>

          <div className="reasoning-item">
            <span>
              Recovered Amount
            </span>

            <strong>
              ₹
              {Number(
                selectedTransaction.recovered_amount ||
                0
              ).toLocaleString()}
            </strong>
          </div>

        </div>

        {/* AI EXPLANATION */}

        <div className="reasoning-explanation">

          <h3>
            Why did the agent choose this?
          </h3>

          <p>
            {
              selectedTransaction.reason ||
              "-"
            }
          </p>

        </div>

        {/* AUDIT TRAIL */}

        <div className="audit-box">

          <div>
            <span>
              Problem Detected
            </span>

            <p>
              {
                selectedTransaction.problem ||
                "-"
              }
            </p>
          </div>

          <div>
            <span>
              Decision
            </span>

            <p>
              {
                selectedTransaction.decision ||
                "-"
              }
            </p>
          </div>

          <div>
            <span>
              Execution Result
            </span>

            <p>
              {
                selectedTransaction.result ||
                "-"
              }
            </p>
          </div>

        </div>

        {/* SAFETY CHECK */}

        <div className="safety-action">

          <button
            className="safety-btn"
            onClick={() =>
              checkSafety(
                selectedTransaction.transaction_id
              )
            }
            disabled={safetyLoading}
          >
            {safetyLoading
              ? "Checking Safety..."
              : "Run Safety Check"}
          </button>

        </div>

        {/* SAFETY RESULT */}

        {safetyResult && (
          <div className="safety-result">

            <h3>
              Safety & Escalation Decision
            </h3>

            <div className="safety-grid">

              <div>
                <span>
                  Decision
                </span>

                <strong>
                  {
                    safetyResult.decision ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Action
                </span>

                <strong>
                  {
                    safetyResult.action ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Escalation
                </span>

                <strong>
                  {
                    safetyResult.escalation
                      ? "REQUIRED"
                      : "NOT REQUIRED"
                  }
                </strong>
              </div>

            </div>

            <div className="safety-reason">

              <span>
                Safety Reason
              </span>

              <p>
                {
                  safetyResult.reason ||
                  "-"
                }
              </p>

            </div>

          </div>
        )}

        {/* ======================================
            REVIEW HISTORY
        ====================================== */}

        <div className="review-history">

          <div className="review-history-header">

            <div>
              <h3>
                Review History
              </h3>

              <p>
                Human review actions and status changes
              </p>
            </div>

          </div>

          {reviewHistoryLoading ? (

            <div className="decision-loading">
              Loading review history...
            </div>

          ) : reviewHistory.length === 0 ? (

            <div className="history-empty">
              <p>
                No review actions taken yet.
              </p>
            </div>

          ) : (

            <div className="history-list">

              {reviewHistory
                .slice()
                .reverse()
                .map(
                  (history, index) => (

                    <div
                      className="history-item"
                      key={index}
                    >

                      <div className="history-action">
                        <strong>
                          {
                            history.action ||
                            "REVIEW"
                          }
                        </strong>
                      </div>

                      <div className="history-status">

                        <span>
                          {
                            history.previous_status ||
                            "PENDING"
                          }
                        </span>

                        <span>
                          →
                        </span>

                        <span>
                          {
                            history.new_status ||
                            "-"
                          }
                        </span>

                      </div>

                      <div className="history-time">

                        {history.timestamp
                          ? new Date(
                              history.timestamp
                            ).toLocaleString()
                          : "-"}

                      </div>

                    </div>

                  )
                )}

            </div>

          )}

        </div>

      </div>
    );
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="loading">
        Loading RecoverAI...
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div className="dashboard">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="dashboard-header">

        <div>
          <h1>
            RecoverAI
          </h1>

          <p>
            AI Revenue Recovery Platform
          </p>
        </div>

        <div className="status">
          ● System Operational
        </div>

      </header>

      {/* ======================================
          KPI CARDS
      ====================================== */}

      <section className="stats-grid">

        <div className="stat-card">
          <span>
            Revenue At Risk
          </span>

          <h2>
            ₹
            {Number(
              dashboard?.revenue_at_risk || 0
            ).toLocaleString()}
          </h2>
        </div>

        <div className="stat-card">
          <span>
            Revenue Recovered
          </span>

          <h2>
            ₹
            {Number(
              dashboard?.revenue_recovered || 0
            ).toLocaleString()}
          </h2>
        </div>

        <div className="stat-card">
          <span>
            Recovery Rate
          </span>

          <h2>
            {
              dashboard?.recovery_rate ||
              0
            }%
          </h2>
        </div>

        <div className="stat-card">
          <span>
            Recovery Attempts
          </span>

          <h2>
            {
              dashboard?.recovery_attempts ||
              0
            }
          </h2>
        </div>

        <div className="stat-card">
          <span>
            Successful Recoveries
          </span>

          <h2>
            {
              dashboard?.successful_recoveries ||
              0
            }
          </h2>
        </div>

      </section>

      {/* ======================================
          BATCH PERFORMANCE
      ====================================== */}

      <section className="batch-section">

        <div className="batch-header">

          <div>
            <h2>
              Batch Performance
            </h2>

            <p>
              Measured results across the complete
              500-record recovery batch
            </p>
          </div>

          <div className="batch-badge">
            {
              analytics?.batch
                ?.total_transactions ||
              0
            } Records
          </div>

        </div>

        <div className="batch-grid">

          <div className="batch-card">
            <span>
              Records Processed
            </span>

            <strong>
              {
                analytics?.batch
                  ?.total_transactions ||
                0
              }
            </strong>
          </div>

          <div className="batch-card">
            <span>
              Recovery Decisions
            </span>

            <strong>
              {
                analytics?.batch
                  ?.total_recovery_records ||
                0
              }
            </strong>
          </div>

          <div className="batch-card">
            <span>
              Recovery Attempts
            </span>

            <strong>
              {
                analytics?.execution
                  ?.recovery_attempts ||
                0
              }
            </strong>
          </div>

          <div className="batch-card">
            <span>
              Successful Recoveries
            </span>

            <strong>
              {
                analytics?.execution
                  ?.successful_recoveries ||
                0
              }
            </strong>
          </div>

          <div className="batch-card">
            <span>
              Failed Recoveries
            </span>

            <strong>
              {
                analytics?.execution
                  ?.failed_recoveries ||
                0
              }
            </strong>
          </div>

          <div className="batch-card">
            <span>
              Not Executed
            </span>

            <strong>
              {
                analytics?.execution
                  ?.not_executed ||
                0
              }
            </strong>
          </div>

        </div>

      </section>

      {/* ======================================
          FINANCIAL EVIDENCE
      ====================================== */}

      <section className="financial-section">

        <div className="financial-header">

          <div>
            <h2>
              Revenue Recovery Evidence
            </h2>

            <p>
              Measured financial impact from the
              recovery agent
            </p>
          </div>

        </div>

        <div className="financial-grid">

          <div className="financial-card">
            <span>
              Revenue At Risk
            </span>

            <strong>
              ₹
              {Number(
                analytics?.financial
                  ?.revenue_at_risk ||
                0
              ).toLocaleString()}
            </strong>
          </div>

          <div className="financial-card">
            <span>
              Revenue Recovered
            </span>

            <strong>
              ₹
              {Number(
                analytics?.financial
                  ?.revenue_recovered ||
                0
              ).toLocaleString()}
            </strong>
          </div>

          <div className="financial-card">
            <span>
              Recovery Rate
            </span>

            <strong>
              {
                analytics?.financial
                  ?.recovery_rate ||
                0
              }%
            </strong>
          </div>

          <div className="financial-card">
            <span>
              Average Transaction
            </span>

            <strong>
              ₹
              {Number(
                analytics?.financial
                  ?.average_transaction_value ||
                0
              ).toLocaleString()}
            </strong>
          </div>

        </div>

      </section>

      {/* ======================================
          ANALYTICS CHARTS
      ====================================== */}

      <section className="charts-grid">

        {/* RECOVERY OUTCOMES */}

        <div className="chart-card">

          <div className="chart-header">
            <h2>
              Recovery Outcomes
            </h2>

            <p>
              Batch execution results
            </p>
          </div>

          <div className="chart">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <PieChart>

                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >

                  {outcomeData.map(
                    (_, index) => (
                      <Cell
                        key={
                          `outcome-${index}`
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* RECOVERY ACTIONS */}

        <div className="chart-card">

          <div className="chart-header">

            <h2>
              Recovery Actions
            </h2>

            <p>
              AI intervention distribution
            </p>

          </div>

          <div className="chart">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <PieChart>

                <Pie
                  data={actionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >

                  {actionData.map(
                    (_, index) => (
                      <Cell
                        key={
                          `action-${index}`
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

      </section>

      {/* ======================================
          RECOVERY ACTIVITY
      ====================================== */}

      <section className="table-section">

        <div className="section-header">

          <div>
            <h2>
              Recovery Activity
            </h2>

            <p>
              AI-driven recovery decisions
            </p>
          </div>

        </div>

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>
                  Transaction
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Failure
                </th>

                <th>
                  Action
                </th>

                <th>
                  Status
                </th>

                <th>
                  Recovered
                </th>

                <th>
                  AI Decision
                </th>
              </tr>

            </thead>

            <tbody>

              {recovery.map(
                (item) => (

                  <React.Fragment
                    key={
                      item.transaction_id
                    }
                  >

                    <tr>

                      <td>
                        {
                          item.transaction_id
                        }
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.amount || 0
                        ).toLocaleString()}
                      </td>

                      <td>
                        {
                          item.failure_reason ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          item.recovery_action ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          item.success
                            ? "RECOVERED"
                            : item.executed
                            ? "FAILED"
                            : "NOT EXECUTED"
                        }
                      </td>

                      <td>
                        ₹
                        {Number(
                          item.recovered_amount ||
                          0
                        ).toLocaleString()}
                      </td>

                      <td>

                        <button
                          className="reasoning-btn"
                          onClick={() =>
                            selectedTransaction?.transaction_id ===
                            item.transaction_id
                              ? closeDecision()
                              : viewReasoning(
                                  item.transaction_id
                                )
                          }
                        >

                          {reasoningLoading &&
                          selectedTransaction?.transaction_id ===
                            item.transaction_id
                            ? "Loading..."
                            : selectedTransaction?.transaction_id ===
                              item.transaction_id
                            ? "Decision Open"
                            : "View Decision"}

                        </button>

                      </td>

                    </tr>

                    {selectedTransaction?.transaction_id ===
                      item.transaction_id && (

                      <tr>

                        <td
                          colSpan="7"
                          className="inline-decision-cell"
                        >

                          {reasoningLoading ? (

                            <div className="decision-loading">
                              Loading AI decision...
                            </div>

                          ) : (

                            renderDecisionPanel()

                          )}

                        </td>

                      </tr>

                    )}

                  </React.Fragment>

                )
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ======================================
          REVIEW ANALYTICS
      ====================================== */}

      <section className="review-analytics-section">

        <div className="review-analytics-header">

          <div>
            <h2>
              Review Analytics
            </h2>

            <p>
              Human review outcomes across exception transactions
            </p>
          </div>

          <div className="review-analytics-total">
            {manualReview.length} Total
          </div>

        </div>

        {/* ANALYTICS CARDS */}

        <div className="review-analytics-grid">

          <div className="review-analytics-card review-analytics-pending">

            <span>
              Pending Reviews
            </span>

            <strong>
              {pendingReviewCount}
            </strong>

          </div>

          <div className="review-analytics-card review-analytics-approved">

            <span>
              Approved
            </span>

            <strong>
              {approvedReviewCount}
            </strong>

          </div>

          <div className="review-analytics-card review-analytics-rejected">

            <span>
              Rejected
            </span>

            <strong>
              {rejectedReviewCount}
            </strong>

          </div>

          <div className="review-analytics-card review-analytics-escalated">

            <span>
              Escalated
            </span>

            <strong>
              {escalatedReviewCount}
            </strong>

          </div>

        </div>

        {/* REVIEW OUTCOME CHART */}

        <div className="review-analytics-chart-card">

          <div className="chart-header">

            <h2>
              Review Outcomes
            </h2>

            <p>
              Distribution of human review decisions
            </p>

          </div>

          <div className="chart">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <PieChart>

                <Pie
                  data={reviewOutcomeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >

                  {reviewOutcomeData.map(
                    (_, index) => (
                      <Cell
                        key={
                          `review-outcome-${index}`
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

      </section>

      {/* ======================================
          MANUAL REVIEW QUEUE
      ====================================== */}

      <section className="manual-review-section">

        <div className="manual-review-header">

          <div>
            <h2>
              Manual Review Queue
            </h2>

            <p>
              Transactions requiring human review
            </p>
          </div>

          <div className="manual-review-count">
            {manualReview.length} Exceptions
          </div>

        </div>

        {/* PRIORITY CARDS */}

        <div className="manual-review-priority-grid">

          <div className="priority-card priority-card-high">

            <span>
              HIGH PRIORITY
            </span>

            <strong>
              {highPriorityCount}
            </strong>

          </div>

          <div className="priority-card priority-card-medium">

            <span>
              MEDIUM PRIORITY
            </span>

            <strong>
              {mediumPriorityCount}
            </strong>

          </div>

          <div className="priority-card priority-card-low">

            <span>
              LOW PRIORITY
            </span>

            <strong>
              {lowPriorityCount}
            </strong>

          </div>

        </div>

        {/* REFRESH */}

        <div className="manual-review-actions">

          <button
            className="safety-btn"
            onClick={fetchManualReview}
            disabled={manualReviewLoading}
          >

            {manualReviewLoading
              ? "Refreshing..."
              : "Refresh Queue"}

          </button>

        </div>

        {/* MANUAL REVIEW TABLE */}

        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>
                  Transaction
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Failure
                </th>

                <th>
                  Action
                </th>

                <th>
                  Priority
                </th>

                <th>
                  Status
                </th>

                <th>
                  Review Reason
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {manualReview.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                    }}
                  >
                    No exceptions require manual review.
                  </td>

                </tr>

              ) : (

                manualReview.map(
                  (item) => {

                    const currentStatus =
                      item.review_status ||
                      "PENDING";

                    const approveLoading =
                      reviewActionLoading ===
                      `${item.transaction_id}-approve`;

                    const rejectLoading =
                      reviewActionLoading ===
                      `${item.transaction_id}-reject`;

                    const escalateLoading =
                      reviewActionLoading ===
                      `${item.transaction_id}-escalate`;

                    const isActionInProgress =
                      reviewActionLoading !== null;

                    return (

                      <React.Fragment
                        key={
                          item.transaction_id
                        }
                      >

                        {/* MANUAL REVIEW ROW */}

                        <tr>

                          <td>
                            {
                              item.transaction_id
                            }
                          </td>

                          <td>
                            ₹
                            {Number(
                              item.amount || 0
                            ).toLocaleString()}
                          </td>

                          <td>
                            {
                              item.failure_reason ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              item.recovery_action ||
                              "-"
                            }
                          </td>

                          {/* PRIORITY */}

                          <td>

                            <span
                              className={`priority-badge priority-${String(
                                item.priority ||
                                "medium"
                              ).toLowerCase()}`}
                            >
                              {
                                item.priority ||
                                "MEDIUM"
                              }
                            </span>

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`review-status review-status-${String(
                                currentStatus
                              ).toLowerCase()}`}
                            >
                              {currentStatus}
                            </span>

                          </td>

                          {/* REVIEW REASON */}

                          <td>
                            {
                              item.review_reason ||
                              "Transaction requires manual review."
                            }
                          </td>

                          {/* ACTION BUTTONS */}

                          <td>

                            <div className="review-action-buttons">

                              {/* VIEW DECISION */}

                              <button
                                className="reasoning-btn"
                                onClick={() =>
                                  selectedTransaction?.transaction_id ===
                                  item.transaction_id
                                    ? closeDecision()
                                    : viewReasoning(
                                        item.transaction_id
                                      )
                                }
                              >

                                {reasoningLoading &&
                                selectedTransaction?.transaction_id ===
                                  item.transaction_id
                                  ? "Loading..."
                                  : selectedTransaction?.transaction_id ===
                                    item.transaction_id
                                  ? "Close Decision"
                                  : "View Decision"}

                              </button>

                              {/* APPROVE */}

                              <button
                                className="review-btn approve-btn"
                                onClick={() =>
                                  handleReviewAction(
                                    item.transaction_id,
                                    "approve"
                                  )
                                }
                                disabled={
                                  isActionInProgress
                                }
                              >

                                {approveLoading
                                  ? "Approving..."
                                  : "Approve"}

                              </button>

                              {/* REJECT */}

                              <button
                                className="review-btn reject-btn"
                                onClick={() =>
                                  handleReviewAction(
                                    item.transaction_id,
                                    "reject"
                                  )
                                }
                                disabled={
                                  isActionInProgress
                                }
                              >

                                {rejectLoading
                                  ? "Rejecting..."
                                  : "Reject"}

                              </button>

                              {/* ESCALATE */}

                              <button
                                className="review-btn escalate-btn"
                                onClick={() =>
                                  handleReviewAction(
                                    item.transaction_id,
                                    "escalate"
                                  )
                                }
                                disabled={
                                  isActionInProgress
                                }
                              >

                                {escalateLoading
                                  ? "Escalating..."
                                  : "Escalate"}

                              </button>

                            </div>

                          </td>

                        </tr>

                        {/* INLINE AI DECISION */}

                        {selectedTransaction?.transaction_id ===
                          item.transaction_id && (

                          <tr>

                            <td
                              colSpan="8"
                              className="inline-decision-cell"
                            >

                              {reasoningLoading ? (

                                <div className="decision-loading">
                                  Loading AI decision...
                                </div>

                              ) : (

                                renderDecisionPanel()

                              )}

                            </td>

                          </tr>

                        )}

                      </React.Fragment>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;