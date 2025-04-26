import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import "./Navbar.css";
import { FaUserCircle, FaSearch, FaChalkboardTeacher, FaGraduationCap, FaBell } from 'react-icons/fa';

interface UserData {
  roles?: string[];
  email?: string;
}

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data() as UserData);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setIsDropdownOpen(false);
      setUserData(null);
      navigate("/");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  // Fonction pour le défilement doux vers les ancres (uniquement pour la page d'accueil)
  const scrollToSection = (id: string) => {
    if (isHomePage) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${id}`);
    }
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <img src="/PingUpBlackLogo.jpg" alt="PingUp Logo" className="navbar-logo" />
        </Link>
      </div>

      <div className="navbar-right">
        {isAuthenticated ? (
          // Navigation pour utilisateurs connectés
          <ul className="nav-links">
            {userData?.roles?.includes('student') && (
              <li>
                <Link to="/find-tutor" className="nav-link">
                  <FaSearch className="nav-icon" />
                  Trouver un tuteur
                </Link>
              </li>
            )}
            {userData?.roles?.includes('tutor') && (
              <li>
                <Link to="/tutor-dashboard" className="nav-link">
                  <FaChalkboardTeacher className="nav-icon" />
                  Espace tuteur
                </Link>
              </li>
            )}
            {userData?.roles?.includes('student') && (
              <li>
                <Link to="/student-dashboard" className="nav-link">
                  <FaGraduationCap className="nav-icon" />
                  Mes sessions
                </Link>
              </li>
            )}
            <li>
              <Link to="/notifications" className="nav-link">
                <FaBell className="nav-icon" />
                <span className="notification-badge">2</span>
              </Link>
            </li>
          </ul>
        ) : (
          // Navigation pour visiteurs
          <ul className="nav-links">
            <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Nos services</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>Qui sommes-nous</a></li>
          </ul>
        )}

        <div className="dropdown">
          {isAuthenticated ? (
            <>
              <button 
                className="btn-icon" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title={userData?.email || "Profil"}
              >
                <FaUserCircle size={28} />
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <FaUserCircle size={24} />
                    <span>{userData?.email}</span>
                  </div>
                  <button onClick={handleProfileClick} className="dropdown-item">Mon profil</button>
                  <Link to="/settings" className="dropdown-item">Paramètres</Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">Se déconnecter</button>
                </div>
              )}
            </>
          ) : (
            <>
              <button 
                className="btn-primary" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                S'identifier
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/register" className="dropdown-item">S'inscrire</Link>
                  <Link to="/login" className="dropdown-item">Se connecter</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
