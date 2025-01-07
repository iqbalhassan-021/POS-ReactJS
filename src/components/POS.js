import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, addDoc, collection, getDocs, getDoc } from 'firebase/firestore';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [sellByPack, setSellByPack] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [givenCash, setGivenCash] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(firestore, 'products');
        const productDocs = await getDocs(productsCollection);
        const productData = productDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productData);
      } catch (error) {
        console.error('Error fetching products: ', error.message);
      }
    };

    fetchProducts();
  }, []);
  const accounts = [
    { name: 'Cash', collectionName: 'Cash' },
    { name: 'JazzCash', collectionName: 'JazzCash' },
    { name: 'EasyPesa', collectionName: 'EasyPesa' },
    { name: 'BankTransfer', collectionName: 'BankTransfer' },
  ];
  const calculateSubtotal = (product, quantity, sellByPack) => {
    if (sellByPack) {
      return product.sellingPrice * quantity;
    } else {
      return (product.sellingPrice / product.tabsPerPack) * quantity;
    }
  };
  useEffect(() => {
    // Recalculate the remaining balance whenever givenCash or total changes
    const remaining = givenCash - total;
    setRemainingBalance(remaining);
  }, [givenCash, total]); // Add total and givenCash as dependencies
  
  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      setErrorMessage('Please select a product and enter a valid quantity greater than 0');
      return;
    }
  
    // Check if the quantity is greater than 0 before proceeding
    if (quantity <= 0) {
      setErrorMessage('Quantity must be greater than 0');
      return;
    }
  
    // Check if the product is already in the cart
    const existingCartItem = cart.find((item) => item.product.id === selectedProduct.id);
    let newCartItem;
  
    if (existingCartItem) {
      // If the product is already in the cart, update the quantity
      newCartItem = {
        ...existingCartItem,
        quantity: existingCartItem.quantity + quantity,
        subtotal: calculateSubtotal(existingCartItem.product, existingCartItem.quantity + quantity, sellByPack),
      };
  
      // Update the cart by replacing the old item with the new one
      const updatedCart = cart.map((item) =>
        item.product.id === selectedProduct.id ? newCartItem : item
      );
  
      setCart(updatedCart);
    } else {
      // If it's a new product, add it to the cart
      newCartItem = {
        product: selectedProduct,
        quantity,
        sellByPack,
        subtotal: calculateSubtotal(selectedProduct, quantity, sellByPack),
      };
  
      setCart([...cart, newCartItem]);
    }
  
    // Update the total
    setTotal((prevTotal) => prevTotal + newCartItem.subtotal);
  
    // Reset the fields
    setInputValue('');
    setQuantity(0);
    setSellByPack(true);
    setSelectedProduct(null);
    setErrorMessage('');
  };
  
  const handleDeleteItem = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    const updatedTotal = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
    setTotal(updatedTotal);
  };

  const handleProductInput = (e) => {
    const input = e.target.value;
    setInputValue(input);
  
    // Reset selectedProduct when user starts typing
    setSelectedProduct(null);
  
    if (input.trim() === "") {
      return; // If the input is empty, no need to filter products
    }
  
    // Filter products to exclude items already in the cart and products with productQuantity <= 10
    const availableProducts = products.filter(
      (product) => !cart.some((item) => item.product.id === product.id) && product.productQuantity > 10
    );
  
    // Find matching products based on the input value
    const matchedProducts = availableProducts.filter((product) =>
      product.productName.toLowerCase().includes(input.toLowerCase())
    );
  
    // Display suggestions only when matching products are found
    setSelectedProduct(matchedProducts.length > 0 ? matchedProducts : []);
  };
  

  const handleSelectProduct = (product) => {
    setSelectedProduct(product); // Store the selected product in the selectedProduct state
    setInputValue(product.productName); // Set the input value to the selected product's name
  };
  const handlePayment = async () => {
    try {
      const remaining = givenCash - total;
      setRemainingBalance(remaining);
  
      // Find the selected account (payment method)
      const selectedAccount = accounts.find((account) => account.name === paymentMethod);
      if (!selectedAccount) {
        setErrorMessage('Invalid payment method');
        console.log('Error: Invalid payment method');
        return;
      }
  
      // Calculate the total profit for the transaction
      const profitEntries = cart.map((item) => {
        const profitPerUnit = item.product.sellingPrice - item.product.purchasePrice;
        const profit = profitPerUnit * item.quantity;
        return {
          productName: item.product.productName,
          productQuantity: item.quantity,
          profit: profit.toFixed(2),
        };
      });
  
      // Prepare the data to save in the Firestore collection
      const billData = {
        customerName: customerName.trim() || 'Walking Customer',
        items: cart.map((item) => ({
          productName: item.product.productName,
          quantity: item.quantity,
          subtotal: item.subtotal.toFixed(2),
        })),
        grandTotal: total.toFixed(2),
        paymentMethod,
        amount: givenCash,
        remainingBalance: remaining,
        date: new Date(),
      };
  
      console.log('Saving bill data:', billData);
  
      // Save the bill in the Firestore collection corresponding to the payment method
      await addDoc(collection(firestore, selectedAccount.collectionName), billData);
      console.log('Bill saved successfully in', selectedAccount.collectionName);
  
      // Save each profit entry in the 'profits' collection
      for (const entry of profitEntries) {
        await addDoc(collection(firestore, 'profits'), {
          ...entry,
          totalBill: total.toFixed(2),
          date: new Date(),
        });
      }
      console.log('Profit entries saved successfully in profits collection');
  
      // Clear the cart and reset fields after payment
      setCart([]);
      setTotal(0);
      setErrorMessage('');
      setIsModalVisible(false);
  
      // Call the generateBill function to create and print the bill after payment
      generateBill(billData);
      console.log('Bill generation triggered.');
    } catch (error) {
      console.error('Error during payment process:', error);
      setErrorMessage('An error occurred during payment processing');
      console.log('Error message:', error.message);
    }
  };
  
  
  
  const generateBill = (billData) => {
    // Create the bill content
    const billContent = `
      <div style="font-family: Arial, sans-serif; margin: 20px;">
        <h2>BUTT PHARMACY</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 5px;">Customer Name</th>
              <th style="border: 1px solid #000; padding: 5px;">Product Name</th>
              <th style="border: 1px solid #000; padding: 5px;">Quantity</th>
              <th style="border: 1px solid #000; padding: 5px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${billData.items.map(item => `
              <tr>
                <td style="border: 1px solid #000; padding: 5px;">${item.customerName}</td>
                <td style="border: 1px solid #000; padding: 5px;">${item.productName}</td>
                <td style="border: 1px solid #000; padding: 5px;">${item.quantity}</td>
                <td style="border: 1px solid #000; padding: 5px;">PKR ${item.subtotal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h3 style="margin-top: 20px; text-align: right;">Grand Total: PKR ${billData.grandTotal}</h3>
        <p><strong>Cash Given:</strong> PKR ${billData.amount}</p>
        <p><strong>Remaining Balance:</strong> PKR ${billData.remainingBalance}</p>
      </div>
    `;
  
    // Open the print dialog
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(billContent);
    printWindow.document.close();
    printWindow.print();
  };
  
  
  
  return (
    <section className="section">
      <h2>Point of Sale (POS)</h2>

      {/* Product Input Section */}
      <div className="input-container">
        <input
          type="text"
          placeholder="Search for a product"
          value={inputValue}
          onChange={handleProductInput}
        />

        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          placeholder="Quantity"
        />
        <select
          value={sellByPack ? 'Pack' : 'Tab'}
          onChange={(e) => setSellByPack(e.target.value === 'Pack')}
        >
          <option value="Pack">Pack</option>
          <option value="Tab">Tab</option>
        </select>
        <button onClick={handleAddToCart}>Add</button>

        {/* Product Suggestions */}
       
      </div>
      {inputValue && selectedProduct && selectedProduct.length > 0 && (
          <ul className="product-suggestions">
            {selectedProduct.map((product) => (
              <li key={product.id} onClick={() => handleSelectProduct(product)}>
                {product.productName} - {product.sellingPrice} PKR
              </li>
            ))}
          </ul>
        )}
        {inputValue && selectedProduct && selectedProduct.length === 0 && (
          <ul className="product-suggestions">
            <li>No products found</li>
          </ul>
        )}
      {/* Cart Table */}
      <table>
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td>{item.product.productName}</td>
              <td>{item.quantity}</td>
              <td>{item.subtotal.toFixed(2)}</td>
              <td>
                <button onClick={() => handleDeleteItem(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total and Payment Section */}
      <p>Total: PKR {total.toFixed(2)}</p>
      <button onClick={() => setIsModalVisible(true)}>Generate Bill</button>

      {/* Payment Modal */}
      {isModalVisible && (
  <div className="modal">
    <div className="modal-content">
      <h3>BUTT PHARMACY</h3>
      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
      <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
      <h3>Total Bill: PKR {total.toFixed(2)}</h3>
      <label>
  Customer Name:
  <input
    type="text"
    value={customerName} // Shows the current value of customerName
    onChange={(e) => setCustomerName(e.target.value)} // Update state on change
    placeholder='Walking Customer' // Placeholder when the input is empty
  />
</label>

      <label>
        Payment Method:
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="Cash">Cash</option>
          <option value="JazzCash">JazzCash</option>
          <option value="EasyPesa">EasyPesa</option>
          <option value="BankTransfer">BankTransfer</option>
        </select>
      </label>
      <label>
        Given Cash:
        <input
          type="number"
          value={givenCash}
          onChange={(e) => setGivenCash(parseFloat(e.target.value))}
        />
      </label>
      <label>
        Remaining Balance:
        <input
          type="number"
          value={remainingBalance}
          readOnly
          style={{ color: remainingBalance < 0 ? 'red' : 'black' }}
        />
      </label>

      <button onClick={handlePayment}>OK</button>
      <button onClick={() => setIsModalVisible(false)} style={{ marginLeft: '1em' }}>
        Cancel
      </button>
    </div>
  </div>
)}

    </section>
  );
};

export default POS;
