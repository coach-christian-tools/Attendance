import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="login-container">Loading...</div>;
  }

  // Check if valid admin
  const isAuthorized = user && user.email?.endsWith('@velocity-swimming.com');

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : (isAuthorized ? <Navigate to="/" /> : <Login error="Unauthorized domain." />)} 
        />
        <Route 
          path="/" 
          element={isAuthorized ? <AdminDashboard /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
