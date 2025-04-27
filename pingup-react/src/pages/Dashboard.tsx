import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarCheck, faClockRotateLeft, faChalkboardTeacher,
  faUser, faCalendarAlt, faClock
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';

interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  duration: string;
  date: string;
  time: string;
  endTime?: string;
  price: number;
  notes: string;
  status: string;
  createdAt: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');

  // Vérifier l'authentification et charger les réservations
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        loadBookings(user.uid);
      } else {
        navigate('/login', { state: { returnUrl: '/dashboard' } });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Charger les réservations de l'étudiant
  const loadBookings = async (userId: string) => {
    setLoading(true);
    try {
      // Créer une requête pour récupérer les réservations où l'étudiant est l'utilisateur actuel
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('studentId', '==', userId)
      );

      const querySnapshot = await getDocs(bookingsQuery);
      const bookingsData: Booking[] = [];

      querySnapshot.forEach((doc) => {
        bookingsData.push({ 
          id: doc.id,
          ...doc.data() 
        } as Booking);
      });

      // Trier les réservations par date (la plus récente d'abord)
      bookingsData.sort((a, b) => {
        // Si les deux dates sont les mêmes, comparer les heures
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        // Sinon comparer les dates
        return a.date.localeCompare(b.date);
      });

      setBookings(bookingsData);
    } catch (err) {
      console.error('Erreur lors du chargement des réservations:', err);
      setError('Impossible de charger vos réservations. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formater durée pour l'affichage
  const formatDuration = (duration: string) => {
    switch (duration) {
      case '15min':
        return '15 minutes';
      case '30min':
        return '30 minutes';
      case 'hour':
        return '1 heure';
      default:
        return duration;
    }
  };

  // Déterminer si une session est passée
  const isSessionPast = (dateStr: string, timeStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const sessionDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    
    return sessionDate < now;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="loader"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Mon tableau de bord</h1>
          <p>Gérez vos sessions de tutorat</p>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-section">
            <h2>
              <FontAwesomeIcon icon={faCalendarCheck} />
              Mes réservations
            </h2>

            {error && <div className="error-alert">{error}</div>}

            {bookings.length === 0 ? (
              <div className="no-bookings">
                <p>Vous n'avez pas encore de réservations.</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/find-tutor')}
                >
                  Trouver un tuteur
                </button>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.map((booking) => {
                  const isPast = isSessionPast(booking.date, booking.time);
                  
                  return (
                    <div 
                      key={booking.id} 
                      className={`booking-card ${isPast ? 'past-session' : ''}`}
                    >
                      <div className="booking-header">
                        <div className="booking-status">
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status === 'confirmed' ? 'Confirmé' : booking.status}
                          </span>
                          {isPast && (
                            <span className="status-badge past">Passé</span>
                          )}
                        </div>
                        <div className="booking-price">{booking.price}€</div>
                      </div>
                      
                      <div className="booking-tutor">
                        <FontAwesomeIcon icon={faUser} />
                        <div>
                          <span className="label">Tuteur</span>
                          <span className="value">{booking.tutorName}</span>
                        </div>
                      </div>
                      
                      <div className="booking-subject">
                        <FontAwesomeIcon icon={faChalkboardTeacher} />
                        <div>
                          <span className="label">Matière</span>
                          <span className="value">{booking.subject}</span>
                        </div>
                      </div>
                      
                      <div className="booking-date">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <div>
                          <span className="label">Date</span>
                          <span className="value">{formatDate(booking.date)}</span>
                        </div>
                      </div>
                      
                      <div className="booking-time">
                        <FontAwesomeIcon icon={faClock} />
                        <div>
                          <span className="label">Horaire</span>
                          <span className="value">
                            {booking.time}
                            {booking.endTime ? ` - ${booking.endTime}` : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="booking-duration">
                        <FontAwesomeIcon icon={faClockRotateLeft} />
                        <div>
                          <span className="label">Durée</span>
                          <span className="value">{formatDuration(booking.duration)}</span>
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div className="booking-notes">
                          <span className="label">Notes</span>
                          <p>{booking.notes}</p>
                        </div>
                      )}
                      
                      <div className="booking-actions">
                        {!isPast && (
                          <button 
                            className="btn-cancel"
                            onClick={() => {
                              // TODO: Ajouter la fonctionnalité d'annulation
                              console.log('Annulation de la réservation', booking.id);
                            }}
                          >
                            Annuler
                          </button>
                        )}
                        <button 
                          className="btn-view"
                          onClick={() => {
                            // Redirection vers le profil du tuteur
                            navigate(`/tutor-profile/${booking.tutorId}`);
                          }}
                        >
                          Voir le tuteur
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard; 