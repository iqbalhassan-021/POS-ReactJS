// Login.js
import React, { useState } from 'react';
import { firestore } from '../firebase'; // Adjust path as needed
import { collection, getDocs } from 'firebase/firestore';


const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginCollection = collection(firestore, 'login');
      const loginDocs = await getDocs(loginCollection);
      const loginData = loginDocs.docs.map((doc) => doc.data());

      const user = loginData.find(
        (user) => user.username === username && user.password === password
      );

      if (user) {
        onLoginSuccess(); // Call parent function to show dashboard
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('Error logging in, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Butt Pharmacy</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={handleUsernameChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
