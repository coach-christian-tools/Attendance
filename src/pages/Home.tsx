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
    <div className="login-container">
      <div className="login-card">
        <img
          src="/team-banner.png"
          alt="Velocity Swimming"
          style={{ width: '100%', maxWidth: '300px', marginBottom: '1.5rem', borderRadius: '8px' }}
        />

        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Sign in to take attendance.
        </p>

        {error && <p style={{ color: 'var(--absent-color)', marginBottom: '1rem' }}>{error}</p>}

        <button
          className="btn btn-primary"
          onClick={handleAdminLogin}
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
