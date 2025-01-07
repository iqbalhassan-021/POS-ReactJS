import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Adjust the import based on your setup
import { collection, getDocs } from 'firebase/firestore';

const Sales = () => {
  const [salesData, setSalesData] = useState([]); // To hold the sales data
  const [detailedData, setDetailedData] = useState([]); // Detailed data for specific date
  const [detailsVisible, setDetailsVisible] = useState(null); // For toggling details view

  const accounts = [
    { name: 'Cash', collectionName: 'Cash' },
    { name: 'JazzCash', collectionName: 'JazzCash' },
    { name: 'EasyPesa', collectionName: 'EasyPesa' },
    { name: 'BankTransfer', collectionName: 'BankTransfer' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        let allSalesData = [];

        // Loop through all the accounts to fetch sales data
        for (const account of accounts) {
          const salesCollection = collection(firestore, account.collectionName);
          const salesDocs = await getDocs(salesCollection);

          salesDocs.forEach((doc) => {
            const saleData = doc.data();

            // Ensure that the date is a valid Date object
            const saleDate = saleData.date ? saleData.date.toDate() : new Date();
            const formattedDate = saleDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

            // Store the sales separately
            allSalesData.push({
              date: formattedDate,
              timestamp: saleDate, // Store the timestamp to use for sorting
              totalSales: parseFloat(saleData.grandTotal) || 0,
              customerName: saleData.customerName || 'Unknown', // Ensure customer name is not empty
              amount: saleData.amount || 0,
              paymentMethod: saleData.paymentMethod || 'Unknown',
              account: account.name,
              items: saleData.items || [],
            });
          });
        }

        setSalesData(allSalesData); // Set sales data without aggregation
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date) => {
    // Convert the timestamp to a human-readable format (MM/DD/YYYY)
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const formatTime = (timestamp) => {
    // Convert timestamp to a human-readable time format (HH:MM:SS)
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(timestamp).toLocaleTimeString('en-US', options);
  };

  const handleViewDetails = (date) => {
    // Toggle visibility of the details for the selected date
    if (detailsVisible === date) {
      // If details for this date are already visible, hide them
      setDetailsVisible(null);
    } else {
      // If details for this date are not visible, show them
      const filteredData = salesData.filter((sale) => sale.date === date);

      // Sort by timestamp to ensure the correct order of sales by time
      const sortedData = filteredData.sort((a, b) => a.timestamp - b.timestamp);

      setDetailedData(sortedData);
      setDetailsVisible(date); // Show details for the selected date
    }
  };

  const aggregateSales = () => {
    const aggregatedData = [];

    salesData.forEach((sale) => {
      const existingSale = aggregatedData.find((aggSale) => aggSale.date === sale.date);
      
      if (existingSale) {
        existingSale.totalSales += sale.totalSales;
        existingSale.totalProductsSold += sale.items.reduce((sum, item) => sum + item.quantity, 0);
      } else {
        aggregatedData.push({
          date: sale.date,
          totalSales: sale.totalSales,
          totalProductsSold: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        });
      }
    });

    return aggregatedData;
  };

  const aggregatedSalesData = aggregateSales();

  const handlePrint = () => {
    const printContent = document.getElementById('print-content').innerHTML;
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Sales Report</title>');
    printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 8px; text-align: left; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>BUT PHARMACY</h1>');
    printWindow.document.write('<h2>Sales Report - ' + new Date().toLocaleString() + '</h2>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <section className="section">
      <h1>Sales Report</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Date</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Total Sales (PKR)</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Total Products Sold</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {aggregatedSalesData.map((sale, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                {formatDate(sale.date)} {/* Display date only */}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                {sale.totalSales.toFixed(2)}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                {sale.totalProductsSold}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                <button
                  onClick={() => handleViewDetails(sale.date)}
                  className="primary-button"
                  style={{ backgroundColor: '#4CAF50', color: 'white' }}
                >
                  {detailsVisible === sale.date ? 'Close Details' : 'View Details'}
                </button>
                <button
                  onClick={handlePrint}
                  className="primary-button"
                  style={{ backgroundColor: '#008CBA', color: 'white', marginLeft: '10px' }}
                >
                  Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detailed Data Table */}
      {detailsVisible && (
        <div style={{ marginTop: '20px' }}>
          <div id="print-content">
            <h2>Sales Details for {detailsVisible}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Customer Name</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Time</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Amount (PKR)</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Payment Method</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Account</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Items</th>
                </tr>
              </thead>
              <tbody>
                {detailedData.map((sale, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {sale.customerName}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {formatTime(sale.timestamp)} {/* Display time for each sale */}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {sale.amount ? sale.amount.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {sale.paymentMethod}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {sale.account}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {sale.items && sale.items.length > 0 ? (
                        sale.items.map((item, idx) => (
                          <div key={idx}>{item.productName}: {item.quantity}</div>
                        ))
                      ) : (
                        <span>No items</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default Sales;
