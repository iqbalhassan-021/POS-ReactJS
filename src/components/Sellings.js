import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file
import { collection, getDocs } from 'firebase/firestore';

const Sellings = () => {
  const [sales, setSales] = useState([]);
  const [dates, setDates] = useState([]); // Store the unique dates from sales
  const [totalSoldItems, setTotalSoldItems] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [selectedDate, setSelectedDate] = useState(''); // Store selected date
  const [filteredSales, setFilteredSales] = useState([]); // Store filtered sales for the selected date

  // Fetch sales data and dates from Firestore
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesCollection = collection(firestore, 'bills');
        const salesDocs = await getDocs(salesCollection);
        const salesData = salesDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSales(salesData);

        // Extract unique dates from the sales data
        const uniqueDates = [
          ...new Set(
            salesData.map((sale) => {
              const saleDate = new Date(sale.date.seconds * 1000);
              return saleDate.toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format
            })
          ),
        ];

        setDates(uniqueDates);
      } catch (error) {
        console.error('Error fetching sales data: ', error.message);
      }
    };

    fetchSales();
  }, []);

  // Filter sales by the selected date and calculate totals
  useEffect(() => {
    if (selectedDate) {
      const filtered = sales.filter((sale) => {
        const saleDate = new Date(sale.date.seconds * 1000);
        return saleDate.toISOString().split('T')[0] === selectedDate;
      });

      let totalItems = 0;
      let earnings = 0;
      let profit = 0;

      filtered.forEach((sale) => {
        sale.items.forEach((item) => {
          totalItems += item.quantity;
          earnings += item.subtotal;
          profit += (item.sellingPrice - item.costPrice) * item.quantity;
        });
      });

      setFilteredSales(filtered);
      setTotalSoldItems(totalItems);
      setTotalEarnings(earnings);
      setTotalProfit(profit);
    }
  }, [selectedDate, sales]); // Trigger this effect when selectedDate or sales changes

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <section className="section">
      <h2>Daily Sellings</h2>

      {/* Date Picker */}
      <label>
        Select Date:
        <select value={selectedDate} onChange={handleDateChange}>
          <option value="" disabled>Select a date</option>
          {dates.map((date) => (
            <option key={date} value={date}>
              {new Date(date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>

      <div className="sellings-info">
        <div className="sellings-item">
          <h3>Total Items Sold:</h3>
          <p id="totalSoldItems">{totalSoldItems}</p>
        </div>
        <div className="sellings-item">
          <h3>Total Daily Earnings:</h3>
          <p id="totalEarnings">PKR {totalEarnings.toFixed(2)}</p>
        </div>
        <div className="sellings-item">
          <h3>Total Profit:</h3>
          <p id="totalProfit">PKR {totalProfit.toFixed(2)}</p>
        </div>
      </div>

      <h3>Sales for {selectedDate}</h3>
      <div className="recent-sellings">
        {selectedDate ? (
          filteredSales.map((sale) => (
            <div key={sale.id} className="sale-item">
              <h4>{new Date(sale.date.seconds * 1000).toLocaleString()}</h4>
              <p><strong>Items:</strong></p>
              <ul>
                {sale.items.map((item, index) => (
                  <li key={index}>{item.productName} - Quantity: {item.quantity} - Subtotal: PKR {item.subtotal.toFixed(2)}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p>Please select a date to view the sales.</p>
        )}
      </div>
    </section>
  );
};

export default Sellings;
