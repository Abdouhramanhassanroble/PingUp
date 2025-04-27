import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { FaUser, FaEdit } from 'react-icons/fa';
import './Profile.css';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  roles: string[];
  studentSubjects: string[];
  tutorSubjects: string[];
  photoURL?: string;
  bio?: string;
  createdAt: any;
  status: string;
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        
        if (!user) {
          // Si l'utilisateur n'est pas connecté, redirigez vers la page de connexion
          navigate('/login');
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserData;
          console.log("User data loaded:", data);
          setUserData(data);
        } else {
          console.error("No user document found");
          setError("Aucune donnée utilisateur trouvée");
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Une erreur est survenue lors du chargement des données");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="profile-card loading">
            <div className="loader"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="profile-card error">
            <h2>Erreur</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Retour à la page de connexion
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="profile-card error">
            <h2>Profil non disponible</h2>
            <p>Impossible de charger vos données. Veuillez vous reconnecter.</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Se connecter
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header-with-photo">
            <div className="profile-photo">
              {userData.photoURL ? (
                <img src={userData.photoURL} alt={userData.displayName || "Photo de profil"} />
              ) : (
                <div className="no-photo">
                  <FaUser />
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2>{userData.displayName || "Utilisateur"}</h2>
              <p className="profile-email">{userData.email}</p>
            </div>
          </div>

          <div className="profile-section">
            <h3>Vos rôles</h3>
            <div className="role-badges">
              {userData.roles.includes('student') && (
                <div className="role-badge student">
                  <span className="icon">👨‍🎓</span>
                  <span>Étudiant</span>
                </div>
              )}
              {userData.roles.includes('tutor') && (
                <div className="role-badge tutor">
                  <span className="icon">👨‍🏫</span>
                  <span>Tuteur</span>
                </div>
              )}
            </div>
          </div>

          {userData.bio && (
            <div className="profile-section">
              <h3>À propos de moi</h3>
              <div className="profile-bio">
                <p>{userData.bio}</p>
              </div>
            </div>
          )}

          {userData.roles.includes('student') && userData.studentSubjects.length > 0 && (
            <div className="profile-section">
              <h3>Matières en tant qu'étudiant</h3>
              <div className="subject-list">
                {userData.studentSubjects.map((subject) => (
                  <div key={subject} className="subject-chip">
                    {subject}
                  </div>
                ))}
              </div>
            </div>
          )}

          {userData.roles.includes('tutor') && userData.tutorSubjects.length > 0 && (
            <div className="profile-section">
              <h3>Matières en tant que tuteur</h3>
              <div className="subject-list">
                {userData.tutorSubjects.map((subject) => (
                  <div key={subject} className="subject-chip">
                    {subject}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="profile-actions">
            <button 
              className="btn-secondary"
              onClick={() => navigate('/edit-profile')}
            >
              <FaEdit /> Modifier le profil
            </button>
            {userData.roles.includes('student') && (
              <button className="btn-primary" onClick={() => navigate('/find-tutor')}>Trouver un tuteur</button>
            )}
            {userData.roles.includes('tutor') && (
              <button className="btn-primary" onClick={() => navigate('/tutor-dashboard')}>Voir mes demandes</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 