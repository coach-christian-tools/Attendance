import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Login({ error }: { error?: string }) {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user.email?.endsWith('@velocity-swimming.com')) {
        await signOut(auth);
        alert('Unauthorized: You must use a @velocity-swimming.com email address.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Velocity Swimming</h1>
        <p>Admin Portal</p>
        {error && <p style={{ color: 'var(--absent-color)' }}>{error}</p>}
        <button className="btn btn-primary" onClick={handleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
