import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';

export default function Home({ error }: { error?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for redirect result when returning from mobile sign-in
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          if (result.user.email?.endsWith('@velocity-swimming.com')) {
            navigate('/admin');
          } else {
            setAuthError('Unauthorized: You must use a @velocity-swimming.com email address.');
            // Removed auth.signOut() so the app state can persist and show the logout button
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err);
        setAuthError('Failed to sign in. Please try again.');
        setLoading(false);
      });
  }, [navigate]);

  const handleAdminLogin = async () => {
    try {
      setAuthError(null);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Mobile browsers often crash or block popups, so use redirect
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Desktop can safely use popup
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user.email?.endsWith('@velocity-swimming.com')) {
          navigate('/admin');
        } else {
          setAuthError('Unauthorized: You must use a @velocity-swimming.com email address.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Failed to sign in. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <p style={{ color: 'var(--text-secondary)' }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  const isWrongEmail = auth.currentUser && !auth.currentUser.email?.endsWith('@velocity-swimming.com');

  return (
    <div className="login-container">
      <div className="login-card">
        <img
          src="/team-banner.png"
          alt="Velocity Swimming"
          style={{ width: '100%', maxWidth: '300px', marginBottom: '1.5rem', borderRadius: '8px' }}
        />

        {isWrongEmail ? (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Authentication Error
            </p>
            <p style={{ color: 'var(--absent-color)', marginBottom: '2rem', fontWeight: 500 }}>
              Unauthorized: You must use a @velocity-swimming.com email address.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => auth.signOut()}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', backgroundColor: 'var(--text-secondary)' }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Sign in to take attendance.
            </p>

            {(error || authError) && (
              <p style={{ color: 'var(--absent-color)', marginBottom: '1rem' }}>
                {error || authError}
              </p>
            )}

            <button
              className="btn btn-primary"
              onClick={handleAdminLogin}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
