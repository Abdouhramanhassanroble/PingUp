import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarCheck, faClockRotateLeft, faChalkboardTeacher,
  faUser, faCalendarAlt, faClock, faMoneyBillWave, faStar, faCheck, faTimes,
  faGraduationCap, faClockFour
} from '@fortawesome/free-solid-svg-icons';
import './TutorDashboard.css';
import { sendBookingConfirmationEmail, sendBookingRejectionEmail } from '../services/emailService';

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

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');

  // Vérifier l'authentification et les rôles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Vérifier si l'utilisateur est un tuteur
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().roles?.includes('tutor')) {
            setProfileData(userDoc.data());
            loadBookings(user.uid);
          } else {
            // Rediriger si non tuteur
            navigate('/profile');
          }
        } catch (err) {
          console.error("Erreur lors de la vérification du profil:", err);
          setError("Erreur lors du chargement des données. Veuillez réessayer.");
          setLoading(false);
        }
      } else {
        navigate('/login', { state: { returnUrl: '/tutor-dashboard' } });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Charger les réservations du tuteur
  const loadBookings = async (userId: string) => {
    setLoading(true);
    try {
      // Créer une requête pour récupérer les réservations où le tuteur est l'utilisateur actuel
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('tutorId', '==', userId)
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

  // Mise à jour du statut d'une réservation
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      // Récupérer les données de la réservation
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        throw new Error("La réservation n'existe pas");
      }
      
      const bookingData = bookingDoc.data();
      
      // Mettre à jour le statut
      await updateDoc(bookingRef, {
        status: newStatus
      });
      
      // Mettre à jour l'état local
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus } 
          : booking
      ));
      
      // Si le statut est "confirmed", envoyer un email de confirmation
      if (newStatus === 'confirmed') {
        try {
          await sendBookingConfirmationEmail({
            tutorName: bookingData.tutorName,
            tutorEmail: bookingData.tutorEmail || '',
            studentName: bookingData.studentName,
            studentEmail: bookingData.studentEmail || '',
            subject: bookingData.subject,
            date: new Date(bookingData.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: bookingData.time,
            endTime: bookingData.endTime || '',
            duration: bookingData.duration === '15min' ? '15 minutes' : 
                     bookingData.duration === '30min' ? '30 minutes' : '1 heure',
            price: bookingData.price,
            notes: bookingData.notes
          });
          console.log('Email de confirmation envoyé avec succès');
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
          // On continue même en cas d'échec d'envoi d'email
        }
      }
      
      // Si le statut est "rejected", envoyer un email de refus
      if (newStatus === 'rejected') {
        try {
          await sendBookingRejectionEmail({
            tutorName: bookingData.tutorName,
            tutorEmail: bookingData.tutorEmail || '',
            studentName: bookingData.studentName,
            studentEmail: bookingData.studentEmail || '',
            subject: bookingData.subject,
            date: new Date(bookingData.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: bookingData.time,
            endTime: bookingData.endTime || '',
            duration: bookingData.duration === '15min' ? '15 minutes' : 
                     bookingData.duration === '30min' ? '30 minutes' : '1 heure',
            price: bookingData.price,
            notes: bookingData.notes,
            rejectionReason: rejectionReason
          });
          console.log('Email de refus envoyé avec succès');
          
          // Réinitialiser le champ de raison de refus
          setRejectionReason('');
          setShowRejectionModal(false);
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de refus:', emailError);
          // On continue même en cas d'échec d'envoi d'email
        }
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Impossible de mettre à jour le statut. Veuillez réessayer.');
    }
  };

  // Filtrer les réservations en fonction de l'onglet actif
  const filteredBookings = bookings.filter(booking => {
    const isPast = isSessionPast(booking.date, booking.time);
    
    switch(activeTab) {
      case 'upcoming':
        return !isPast && booking.status === 'confirmed';
      case 'past':
        return isPast;
      case 'confirmed':
        return booking.status === 'confirmed' && !isPast;
      case 'pending':
        return booking.status === 'pending';
      default:
        return true;
    }
  });

  // Calculer les statistiques
  const totalSessions = bookings.length;
  const upcomingSessions = bookings.filter(b => !isSessionPast(b.date, b.time) && b.status === 'confirmed').length
  const pendingSessions = bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((total, booking) => total + booking.price, 0);

  // Afficher la modal de refus
  const handleRejectClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowRejectionModal(true);
  };
  
  // Confirmer le refus avec la raison
  const confirmRejection = () => {
    if (selectedBookingId) {
      updateBookingStatus(selectedBookingId, 'rejected');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="tutor-dashboard-container">
          <div className="loader"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="tutor-dashboard-container">
        <div className="tutor-dashboard-header">
          <h1>Tableau de bord tuteur</h1>
          <p>Gérez vos sessions de tutorat</p>
        </div>

        <div className="tutor-dashboard-content">
          {/* Section des statistiques */}
          <div className="tutor-dashboard-section">
            <h2>
              <FontAwesomeIcon icon={faGraduationCap} />
              Mes statistiques
            </h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
                  <FontAwesomeIcon icon={faCalendarCheck} />
                </div>
                <div className="stat-details">
                  <h3>Sessions totales</h3>
                  <div className="stat-value">{totalSessions}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#22c55e' }}>
                  <FontAwesomeIcon icon={faClockFour} />
                </div>
                <div className="stat-details">
                  <h3>Sessions à venir</h3>
                  <div className="stat-value">{upcomingSessions}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
                  <FontAwesomeIcon icon={faStar} />
                </div>
                <div className="stat-details">
                  <h3>Sessions en attente</h3>
                  <div className="stat-value">{pendingSessions}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#6b7280' }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                </div>
                <div className="stat-details">
                  <h3>Revenus totaux</h3>
                  <div className="stat-value">{totalRevenue}€</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section des réservations */}
          <div className="tutor-dashboard-section">
            <h2>
              <FontAwesomeIcon icon={faCalendarCheck} />
              Mes sessions
            </h2>

            {error && <div className="error-alert">{error}</div>}

            <div className="booking-tabs">
              <button 
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Toutes les sessions
              </button>
              <button 
                className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                À venir
              </button>
              <button 
                className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
                onClick={() => setActiveTab('past')}
              >
                Terminées
              </button>
              <button 
                className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                En attente
              </button>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="no-bookings">
                <p>Aucune session trouvée dans cette catégorie.</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {filteredBookings.map((booking) => {
                  const isPast = isSessionPast(booking.date, booking.time);
                  
                  return (
                    <div 
                      key={booking.id} 
                      className={`booking-card ${isPast ? 'past-session' : ''}`}
                    >
                      <div className="booking-header">
                        <div className="booking-status">
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status === 'confirmed' ? 'Confirmé' : 
                             booking.status === 'pending' ? 'En attente' : 
                             booking.status === 'cancelled' ? 'Annulé' : booking.status}
                          </span>
                          {isPast && (
                            <span className="status-badge past">Passé</span>
                          )}
                        </div>
                        <div className="booking-price">{booking.price}€</div>
                      </div>
                      
                      <div className="booking-student">
                        <FontAwesomeIcon icon={faUser} />
                        <div>
                          <span className="label">Étudiant</span>
                          <span className="value">{booking.studentName}</span>
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
                        {!isPast && booking.status === 'confirmed' && (
                          <button 
                            className="btn-cancel"
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          >
                            Annuler
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              className="btn-confirm"
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            >
                              <FontAwesomeIcon icon={faCheck} /> Confirmer
                            </button>
                            <button 
                              className="btn-reject"
                              onClick={() => handleRejectClick(booking.id)}
                            >
                              <FontAwesomeIcon icon={faTimes} /> Refuser
                            </button>
                          </>
                        )}
                        <button 
                          className="btn-view"
                          onClick={() => {
                            // Redirection vers le profil de l'étudiant (à implémenter)
                            console.log('Voir le profil de l\'étudiant', booking.studentId);
                          }}
                        >
                          Voir l'étudiant
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Modal de refus */}
        {showRejectionModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Refuser la réservation</h3>
              <p>Veuillez indiquer la raison du refus (optionnel) :</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Indisponible à cette date, problème de planning, etc."
                rows={4}
              />
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowRejectionModal(false)}
                >
                  Annuler
                </button>
                <button 
                  className="btn-reject"
                  onClick={confirmRejection}
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TutorDashboard; 