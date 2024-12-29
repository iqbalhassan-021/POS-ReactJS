import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
  const [totalSale, setTotalSale] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetching products
        const productsSnapshot = await getDocs(collection(firestore, 'products'));
        const products = productsSnapshot.docs.map((doc) => doc.data());
        console.log('Fetched products:', products); // Log products
        setProductCount(products.length);

        // Fetching sales data for today
        const salesSnapshot = await getDocs(
          query(collection(firestore, 'sales'), where('date', '==', new Date().toLocaleDateString()))
        );
        const sales = salesSnapshot.docs.map((doc) => doc.data());
        console.log('Sales fetched:', sales); // Log sales
        setDailySales(sales.reduce((sum, sale) => sum + sale.amount, 0));
        setTotalProfit(sales.reduce((sum, sale) => sum + sale.profit, 0));

        // Fetching total sale from balances (Cash, JazzCash, EasyPesa, BankTransfer)
        const balances = ['Cash', 'JazzCash', 'EasyPesa', 'BankTransfer'];
        let totalSaleAmount = 0;

        for (const balance of balances) {
          const balanceSnapshot = await getDocs(collection(firestore, balance));
          const balanceData = balanceSnapshot.docs.map((doc) => doc.data());
          console.log(`${balance} balances fetched:`, balanceData); // Log balance data

          balanceData.forEach((item) => {
            if (typeof item.balance === 'number' && !isNaN(item.balance)) {
              totalSaleAmount += item.balance;
            } else {
              console.warn(`Invalid balance data in ${balance} collection.`);
            }
          });
        }

        setTotalSale(totalSaleAmount);

        // Weekly sales for the last 7 days
        const last7Days = [...Array(7)].map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toLocaleDateString();
        });
        const weeklyData = last7Days.map((date) => ({
          date,
          sales: sales.filter((sale) => sale.date === date).reduce((sum, sale) => sum + sale.amount, 0),
        }));
        console.log('Weekly sales data:', weeklyData); // Log weekly sales
        setWeeklySales(weeklyData);
            // Fetching expiring products
            const expiringSnapshot = await getDocs(query(collection(firestore, 'products')));
            const expiringProductsData = expiringSnapshot.docs.map((doc) => {
            const data = doc.data();
            const expiryDate = new Date(data.productExpiry); // Use productExpiry field
            const currentDate = new Date();
            
            // Set both dates to the start of the day (removes the time part)
            currentDate.setHours(0, 0, 0, 0);
            expiryDate.setHours(0, 0, 0, 0);

            const remainingMillis = expiryDate - currentDate; // Difference in milliseconds
            const remainingDays = Math.floor(remainingMillis / (1000 * 60 * 60 * 24)); // Convert to days

            return { ...data, remainingDays };
            });

            // Filter out products that have expired (remainingDays < 0)
            const validExpiringProducts = expiringProductsData.filter(product => product.remainingDays >= 0);

            console.log('Valid expiring products:', validExpiringProducts); // Log valid products
            setExpiringProducts(validExpiringProducts);




      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  // Graph data
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
    <h3>Expiring Products</h3>
    <ul>
      {expiringProducts.length > 0 ? (
        expiringProducts.map((product, index) => (
          <li key={index}>
            {product.productName} - Expiry in{' '}
            {product.remainingDays < 0 ? 'Expired' : `${product.remainingDays} days`}
          </li>
        ))
      ) : (
        <p>No products expiring soon.</p>
      )}
    </ul>
  </div>
</div>

    </div>
  );
};

export default Dashboard;
