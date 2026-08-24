import { useEffect, useState } from "react";
import axios from "axios";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import "./Dashboard.css";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [recovery, setRecovery] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Currently opened transaction
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [reasoningLoading, setReasoningLoading] = useState(false);

  const [safetyResult, setSafetyResult] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(false);

  const [manualReview, setManualReview] = useState([]);
  const [manualReviewLoading, setManualReviewLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardResponse = await axios.get(
          "http://127.0.0.1:8000/api/dashboard"
        );

        const recoveryResponse = await axios.get(
          "http://127.0.0.1:8000/api/recovery"
        );

        const analyticsResponse = await axios.get(
          "http://127.0.0.1:8000/api/analytics"
        );

        const manualReviewResponse = await axios.get(
          "http://127.0.0.1:8000/api/manual-review"
        );

        setDashboard(dashboardResponse.data);

        setRecovery(
          recoveryResponse.data.records || []
        );

        setAnalytics(
          analyticsResponse.data
        );

        setManualReview(
          manualReviewResponse.data.records || []
        );

      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard data.");
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

      // Safety result clear
      setSafetyResult(null);

      const response = await axios.get(
        `http://127.0.0.1:8000/api/reasoning/${transactionId}`
      );

      setSelectedTransaction(response.data);

    } catch (error) {
      console.error(error);
      alert("Unable to load AI reasoning.");
    } finally {
      setReasoningLoading(false);
    }
  };

  // ==========================================
  // CLOSE AI DECISION
  // ==========================================

  const closeDecision = () => {
    setSelectedTransaction(null);
    setSafetyResult(null);
  };

  // ==========================================
  // CHECK SAFETY
  // ==========================================

  const checkSafety = async (transactionId) => {
    try {
      setSafetyLoading(true);

      const response = await axios.get(
        `http://127.0.0.1:8000/api/safety/${transactionId}`
      );

      setSafetyResult(response.data);

    } catch (error) {
      console.error(error);
      alert("Unable to load safety decision.");
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
        "http://127.0.0.1:8000/api/manual-review"
      );

      setManualReview(
        response.data.records || []
      );

    } catch (error) {
      console.error(error);
      alert("Unable to load manual review queue.");
    } finally {
      setManualReviewLoading(false);
    }
  };

  // ==========================================
  // RECOVERY OUTCOME DATA
  // ==========================================

  const outcomeData = [
    {
      name: "Recovered",
      value: recovery.filter(
        (item) => item.success === true
      ).length
    },

    {
      name: "Failed",
      value: recovery.filter(
        (item) =>
          item.executed === true &&
          item.success === false
      ).length
    },

    {
      name: "Not Executed",
      value: recovery.filter(
        (item) => item.executed === false
      ).length
    }
  ];

  // ==========================================
  // RECOVERY ACTION DATA
  // ==========================================

  const actionCounts = {};

  recovery.forEach((item) => {
    const action = item.recovery_action || "Unknown";

    actionCounts[action] =
      (actionCounts[action] || 0) + 1;
  });

  const actionData = Object.entries(
    actionCounts
  ).map(([name, value]) => ({
    name,
    value
  }));

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
                {selectedTransaction.transaction_id}
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
              {selectedTransaction.transaction_id}
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
              {selectedTransaction.risk_level || "-"}
            </strong>

          </div>


          <div className="reasoning-item">

            <span>
              AI Decision
            </span>

            <strong>
              {selectedTransaction.decision || "-"}
            </strong>

          </div>


          <div className="reasoning-item">

            <span>
              Execution
            </span>

            <strong>
              {selectedTransaction.execution
                ? "EXECUTED"
                : "NOT EXECUTED"}
            </strong>

          </div>


          <div className="reasoning-item">

            <span>
              Result
            </span>

            <strong>
              {selectedTransaction.result || "-"}
            </strong>

          </div>


          <div className="reasoning-item">

            <span>
              Recovered Amount
            </span>

            <strong>
              ₹
              {Number(
                selectedTransaction.recovered_amount || 0
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
            {selectedTransaction.reason || "-"}
          </p>

        </div>


        {/* AUDIT TRAIL */}

        <div className="audit-box">

          <div>

            <span>
              Problem Detected
            </span>

            <p>
              {selectedTransaction.problem || "-"}
            </p>

          </div>


          <div>

            <span>
              Decision
            </span>

            <p>
              {selectedTransaction.decision || "-"}
            </p>

          </div>


          <div>

            <span>
              Execution Result
            </span>

            <p>
              {selectedTransaction.result || "-"}
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
                  {safetyResult.decision || "-"}
                </strong>

              </div>


              <div>

                <span>
                  Action
                </span>

                <strong>
                  {safetyResult.action || "-"}
                </strong>

              </div>


              <div>

                <span>
                  Escalation
                </span>

                <strong>
                  {safetyResult.escalation
                    ? "REQUIRED"
                    : "NOT REQUIRED"}
                </strong>

              </div>

            </div>


            <div className="safety-reason">

              <span>
                Safety Reason
              </span>

              <p>
                {safetyResult.reason || "-"}
              </p>

            </div>

          </div>

        )}

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
              dashboard.revenue_at_risk
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
              dashboard.revenue_recovered
            ).toLocaleString()}
          </h2>

        </div>


        <div className="stat-card">

          <span>
            Recovery Rate
          </span>

          <h2>
            {dashboard.recovery_rate}%
          </h2>

        </div>


        <div className="stat-card">

          <span>
            Recovery Attempts
          </span>

          <h2>
            {dashboard.recovery_attempts}
          </h2>

        </div>


        <div className="stat-card">

          <span>
            Successful Recoveries
          </span>

          <h2>
            {dashboard.successful_recoveries}
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
            {analytics.batch.total_transactions} Records
          </div>

        </div>


        <div className="batch-grid">

          <div className="batch-card">

            <span>
              Records Processed
            </span>

            <strong>
              {analytics.batch.total_transactions}
            </strong>

          </div>


          <div className="batch-card">

            <span>
              Recovery Decisions
            </span>

            <strong>
              {analytics.batch.total_recovery_records}
            </strong>

          </div>


          <div className="batch-card">

            <span>
              Recovery Attempts
            </span>

            <strong>
              {analytics.execution.recovery_attempts}
            </strong>

          </div>


          <div className="batch-card">

            <span>
              Successful Recoveries
            </span>

            <strong>
              {analytics.execution.successful_recoveries}
            </strong>

          </div>


          <div className="batch-card">

            <span>
              Failed Recoveries
            </span>

            <strong>
              {analytics.execution.failed_recoveries}
            </strong>

          </div>


          <div className="batch-card">

            <span>
              Not Executed
            </span>

            <strong>
              {analytics.execution.not_executed}
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
                analytics.financial.revenue_at_risk
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
                analytics.financial.revenue_recovered
              ).toLocaleString()}
            </strong>

          </div>


          <div className="financial-card">

            <span>
              Recovery Rate
            </span>

            <strong>
              {analytics.financial.recovery_rate}%
            </strong>

          </div>


          <div className="financial-card">

            <span>
              Average Transaction
            </span>

            <strong>
              ₹
              {Number(
                analytics.financial.average_transaction_value
              ).toLocaleString()}
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================
          ANALYTICS CHARTS
      ====================================== */}

      <section className="charts-grid">

        {/* OUTCOME CHART */}

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
                        key={index}
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


        {/* ACTION CHART */}

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
                        key={index}
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

              {recovery.map((item) => (

                <>

                  {/* TRANSACTION ROW */}

                  <tr
                    key={item.transaction_id}
                  >

                    <td>
                      {item.transaction_id}
                    </td>


                    <td>
                      ₹
                      {Number(
                        item.amount || 0
                      ).toLocaleString()}
                    </td>


                    <td>
                      {item.failure_reason || "-"}
                    </td>


                    <td>
                      {item.recovery_action || "-"}
                    </td>


                    <td>
                      {item.success
                        ? "RECOVERED"
                        : item.executed
                        ? "FAILED"
                        : "NOT EXECUTED"}
                    </td>


                    <td>
                      ₹
                      {Number(
                        item.recovered_amount || 0
                      ).toLocaleString()}
                    </td>


                    <td>

                      <button
                        className="reasoning-btn"
                        onClick={() =>
                          viewReasoning(
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


                  {/* INLINE AI DECISION */}

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

                </>

              ))}

            </tbody>

          </table>

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


        <div className="manual-review-actions">

          <button
            className="safety-btn"
            onClick={fetchManualReview}
          >

            {manualReviewLoading
              ? "Refreshing..."
              : "Refresh Queue"}

          </button>

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
                  Review Reason
                </th>

                <th>
                  AI Decision
                </th>

              </tr>

            </thead>


            <tbody>

              {manualReview.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center"
                    }}
                  >
                    No exceptions require manual review.
                  </td>

                </tr>

              ) : (

                manualReview.map((item) => (

                  <>

                    {/* MANUAL REVIEW ROW */}

                    <tr
                      key={item.transaction_id}
                    >

                      <td>
                        {item.transaction_id}
                      </td>


                      <td>
                        ₹
                        {Number(
                          item.amount || 0
                        ).toLocaleString()}
                      </td>


                      <td>
                        {item.failure_reason || "-"}
                      </td>


                      <td>
                        {item.recovery_action || "-"}
                      </td>


                      <td>
                        {item.success
                          ? "RECOVERED"
                          : item.executed
                          ? "FAILED"
                          : "NOT EXECUTED"}
                      </td>


                      <td>
                        {item.success
                          ? "No review required"
                          : item.executed
                          ? "Recovery attempt failed"
                          : "Recovery not executed"}
                      </td>


                      <td>

                        <button
                          className="reasoning-btn"
                          onClick={() =>
                            viewReasoning(
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


                    {/* INLINE AI DECISION */}

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

                  </>

                ))

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;