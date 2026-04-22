import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';

export default function Home({ error }: { error?: string }) {
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email?.endsWith('@velocity-swimming.com')) {
        navigate('/admin');
      } else {
        alert('Unauthorized: You must use a @velocity-swimming.com email address.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="home-container" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--accent-color)', fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          Velocity Swimming
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          Welcome to the Velocity Attendance App.
        </p>
      </div>

      <div style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {error && <p style={{ color: 'var(--absent-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        <button 
          onClick={handleAdminLogin} 
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            opacity: 0.7,
            textDecoration: 'underline'
          }}
        >
          I am an Admin
        </button>
      </div>
    </div>
  );
}
