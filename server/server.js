const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors("*"));
const PORT = 5000;

// Helper function to parse CSV data
const parseCSV = (csvString) => {
  const rows = csvString.trim().split("\n");
  const headers = rows[0].split(",");

  return rows.slice(1).map((row) => {
    const values = row.split(",");
    return {
      date: new Date(values[0]),
      sku: values[1],
      unitPrice: parseFloat(values[2]),
      quantity: parseInt(values[3]),
      totalPrice: parseFloat(values[4]),
    };
  });
};

// Helper function to format date to YYYY-MM
const getMonthYear = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

// Main function to generate reports
const generateReports = (salesData) => {
  let totalSales = 0;
  const monthWiseSales = {};
  const popularItemsByMonth = {};
  const revenueItemsByMonth = {};

  salesData.forEach((sale) => {
    const monthYear = getMonthYear(sale.date);
    totalSales += sale.totalPrice;

    // Update month-wise sales
    if (!monthWiseSales[monthYear]) {
      monthWiseSales[monthYear] = { totalSales: 0, items: {} };
    }
    monthWiseSales[monthYear].totalSales += sale.totalPrice;

    // Update item quantities and revenue for the month
    if (!monthWiseSales[monthYear].items[sale.sku]) {
      monthWiseSales[monthYear].items[sale.sku] = {
        quantity: 0,
        totalPrice: 0,
      };
    }
    monthWiseSales[monthYear].items[sale.sku].quantity += sale.quantity;
    monthWiseSales[monthYear].items[sale.sku].totalPrice += sale.totalPrice;
  });

  // Find most popular and highest revenue items per month
  for (const [month, data] of Object.entries(monthWiseSales)) {
    let mostPopularItem = { sku: null, quantity: 0 };
    let highestRevenueItem = { sku: null, revenue: 0 };

    for (const [sku, item] of Object.entries(data.items)) {
      if (item.quantity > mostPopularItem.quantity) {
        mostPopularItem = { sku, quantity: item.quantity };
      }
      if (item.totalPrice > highestRevenueItem.revenue) {
        highestRevenueItem = { sku, revenue: item.totalPrice };
      }
    }

    popularItemsByMonth[month] = mostPopularItem;
    revenueItemsByMonth[month] = highestRevenueItem;
  }

  // Generate min, max, and average for the most popular item each month
  const statsByMonth = {};
  for (const [month, mostPopular] of Object.entries(popularItemsByMonth)) {
    const quantities = salesData
      .filter(
        (sale) =>
          getMonthYear(sale.date) === month && sale.sku === mostPopular.sku
      )
      .map((sale) => sale.quantity);

    const minOrders = Math.min(...quantities);
    const maxOrders = Math.max(...quantities);
    const avgOrders = quantities.reduce((a, b) => a + b, 0) / quantities.length;

    statsByMonth[month] = {
      sku: mostPopular.sku,
      minOrders,
      maxOrders,
      avgOrders,
    };
  }

  // Return the generated report
  return {
    totalSales,
    monthWiseSales,
    popularItemsByMonth,
    revenueItemsByMonth,
    statsByMonth,
  };
};

// API endpoint to serve the sales report data
app.get("/api/sales-report", (req, res) => {
  const filePath = path.join(__dirname, "./data.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading sales data" });
    }

    const salesData = parseCSV(data);
    const report = generateReports(salesData);
    res.json(report); // Send the report as JSON response
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
