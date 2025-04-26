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
  const { login } = useAuth();
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
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? 'Chargement...' : 'Se connecter'}
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
