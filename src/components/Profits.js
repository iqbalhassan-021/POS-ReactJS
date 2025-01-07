import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file
import { collection, getDocs } from 'firebase/firestore';

const Profits = () => {
  const [profits, setProfits] = useState([]); // Store profits data
  const [detailedData, setDetailedData] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profitsData = [];
        const profitsCollection = collection(firestore, 'profits');
        const profitsDocs = await getDocs(profitsCollection);
        profitsDocs.forEach((doc) => {
          const profitData = doc.data();
          profitsData.push({
            id: doc.id,
            date: profitData.date?.toDate() || new Date(),
            productName: profitData.productName || 'Unknown',
            profit: parseFloat(profitData.profit) || 0, // Convert profit to a number
            quantitySold: profitData.productQuantity || 0, // Use the correct field for quantity
          });
        });

        setProfits(profitsData);
      } catch (error) {
        console.error('Error fetching data: ', error.message);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US'); // Format as MM/DD/YYYY
  };

  const formatTime = (timestamp) => {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(timestamp).toLocaleTimeString('en-US', options);
  };

  const handleViewDetails = (date) => {
    if (detailsVisible === date) {
      setDetailsVisible(null);
    } else {
      const filteredData = profits.filter((profit) => profit.date.toISOString().split('T')[0] === date);
      setDetailedData(filteredData);
      setDetailsVisible(date);
    }
  };

  const handlePrint = (date) => {
    const printContent = document.getElementById(`print-area-${date}`).innerHTML;
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Profits Report</title>');
    printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 8px; text-align: left; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>BUT PHARMACY</h1>');
    printWindow.document.write('<h2>Profits Report - ' + new Date().toLocaleString() + '</h2>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const aggregateProfits = () => {
    const aggregatedData = [];

    profits.forEach((profit) => {
      const existingProfit = aggregatedData.find((aggProfit) => aggProfit.date === profit.date.toISOString().split('T')[0]);
      if (existingProfit) {
        existingProfit.totalProfit += profit.profit;
        existingProfit.totalQuantitySold += profit.quantitySold;
      } else {
        aggregatedData.push({
          date: profit.date.toISOString().split('T')[0],
          totalProfit: profit.profit,
          totalQuantitySold: profit.quantitySold,
        });
      }
    });

    return aggregatedData;
  };

  const aggregatedProfitsData = aggregateProfits();

  return (
    <section className="section">
      <h1>Profits Report</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Date</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Total Profit (PKR)</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Total Quantity Sold</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {aggregatedProfitsData.map((profit, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                {formatDate(profit.date)}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                {profit.totalProfit.toFixed(2)}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                {profit.totalQuantitySold}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>
                <button
                  onClick={() => handleViewDetails(profit.date)}
                  className="primary-button"
                  style={{ backgroundColor: '#4CAF50', color: 'white', marginRight: '10px' }}
                >
                  {detailsVisible === profit.date ? 'Close Details' : 'View Details'}
                </button>
                <button
                  onClick={() => handlePrint(profit.date)}
                  className="primary-button"
                  style={{ backgroundColor: '#2196F3', color: 'white' }}
                >
                  Print Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detailed Profit Data */}
      {detailsVisible && (
        <div style={{ marginTop: '20px' }}>
          <div id={`print-area-${detailsVisible}`}>
            <h2>Profit Details for {detailsVisible}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Product Name</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Profit (PKR)</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Quantity Sold</th>
                  <th style={{ border: '1px solid #000', padding: '8px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {detailedData.map((profit, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {profit.productName}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {profit.profit.toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {profit.quantitySold}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {formatTime(profit.date)}
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

export default Profits;
