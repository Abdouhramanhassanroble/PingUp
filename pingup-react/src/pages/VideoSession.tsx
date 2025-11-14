import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import JitsiRoom from '../Jitsi/JitsiRoom';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, faVideoSlash, faSignOutAlt, faUsers, faClock
} from '@fortawesome/free-solid-svg-icons';
import './VideoSession.css';

interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  subject: string;
  duration: string;
  date: string;
  time: string;
  endTime?: string;
  status: string;
}

const VideoSession: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        if (bookingId) {
          await fetchBookingData(user.uid);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [bookingId, navigate]);

  const fetchBookingData = async (userId: string) => {
    try {
      if (!bookingId) {
        setError('ID de session manquant');
        setLoading(false);
        return;
      }

      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      
      if (!bookingDoc.exists()) {
        setError('Session non trouvée');
        setLoading(false);
        return;
      }

      const bookingData = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;
      setBooking(bookingData);

      // Vérifier que l'utilisateur est autorisé (tuteur ou étudiant de cette session)
      if (bookingData.tutorId === userId || bookingData.studentId === userId) {
        setIsAuthorized(true);
        
        // Vérifier que la session est confirmée
        if (bookingData.status !== 'confirmed') {
          setError('Cette session n\'est pas encore confirmée');
        }
      } else {
        setError('Vous n\'êtes pas autorisé à accéder à cette session');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la session:', err);
      setError('Erreur lors du chargement de la session');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isSessionTime = () => {
    if (!booking) return false;
    
    const now = new Date();
    const [year, month, day] = booking.date.split('-').map(Number);
    const [hours, minutes] = booking.time.split(':').map(Number);
    
    const sessionStart = new Date(year, month - 1, day, hours, minutes);
    const sessionEnd = new Date(sessionStart);
    
    // Ajouter la durée en fonction du type de session
    if (booking.duration === '15min') {
      sessionEnd.setMinutes(sessionEnd.getMinutes() + 15);
    } else if (booking.duration === '30min') {
      sessionEnd.setMinutes(sessionEnd.getMinutes() + 30);
    } else if (booking.duration === 'hour') {
      sessionEnd.setHours(sessionEnd.getHours() + 1);
    }
    
    // Permettre d'accéder 5 minutes avant et 30 minutes après
    const earlyAccess = new Date(sessionStart);
    earlyAccess.setMinutes(earlyAccess.getMinutes() - 5);
    
    const lateAccess = new Date(sessionEnd);
    lateAccess.setMinutes(lateAccess.getMinutes() + 30);
    
    return now >= earlyAccess && now <= lateAccess;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="video-session-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement de la session...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !booking || !isAuthorized) {
    return (
      <>
        <Navbar />
        <div className="video-session-container">
          <div className="error-container">
            <FontAwesomeIcon icon={faVideoSlash} size="3x" />
            <h2>Accès à la session impossible</h2>
            <p>{error || 'Session non trouvée'}</p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/dashboard')}
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!isSessionTime()) {
    const sessionDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const isBeforeSession = now < sessionDateTime;
    
    return (
      <>
        <Navbar />
        <div className="video-session-container">
          <div className="session-info-container">
            <FontAwesomeIcon icon={faClock} size="3x" />
            <h2>
              {isBeforeSession ? 'Session programmée' : 'Session terminée'}
            </h2>
            <div className="session-details">
              <h3>Détails de la session</h3>
              <p><strong>Matière :</strong> {booking.subject}</p>
              <p><strong>Date :</strong> {formatDate(booking.date)}</p>
              <p><strong>Heure :</strong> {booking.time}</p>
              <p><strong>Durée :</strong> {
                booking.duration === '15min' ? '15 minutes' :
                booking.duration === '30min' ? '30 minutes' :
                '1 heure'
              }</p>
              <p><strong>
                {currentUser?.uid === booking.tutorId ? 'Étudiant' : 'Tuteur'} :
              </strong> {
                currentUser?.uid === booking.tutorId ? booking.studentName : booking.tutorName
              }</p>
            </div>
            
            {isBeforeSession && (
              <p className="access-info">
                Vous pourrez accéder à cette session 5 minutes avant l'heure prévue.
              </p>
            )}
            
            <button 
              className="btn-primary" 
              onClick={() => navigate('/dashboard')}
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  // Créer un nom de salle unique basé sur l'ID de la réservation
  const roomName = `pingup-session-${bookingId}`;
  const userName = currentUser?.displayName || currentUser?.email || 'Utilisateur';

  return (
    <>
      <Navbar />
      <div className="video-session-container">
        <div className="session-header">
          <div className="session-info">
            <h1>
              <FontAwesomeIcon icon={faVideo} />
              Session de {booking.subject}
            </h1>
            <div className="participants">
              <FontAwesomeIcon icon={faUsers} />
              <span>{booking.tutorName} & {booking.studentName}</span>
            </div>
          </div>
          
          <div className="session-controls">
            <div className="session-time">
              {booking.time} - {booking.endTime || 'En cours'}
            </div>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              title="Quitter la session"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Quitter
            </button>
          </div>
        </div>

        <div className="video-container">
          <JitsiRoom 
            roomName={roomName}
            userName={userName}
          />
        </div>

        <div className="session-footer">
          <div className="session-tips">
            <h4>Conseils pour une meilleure expérience :</h4>
            <ul>
              <li>Utilisez un casque pour éviter l'écho</li>
              <li>Assurez-vous d'avoir une bonne connexion internet</li>
              <li>Testez votre micro et votre caméra avant de commencer</li>
              <li>Partagez votre écran si nécessaire pour les exercices</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoSession; 