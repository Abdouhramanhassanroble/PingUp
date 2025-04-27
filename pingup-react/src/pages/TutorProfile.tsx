import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';
import { FaStar, FaChalkboardTeacher, FaUser, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import './TutorProfile.css';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Tutor {
  id: string;
  displayName?: string;
  email?: string;
  roles?: string[];
  tutorSubjects?: string[];
  photoURL?: string;
  status?: string;
  bio?: string;
  availability?: TimeSlot[];
}

export default function TutorProfile() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDay, setCurrentDay] = useState<string>(getCurrentDay());
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeSlot());

  // Obtenir le jour actuel
  function getCurrentDay(): string {
    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }
  
  // Obtenir le créneau horaire actuel arrondi à la demi-heure
  function getCurrentTimeSlot(): string {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? "00" : "30";
    return `${hour.toString().padStart(2, '0')}:${roundedMinutes}`;
  }

  // Vérifie si un tuteur est disponible pour un créneau spécifique
  const isTutorAvailable = (tutor: Tutor, day: string, time: string): boolean => {
    if (!tutor.availability || tutor.availability.length === 0) {
      return false;
    }
    
    return tutor.availability.some(slot => {
      if (slot.day !== day) return false;
      
      // Vérifier si l'heure demandée est dans la plage de disponibilité
      return slot.startTime <= time && time <= slot.endTime;
    });
  };

  // Formater le jour en français avec majuscule
  const formatDay = (day: string): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Fonction pour trier les créneaux par jour de la semaine
  const sortByDay = (slots: TimeSlot[]): TimeSlot[] => {
    const dayOrder = { "lundi": 1, "mardi": 2, "mercredi": 3, "jeudi": 4, "vendredi": 5, "samedi": 6, "dimanche": 7 };
    
    return [...slots].sort((a, b) => {
      const orderA = dayOrder[a.day as keyof typeof dayOrder] || 0;
      const orderB = dayOrder[b.day as keyof typeof dayOrder] || 0;
      
      if (orderA === orderB) {
        return a.startTime.localeCompare(b.startTime);
      }
      
      return orderA - orderB;
    });
  };

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        setLoading(true);
        
        if (!tutorId) {
          setError("Identifiant du tuteur manquant");
          setLoading(false);
          return;
        }

        const tutorDocRef = doc(db, "users", tutorId);
        const tutorDocSnap = await getDoc(tutorDocRef);

        if (tutorDocSnap.exists()) {
          const data = tutorDocSnap.data();
          setTutor({
            id: tutorDocSnap.id,
            ...data
          } as Tutor);
        } else {
          setError("Tuteur non trouvé");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données du tuteur:", err);
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [tutorId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="tutor-profile-container">
          <div className="tutor-profile-card loading">
            <div className="loader"></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !tutor) {
    return (
      <>
        <Navbar />
        <div className="tutor-profile-container">
          <div className="tutor-profile-card error">
            <h2>Erreur</h2>
            <p>{error || "Tuteur non trouvé"}</p>
            <button onClick={() => navigate('/find-tutor')} className="btn-primary">
              Retour à la recherche
            </button>
          </div>
        </div>
      </>
    );
  }

  const isAvailableNow = isTutorAvailable(tutor, currentDay, currentTime);

  return (
    <>
      <Navbar />
      <div className="tutor-profile-container">
        <div className="tutor-profile-card">
          <div className="profile-header">
            <div className="profile-image">
              <img src={tutor.photoURL || "/default-avatar.png"} alt={tutor.displayName || tutor.email || "Tuteur"} />
            </div>
            <div className="profile-details">
              <h1>{tutor.displayName || tutor.email || "Tuteur"}</h1>
              <div className="rating">
                <FaStar /> 5.0 <span className="sessions">(50 sessions)</span>
              </div>
              <p className="availability">
                {isAvailableNow ? (
                  <span className="status available">
                    <BiTimeFive /> Disponible maintenant
                  </span>
                ) : (
                  <span className="status unavailable">
                    <FaClock /> Non disponible actuellement
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="profile-section">
            <h2><FaChalkboardTeacher /> Matières enseignées</h2>
            <div className="subjects-list">
              {tutor.tutorSubjects && tutor.tutorSubjects.length > 0 ? (
                tutor.tutorSubjects.map((subject, index) => (
                  <div key={index} className="subject-chip">
                    {subject}
                  </div>
                ))
              ) : (
                <p>Aucune matière spécifiée</p>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2><FaCalendarAlt /> Disponibilités</h2>
            {tutor.availability && tutor.availability.length > 0 ? (
              <div className="availability-list">
                {sortByDay(tutor.availability).map((slot, index) => (
                  <div key={index} className="availability-item">
                    <div className="day">{formatDay(slot.day)}</div>
                    <div className="time">{slot.startTime} - {slot.endTime}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-availability">Aucune disponibilité renseignée</p>
            )}
          </div>

          <div className="profile-section">
            <h2><FaUser /> À propos</h2>
            <p className="bio">
              {tutor.bio || "Tuteur expérimenté disponible pour vous aider à progresser rapidement dans vos études. Passionné et pédagogue, je m'adapte à votre niveau et à vos besoins spécifiques."}
            </p>
          </div>

          <div className="session-booking">
            <h2>Réserver une session</h2>
            <div className="session-details">
              <div className="price">
                <span className="amount">Sur devis</span>
                <span className="per">/ 15 minutes</span>
              </div>
              <button className="btn-book" disabled={!isAvailableNow}>
                {isAvailableNow ? "Démarrer une session" : "Non disponible"}
              </button>
            </div>
          </div>

          <div className="actions">
            <button onClick={() => navigate('/find-tutor')} className="btn-back">
              Retour à la recherche
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 