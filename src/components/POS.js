import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [sellByPack, setSellByPack] = useState(true); // Toggle between pack or tabs
  const [subtotal, setSubtotal] = useState(0);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [billGenerated, setBillGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(firestore, 'products');
        const productDocs = await getDocs(productsCollection);
        const productData = productDocs.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (product) =>
              product.productQuantity > 0 && product.tabsPerPack > 0 // Only show products with packs or tabs
          );
        setProducts(productData);
      } catch (error) {
        console.error('Error fetching products: ', error.message);
      }
    };

    fetchProducts();
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    const filteredSuggestions = products.filter((product) =>
      product.productName.toLowerCase().includes(term.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
  };

  const selectProduct = (product) => {
    setSearchTerm(product.productName);
    setSelectedProduct(product);
    setPrice(sellByPack ? product.sellingPrice : calculateTabPrice(product));
    setSuggestions([]);
  };

  const calculateTabPrice = (product) => {
    if (!product || !product.tabsPerPack || product.tabsPerPack === 0) return 0;
    return product.sellingPrice / product.tabsPerPack;
  };

  const handleQuantityChange = (e) => {
    const qty = parseInt(e.target.value, 10);
    setQuantity(qty);
    setSubtotal(qty * price);
  };

  const toggleSellBy = () => {
    if (selectedProduct) {
      setPrice(
        sellByPack
          ? calculateTabPrice(selectedProduct)
          : selectedProduct.sellingPrice
      );
    }
    setSellByPack(!sellByPack);
  };

  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      setErrorMessage('Please select a valid product and quantity.');
      return;
    }

    // Check if there is enough stock based on the selling mode (pack or tabs)
    let requiredQuantity = 0;
    if (sellByPack) {
      requiredQuantity = quantity;
    } else {
      requiredQuantity = quantity * selectedProduct.tabsPerPack;
    }

    if (selectedProduct.productQuantity < requiredQuantity) {
      setErrorMessage('Not enough stock available.');
      return;
    }

    // Add product to cart if enough stock is available
    const updatedCart = [...cart, { ...selectedProduct, quantity, subtotal }];
    setCart(updatedCart);
    setTotal(total + subtotal);
    setQuantity(0); // Reset quantity input after adding to cart
    setSubtotal(0);
    setErrorMessage(''); // Clear error message on success
  };

  const removeFromCart = (index) => {
    const updatedCart = cart.filter((_, idx) => idx !== index);
    const removedItem = cart[index];
    setCart(updatedCart);
    setTotal(total - removedItem.subtotal);
  };

  const generateBill = async () => {
    if (cart.length === 0) {
      setErrorMessage('Please add items to the cart before generating the bill.');
      return;
    }

    try {
      const billData = {
        items: cart,
        total,
        date: new Date(),
      };
      await addDoc(collection(firestore, 'bills'), billData);

      // Update product quantities in Firestore
      for (let item of cart) {
        const productRef = doc(firestore, 'products', item.id);

        let decrementBy = 0;

        if (sellByPack) {
          // If selling by pack, decrement by the quantity of packs sold
          decrementBy = item.quantity;
        } else {
          // If selling by tabs, decrement by the quantity of tabs sold
          decrementBy = item.quantity * item.tabsPerPack;
        }

        // Decrement product quantity based on the selected mode (packs or tabs)
        const updatedQuantity = item.productQuantity - decrementBy;
        await updateDoc(productRef, { productQuantity: updatedQuantity });
      }

      setBillGenerated(true);
    } catch (error) {
      console.error('Error generating bill: ', error.message);
    }
  };

  const clearBill = () => {
    setCart([]);
    setTotal(0);
    setBillGenerated(false);
    setErrorMessage('');
  };

  return (
    <section className="section">
      <h2>Point of Sale (POS)</h2>
      <form className="form">
        <label>
          Search Product:
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search product"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((product) => (
                <li key={product.id} onClick={() => selectProduct(product)}>
                  {product.productName}
                </li>
              ))}
            </ul>
          )}
        </label>

        {selectedProduct && (
          <>
            <label>
              Selling By:
              <button type="button" onClick={toggleSellBy}>
                {sellByPack ? 'Pack' : 'Tabs'}
              </button>
            </label>

            <label>
              Price:
              <input type="number" value={Number(price).toFixed(2)} readOnly />
            </label>

            <label>
              Quantity:
              <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
              />
            </label>

            <button type="button" onClick={addToCart}>
              Add to Cart
            </button>
          </>
        )}
      </form>

      <h3>Cart</h3>
      {cart.length > 0 ? (
        <div>
          {cart.map((item, index) => (
            <div key={index}>
              <h4>{item.productName}</h4>
              <p>Quantity: {item.quantity}</p>
              <p>Subtotal: PKR {item.subtotal.toFixed(2)}</p>
              <button type="button" className="primary-button" style={{backgroundColor:'red'}} onClick={() => removeFromCart(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No items in the cart.</p>
      )}

      <h3>Total: PKR {total.toFixed(2)}</h3>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {!billGenerated ? (
        <button type="button" className="primary-button" onClick={generateBill}>
          Generate Bill
        </button>
      ) : (
        <div>
          <h3>Bill Generated</h3>
          <p>Total: PKR {total.toFixed(2)}</p>
          <button type="button" className="primary-button" onClick={clearBill}>
            Clear
          </button>
        </div>
      )}
    </section>
  );
};

export default POS;
