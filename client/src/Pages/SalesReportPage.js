import React, { useEffect, useState } from "react";
import axios from "axios";

const SalesReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch sales report from the backend
    axios
      .get("http://localhost:5000/api/sales-report")
      .then((response) => {
        setReportData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching sales report:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!reportData) {
    return <div>No report data available.</div>;
  }

  return (
    <div>
      <h1>Sales Report</h1>
      <h2>Total Sales: {reportData.totalSales}</h2>

      <h3>Month-wise Sales Totals</h3>
      <ul>
        {Object.entries(reportData.monthWiseSales).map(([month, data]) => (
          <li key={month}>
            <strong>{month}:</strong> ₹{data.totalSales}
          </li>
        ))}
      </ul>

      <h3>Most Popular Items by Month</h3>
      <ul>
        {Object.entries(reportData.popularItemsByMonth).map(([month, item]) => (
          <li key={month}>
            <strong>{month}:</strong> {item.sku} (Quantity: {item.quantity})
          </li>
        ))}
      </ul>

      <h3>Items Generating Most Revenue by Month</h3>
      <ul>
        {Object.entries(reportData.revenueItemsByMonth).map(([month, item]) => (
          <li key={month}>
            <strong>{month}:</strong> {item.sku} (Revenue: ₹{item.revenue})
          </li>
        ))}
      </ul>

      <h3>Min, Max, and Average Orders of Most Popular Items</h3>
      <ul>
        {Object.entries(reportData.statsByMonth).map(([month, stats]) => (
          <li key={month}>
            <strong>{month}:</strong> {stats.sku} - Min: {stats.minOrders}, Max:{" "}
            {stats.maxOrders}, Avg: {stats.avgOrders}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalesReport;
