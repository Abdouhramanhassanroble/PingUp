import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore'; // <-- IMPORT IMPORTANT
import './Login.css';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setIsLoading(true);
  
      await login(email, password);
  
      const user = auth.currentUser; // ✅ ici
      if (!user) throw new Error("Aucun utilisateur connecté");
  
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;
  
        if (role === "student") {
          navigate('/student');
        } else if (role === "tutor") {
          navigate('/tutor');
        } else {
          navigate('/');
        }
      } else {
        setError("Informations utilisateur introuvables.");
      }
  
    } catch (err) {
      console.error(err);
      setError('Échec de l\'authentification');
    }
    setIsLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setIsGoogleLoading(true);
      
      await signInWithGoogle();
      
      const user = auth.currentUser;
      if (!user) throw new Error("Aucun utilisateur connecté");
      
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;
        
        // Si l'utilisateur n'a pas de rôle, rediriger vers le profil pour compléter
        if (!role || (Array.isArray(role) && role.length === 0)) {
          navigate('/profile');
        } else if (Array.isArray(role)) {
          if (role.includes("student")) {
            navigate('/student');
          } else if (role.includes("tutor")) {
            navigate('/tutor');
          } else {
            navigate('/');
          }
        } else {
          if (role === "student") {
            navigate('/student');
          } else if (role === "tutor") {
            navigate('/tutor');
          } else {
            navigate('/');
          }
        }
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Échec de l\'authentification Google');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page-container">
        <div className="video-background">
          <video autoPlay loop muted playsInline className="video-bg">
            <source src="/backgroundVideo.mp4" type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
          <div className="overlay"></div>
        </div>
        
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h2>Connexion à PingUp</h2>
              <p className="subtitle">
                Bienvenue ! Connectez-vous pour commencer
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="email-address">Adresse email</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="submit-button"
              >
                {isLoading ? 'Chargement...' : 'Se connecter'}
              </button>

              <div className="divider">
                <span>ou</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="google-button"
              >
                {isGoogleLoading ? (
                  'Connexion...'
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                    </svg>
                    Continuer avec Google
                  </>
                )}
              </button>

              <div className="switch-form">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="switch-button"
                >
                  Pas de compte ? S'inscrire
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
