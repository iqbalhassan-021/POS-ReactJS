import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [weeklySales, setWeeklySales] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [dailySales, setDailySales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [expiredProducts, setExpiredProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [totalSale, setTotalSale] = useState(0);

  const accounts = [
    { name: 'Cash', collectionName: 'Cash' },
    { name: 'JazzCash', collectionName: 'JazzCash' },
    { name: 'EasyPesa', collectionName: 'EasyPesa' },
    { name: 'BankTransfer', collectionName: 'BankTransfer' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(firestore, 'products'));
        const products = productsSnapshot.docs.map((doc) => {
          const data = doc.data();
          const expiryDate = new Date(data.productExpiry);
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);
          expiryDate.setHours(0, 0, 0, 0);

          const remainingDays = Math.floor(
            (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
          );

          return { ...data, remainingDays };
        });

        // Separate expired and expiring products
        const expired = products.filter((product) => product.remainingDays <= 0);
        const expiringSoon = products.filter(
          (product) => product.remainingDays > 0 && product.remainingDays <= 180
        );

        // Identify low-stock products
        const lowStock = products.filter((product) => product.productQuantity < 1);

        setExpiredProducts(expired);
        setExpiringProducts(expiringSoon);
        setLowStockProducts(lowStock); // Update low stock products
        setProductCount(products.length);

        // Fetch total balances from each bank collection
        let totalBalance = 0;

        for (const account of accounts) {
          const accountSnapshot = await getDocs(collection(firestore, account.collectionName));
        
          // Use for...of loop to properly handle async operations
          for (const doc of accountSnapshot.docs) {
            const data = doc.data();
            const total = data.total || 0; // Default to 0 if total is missing
            totalBalance += total;
          }
        }
        
        setTotalSale(totalBalance); // Set total sale as the sum of all amounts

        // Fetch profits and today's sales
        const profitsSnapshot = await getDocs(collection(firestore, 'profits'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
  
        let todaysProfit = 0;
        let todaysSales = 0;

        // Profit calculation
        profitsSnapshot.forEach((doc) => {
          const data = doc.data();
          const profitDate = data.date.toDate();
          profitDate.setHours(0, 0, 0, 0);

          if (profitDate.getTime() === today.getTime()) {
            todaysProfit += parseFloat(data.profit) || 0;
          }
        });

             // Sales calculation from each account
      for (const account of accounts) {
        const accountSnapshot = await getDocs(collection(firestore, account.collectionName));

        accountSnapshot.forEach((doc) => {
          const data = doc.data();

          if (data.date) {
            const saleDate = data.date.toDate(); // Convert Firestore timestamp to JS Date
            saleDate.setHours(0, 0, 0, 0);

            // Log for debugging
            console.log("Sale Date:", saleDate);
            console.log("Today's Date:", today);

            if (saleDate.getTime() === today.getTime()) {
              todaysSales += data.total || 0; // Sum today's sales
            }
          }
        });
      }

      setDailySales(todaysSales); // Update state for today's sales
      setTotalProfit(todaysProfit); // Set total profit
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const graphData = {
    labels: weeklySales.map((data) => data.date),
    datasets: [
      {
        label: 'Weekly Sales (PKR)',
        data: weeklySales.map((data) => data.sales),
        backgroundColor: '#4caf50',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="dashboard">
      <div className="first-row">
        <div className="graph-container">
          <h3>Weekly Sales</h3>
          <Bar data={graphData} />
        </div>
        <div className="stats-grid">
          <div className="stat-box">
            <h4>Total Products</h4>
            <p>{productCount}</p>
          </div>

          <div className="stat-box">
            <h4>Total Profit</h4>
            <p>PKR {totalProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="second-row">
        <div className="expiring-products">
          <h3>Products Expiring Soon (Next 6 Months)</h3>
          <ul>
            {expiringProducts.length > 0 ? (
              expiringProducts.map((product, index) => (
                <li key={index}>
                  {product.productName} - Expiry in {product.remainingDays} days
                </li>
              ))
            ) : (
              <p>No products expiring soon.</p>
            )}
          </ul>
        </div>

        <div className="expiring-products">
          <h3>Expired Products</h3>
          <ul>
            {expiredProducts.length > 0 ? (
              expiredProducts.map((product, index) => (
                <li key={index}>{product.productName} - Expired</li>
              ))
            ) : (
              <p>No expired products.</p>
            )}
          </ul>
        </div>

        <div className="expiring-products">
          <h3>Low Stock Products (Less than 1)</h3>
          <ul>
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product, index) => (
                <li
                  key={index}
                  style={{
                    backgroundColor: product.productQuantity <= 10 ? 'red' : 'transparent',
                    color: product.productQuantity <= 10 ? 'white' : 'black', // Optional: Change text color for better readability
                  }}
                >
                  {product.productName} - Quantity: {product.productQuantity}
                </li>
              ))
            ) : (
              <p>No low-stock products.</p>
            )}
          </ul>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
