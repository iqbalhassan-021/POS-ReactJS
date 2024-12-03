import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [billGenerated, setBillGenerated] = useState(false); // To track if the bill has been generated
  const [errorMessage, setErrorMessage] = useState(''); // To store error message

  // Fetch products from Firestore
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
        console.error("Error fetching products: ", error.message);
      }
    };

    fetchProducts();
  }, []);

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(productId);
    setPrice(product ? product.sellingPrice : 0);
  };

  const handleQuantityChange = (e) => {
    const qty = parseInt(e.target.value, 10);
    setQuantity(qty);
    setSubtotal(qty * price);
  };

  const addToCart = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product || quantity <= 0) return;

    const updatedCart = [...cart, { ...product, quantity, subtotal }];
    setCart(updatedCart);
    setTotal(total + subtotal);
    setQuantity(0);  // Reset quantity input after adding to cart
    setErrorMessage(''); // Clear error message when an item is added
  };

  const generateBill = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add items to the cart before generating the bill.');
      return; // Do not proceed if cart is empty
    }

    try {
      // Create bill document in Firestore
      const billData = {
        items: cart,
        total,
        date: new Date(),
      };
      await addDoc(collection(firestore, 'bills'), billData);

      // Update product quantities in Firestore
      for (let item of cart) {
        const productRef = doc(firestore, 'products', item.id);
        await updateDoc(productRef, {
          productQuantity: item.productQuantity - item.quantity,
        });
      }

      setBillGenerated(true); // Set bill generated to true
    } catch (error) {
      console.error("Error generating bill: ", error.message);
    }
  };

  const clearBill = () => {
    setCart([]);
    setTotal(0);
    setBillGenerated(false); // Reset bill generated state
    setErrorMessage(''); // Reset error message
  };

  return (
    <section className="section">
      <h2>Point of Sale (POS)</h2>
      <form className="form">
        <label>
          Select Product:
          <select required value={selectedProduct} onChange={handleProductChange}>
  <option value="" disabled>Select a product</option>
  {products
    .filter((product) => product.productQuantity > 0) // Filter out products with 0 quantity
    .map((product) => (
      <option key={product.id} value={product.id}>
        {product.productName} - {product.productQuantity} available
      </option>
    ))}
</select>

        </label>

        <label>
          Price: <input type="number" value={price} readOnly />
        </label>

        <label>
          Quantity: <input required type="number" value={quantity} onChange={handleQuantityChange} min="1" />
        </label>

        <button type="button" onClick={addToCart}>Add to Cart</button>
      </form>

      <h3>Cart</h3>
      {cart.length > 0 ? (
        <div>
          {cart.map((item, index) => (
            <div key={index}>
              <h4>{item.productName}</h4>
              <p>Quantity: {item.quantity}</p>
              <p>Subtotal: PKR{item.subtotal.toFixed(2)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No items in the cart.</p>
      )}

      <h3>Total: PKR{total.toFixed(2)}</h3>

      {/* Display error message if cart is empty */}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {!billGenerated ? (
        <button type="button" className="primary-button" onClick={generateBill}>Generate Bill</button>
      ) : (
        <div>
          <h3>Bill Generated</h3>
          <p>Total: PKR{total.toFixed(2)}</p>
          <button type="button" className="primary-button" onClick={clearBill}>Clear</button>
        </div>
      )}
    </section>
  );
};

export default POS;
