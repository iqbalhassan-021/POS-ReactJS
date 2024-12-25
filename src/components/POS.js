import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, updateDoc, addDoc, collection, getDocs, getDoc, where } from 'firebase/firestore'; 

const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([
    { product: null, quantity: 0, sellByPack: true, subtotal: 0, inputValue: '' },
  ]);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [givenCash, setGivenCash] = useState(0);
  const [remainingCash, setRemainingCash] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0); // New state for remaining balance

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

  const calculateSubtotal = (product, quantity, sellByPack) => {
    if (sellByPack) {
      return product.sellingPrice * quantity;
    } else {
      return (product.sellingPrice / product.tabsPerPack) * quantity;
    }
  };

  const handleCartChange = (index, field, value) => {
    const updatedCart = [...cart];
    const item = updatedCart[index];

    if (field === 'quantity') {
      item[field] = parseInt(value, 10) || 0;
    } else if (field === 'sellByPack') {
      item[field] = value === 'Pack';
    } else if (field === 'product') {
      item[field] = value;
      item.inputValue = value?.productName || '';
    }

    if (item.product) {
      item.subtotal = calculateSubtotal(
        item.product,
        item.quantity,
        item.sellByPack
      );
    }

    setCart(updatedCart);
    const updatedTotal = updatedCart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setTotal(updatedTotal);
    setSelectedProductIndex(null);
    setSuggestionsVisible(false);
  };

  const handleProductInput = (index, inputValue) => {
    const updatedCart = [...cart];
    updatedCart[index].inputValue = inputValue;

    const productMatch = products.find((product) =>
      product.productName.toLowerCase().includes(inputValue.toLowerCase())
    );

    updatedCart[index].product = productMatch || null;
    if (productMatch) {
      updatedCart[index].subtotal = calculateSubtotal(
        productMatch,
        updatedCart[index].quantity,
        updatedCart[index].sellByPack
      );
    } else {
      updatedCart[index].subtotal = 0;
    }

    setCart(updatedCart);
    const updatedTotal = updatedCart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setTotal(updatedTotal);
    setSuggestionsVisible(inputValue.length > 0);
  };

  const removeCartItem = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    const updatedTotal = updatedCart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setTotal(updatedTotal);
  };

  const addNewCartItem = () => {
    setCart([
      ...cart,
      { product: null, quantity: 0, sellByPack: true, subtotal: 0, inputValue: '' },
    ]);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };
  const handlePayment = async () => {
    try {
      const remaining = givenCash - total;
      setRemainingCash(remaining);
      setRemainingBalance(remaining);
  
      if (!customerName) {
        setErrorMessage('Customer name is required');
        return;
      }
  
      const billData = {
        items: cart,
        total,
        customerName,
        paymentMethod,
        amount: givenCash, // Use 'amount' instead of 'givenCash'
        remainingBalance: remaining,
        date: new Date(),
      };
  
      // Save bill data in the selected payment method collection
      const paymentData = {
        amount: givenCash, // Standardize field name as 'amount'
        customerName,
        remainingBalance: remaining,
        transactionDate: new Date(),
        items: cart,
        total,
      };
  
      if (paymentMethod === 'Cash') {
        // Save bill in 'Cash' collection
        await addDoc(collection(firestore, 'Cash'), billData);
      } else {
        // Save bill in the chosen payment method collection
        await addDoc(collection(firestore, paymentMethod), paymentData);
      }
  
      // Save remaining balance in 'remaings' collection
      await addDoc(collection(firestore, 'remaings'), {
        customerName,
        remainingBalance: remaining,
        date: new Date(),
      });
  
      // Update product quantities
      for (let item of cart) {
        if (item.product && item.quantity > 0) {
          try {
            const productRef = doc(firestore, 'products', item.product.id);
            const productSnap = await getDoc(productRef);
  
            if (!productSnap.exists()) continue;
  
            const productData = productSnap.data();
  
            if (productData.productQuantity === undefined || productData.productQuantity === null) continue;
  
            const currentQuantity = productData.productQuantity;
            const newQuantity = currentQuantity - item.quantity;
  
            if (newQuantity < 0) continue;
  
            await updateDoc(productRef, { productQuantity: newQuantity });
          } catch (error) {
            console.error(`Error updating product ID ${item.product.id}:`, error.message);
          }
        }
      }
  
      // Reset cart and close modal
      setCart([{ product: null, quantity: 0, sellByPack: true, subtotal: 0, inputValue: '' }]);
      setTotal(0);
      setErrorMessage('');
      hideModal();
    } catch (error) {
      console.error('Error during payment process:', error.message);
    }
  };
    
  return (
    <section className="section">
      <h2>Point of Sale (POS)</h2>
      <table>
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Sell By</th>
            <th>Quantity</th>
            <th>Subtotal (PKR)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  placeholder="Type medicine name..."
                  value={item.inputValue}
                  onChange={(e) => handleProductInput(index, e.target.value)}
                  list={`product-hints-${index}`}
                />
                {suggestionsVisible && item.inputValue && (
                  <ul className="autocomplete-suggestions">
                    {products
                      .filter((product) =>
                        product.productName.toLowerCase().includes(item.inputValue.toLowerCase())
                      )
                      .map((product) => (
                        <li
                          key={product.id}
                          onClick={() => {
                            handleCartChange(index, 'product', product);
                            setSuggestionsVisible(false);
                          }}
                        >
                          {product.productName}
                        </li>
                      ))}
                  </ul>
                )}
              </td>
              <td>
                <select
                  value={item.sellByPack ? 'Pack' : 'Tab'}
                  onChange={(e) => handleCartChange(index, 'sellByPack', e.target.value)}
                >
                  <option value="Pack">Pack</option>
                  <option value="Tab">Tab</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={item.quantity}
                  min="0"
                  onChange={(e) => handleCartChange(index, 'quantity', e.target.value)}
                />
              </td>
              <td>{item.subtotal ? item.subtotal.toFixed(2) : '0.00'}</td>
              <td>
                <button onClick={() => removeCartItem(index)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addNewCartItem}>Add More Items</button>
      <h3>Total: PKR {total.toFixed(2)}</h3>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button className="primary-button" onClick={showModal}>
        Generate Bill
      </button>

      {isModalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>Total Bill: PKR {total.toFixed(2)}</h3>
            <label>
              Customer Name:
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
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
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setGivenCash(value);
                  setRemainingBalance(value - total); // Update remaining balance dynamically
                }}
              />
            </label>
            <input
                type="number"
                value={remainingBalance}
                readOnly
                style={{ color: remainingBalance < 0 ? 'red' : 'black' }} // Make it red if negative
              />
            <button onClick={handlePayment}>OK</button>
            <button onClick={hideModal}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default POS;
