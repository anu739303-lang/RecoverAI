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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        setDashboard(dashboardResponse.data);
        setRecovery(recoveryResponse.data.records);
        setAnalytics(analyticsResponse.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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


  const actionCounts = {};

  recovery.forEach((item) => {
    const action = item.recovery_action;

    actionCounts[action] =
      (actionCounts[action] || 0) + 1;
  });


  const actionData = Object.entries(
    actionCounts
  ).map(([name, value]) => ({
    name,
    value
  }));



  if (loading) {
    return (
      <div className="loading">
        Loading RecoverAI...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>RecoverAI</h1>
          <p>AI Revenue Recovery Platform</p>
        </div>

        <div className="status">
          ● System Operational
        </div>
      </header>

      {/* KPI Cards */}
      <section className="stats-grid">

        <div className="stat-card">
          <span>Revenue At Risk</span>
          <h2>
            ₹{Number(dashboard.revenue_at_risk).toLocaleString()}
          </h2>
        </div>

        <div className="stat-card">
          <span>Revenue Recovered</span>
          <h2>
            ₹{Number(dashboard.revenue_recovered).toLocaleString()}
          </h2>
        </div>

        <div className="stat-card">
          <span>Recovery Rate</span>
          <h2>
            {dashboard.recovery_rate}%
          </h2>
        </div>

        <div className="stat-card">
          <span>Recovery Attempts</span>
          <h2>
            {dashboard.recovery_attempts}
          </h2>
        </div>

        <div className="stat-card">
          <span>Successful Recoveries</span>
          <h2>
            {dashboard.successful_recoveries}
          </h2>
        </div>

      </section>

      {/* Batch Performance */}

<section className="batch-section">

  <div className="batch-header">

    <div>
      <h2>Batch Performance</h2>

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
      <span>Records Processed</span>

      <strong>
        {analytics.batch.total_transactions}
      </strong>
    </div>


    <div className="batch-card">
      <span>Recovery Decisions</span>

      <strong>
        {analytics.batch.total_recovery_records}
      </strong>
    </div>


    <div className="batch-card">
      <span>Recovery Attempts</span>

      <strong>
        {analytics.execution.recovery_attempts}
      </strong>
    </div>


    <div className="batch-card">
      <span>Successful Recoveries</span>

      <strong>
        {analytics.execution.successful_recoveries}
      </strong>
    </div>


    <div className="batch-card">
      <span>Failed Recoveries</span>

      <strong>
        {analytics.execution.failed_recoveries}
      </strong>
    </div>


    <div className="batch-card">
      <span>Not Executed</span>

      <strong>
        {analytics.execution.not_executed}
      </strong>
    </div>

  </div>

</section>


{/* Financial Evidence */}

<section className="financial-section">

  <div className="financial-header">

    <div>
      <h2>Revenue Recovery Evidence</h2>

      <p>
        Measured financial impact from the recovery agent
      </p>
    </div>

  </div>


  <div className="financial-grid">

    <div className="financial-card">

      <span>Revenue At Risk</span>

      <strong>
        ₹
        {Number(
          analytics.financial.revenue_at_risk
        ).toLocaleString()}
      </strong>

    </div>


    <div className="financial-card">

      <span>Revenue Recovered</span>

      <strong>
        ₹
        {Number(
          analytics.financial.revenue_recovered
        ).toLocaleString()}
      </strong>

    </div>


    <div className="financial-card">

      <span>Recovery Rate</span>

      <strong>
        {analytics.financial.recovery_rate}%
      </strong>

    </div>


    <div className="financial-card">

      <span>Average Transaction</span>

      <strong>
        ₹
        {Number(
          analytics.financial.average_transaction_value
        ).toLocaleString()}
      </strong>

    </div>

  </div>

</section>

      {/* Analytics */}

      <section className="charts-grid">

        {/* Outcome Chart */}

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


        {/* Action Chart */}

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



      {/* Recovery Activity */}
      <section className="table-section">

        <div className="section-header">
          <div>
            <h2>Recovery Activity</h2>
            <p>
              Recent AI-driven recovery decisions
            </p>
          </div>
        </div>

        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Transaction</th>
                <th>Amount</th>
                <th>Failure</th>
                <th>Action</th>
                <th>Status</th>
                <th>Recovered</th>
              </tr>
            </thead>

            <tbody>
              {recovery.map((item) => (
                <tr key={item.transaction_id}>

                  <td>
                    {item.transaction_id}
                  </td>

                  <td>
                    ₹{Number(item.amount).toLocaleString()}
                  </td>

                  <td>
                    {item.failure_reason}
                  </td>

                  <td>
                    {item.recovery_action}
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
                      item.recovered_amount
                    ).toLocaleString()}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;