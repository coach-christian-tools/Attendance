import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import Home from './pages/Home';
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
          path="/" 
          element={isAuthorized ? <Navigate to="/admin" replace /> : <Home error={user && !isAuthorized ? "Unauthorized domain." : undefined} />} 
        />
        <Route 
          path="/admin" 
          element={isAuthorized ? <AdminDashboard /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
