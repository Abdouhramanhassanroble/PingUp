import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import "./Navbar.css";
import { FaUserCircle, FaSearch, FaChalkboardTeacher, FaGraduationCap, FaBars, FaTimes } from 'react-icons/fa';

interface UserData {
  roles?: string[];
  email?: string;
}

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    // Fermer le menu mobile lors du changement de route
    setMobileMenuOpen(false);

    return () => unsubscribe();
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setIsDropdownOpen(false);
      setUserData(null);
      setMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/profile');
  };

  // Fonction pour le défilement doux vers les ancres (uniquement pour la page d'accueil)
  const scrollToSection = (id: string) => {
    if (isHomePage) {
      // D'abord essayer de trouver par ID
      let element = document.getElementById(id);
      
      // Si pas trouvé, essayer de trouver par classe
      if (!element) {
        const elements = document.getElementsByClassName(id);
        if (elements.length > 0) {
          element = elements[0] as HTMLElement;
        }
      }
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.log(`Élément "${id}" non trouvé`);
      }
    } else {
      navigate(`/?section=${id}`);
    }
    setIsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Fermer le dropdown quand on ouvre/ferme le menu mobile
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <img src="/PingUpBlackLogo.jpg" alt="PingUp Logo" className="navbar-logo" />
        </Link>
        
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div className={`navbar-right ${mobileMenuOpen ? 'mobile-menu-active' : ''}`}>
        {isAuthenticated ? (
          // Navigation pour utilisateurs connectés
          <ul className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            {userData?.roles?.includes('student') && (
              <li>
                <Link to="/find-tutor" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FaSearch className="nav-icon" />
                  Trouver un tuteur
                </Link>
              </li>
            )}
            {userData?.roles?.includes('tutor') && (
              <li>
                <Link to="/tutor-dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FaChalkboardTeacher className="nav-icon" />
                  Espace tuteur
                </Link>
              </li>
            )}
            {userData?.roles?.includes('student') && (
              <li>
                <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FaGraduationCap className="nav-icon" />
                  Tableau de bord
                </Link>
              </li>
            )}
          </ul>
        ) : (
          // Navigation pour visiteurs
          <ul className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            <li>
              <a 
                href="#about" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  scrollToSection('about'); 
                }}
              >
                Qui sommes-nous
              </a>
            </li>
            <li>
              <a 
                href="#services" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  scrollToSection('services'); 
                }}
              >
                Nos services
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  scrollToSection('howitworks'); 
                }}
              >
                Comment ça marche
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  scrollToSection('featured-tutors'); 
                }}
              >
                Nos experts
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  scrollToSection('testimonials'); 
                }}
              >
                Témoignages
              </a>
            </li>
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
                  <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Paramètres</Link>
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
                  <Link to="/register" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>S'inscrire</Link>
                  <Link to="/login" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Se connecter</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
