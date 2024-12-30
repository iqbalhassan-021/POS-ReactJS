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
  const [lowStockProducts, setLowStockProducts] = useState([]); // New state for low stock products
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
        const lowStock = products.filter((product) => product.productQuantity < 10);

        setExpiredProducts(expired);
        setExpiringProducts(expiringSoon);
        setLowStockProducts(lowStock); // Update low stock products
        setProductCount(products.length);

        // Fetch total balances from each bank collection
        let totalBalance = 0;

        for (const account of accounts) {
          const accountSnapshot = await getDocs(collection(firestore, account.collectionName));
        
          // Log the account data for debugging
          console.log(`Fetching balance for ${account.name} collection:`, account.collectionName);
        
          // Use for...of loop to properly handle async operations
          for (const doc of accountSnapshot.docs) {
            const data = doc.data();
            const amount = data.amount || 0; // Default to 0 if amount is missing
        
            console.log(`Amount for ${account.name}:`, amount); // Log the amount of each account document
            totalBalance += amount;
          }
        }
        
        // Log the final total balance
        console.log('Total Sale (Total Amount from all accounts):', totalBalance);
        
        setTotalSale(totalBalance); // Set total sale as the sum of all amounts
        
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
            <h4>Today's Sales</h4>
            <p>PKR {dailySales.toFixed(2)}</p>
          </div>
          <div className="stat-box">
            <h4>Total Profit</h4>
            <p>PKR {totalProfit.toFixed(2)}</p>
          </div>
          <div className="stat-box">
            <h4>Total Sale</h4>
            <p>PKR {totalSale.toFixed(2)}</p>
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

        <div className="expired-products">
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
        </div>

        <div className="low-stock-products"> {/* New Section */}
          <div className="expiring-products">
            <h3>Low Stock Products (Less than 10)</h3>
            <ul>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product, index) => (
                  <li key={index}>
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
    </div>
  );
};

export default Dashboard;
