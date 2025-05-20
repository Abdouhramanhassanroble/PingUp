import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, updateDoc, arrayUnion, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faClockRotateLeft,
  faCircleCheck, faUser, faCalendarAlt, faClock
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import './BookSession.css';
import { sendCalendarEventToZapier, CalendarEventData, formatCalendarDateTime } from '../services/zapierService';

type Tutor = {
  id: string;
  displayName?: string;
  email?: string;
  tutorSubjects?: string[];
  photoURL?: string;
  availability?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  price15min?: number;
  price30min?: number;
  priceHour?: number;
  rating?: number;
};

// Interface pour un créneau disponible
interface TimeSlot {
  day: string;
  date: string;
  time: string;
  formattedDay: string;
  endTime: string;
  durationMinutes: number;
}

const BookSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tutorId } = useParams<{ tutorId: string }>();
  const sessionPrice = location.state?.sessionPrice;
  const sessionType = location.state?.sessionType || '15min';
  
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [noSlotsMessage, setNoSlotsMessage] = useState('');
  
  // Form state
  const [duration, setDuration] = useState<'15min' | '30min' | 'hour'>(sessionType as '15min');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Derived state
  const [price, setPrice] = useState(sessionPrice || 0);
  
  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
      } else {
        // Redirect to login if not authenticated
        navigate('/login', { 
          state: { 
            returnUrl: `/find-tutor`,
            tutorId
          }
        });
      }
    });
    
    // Fetch tutor data if tutorId exists
    if (tutorId) {
      fetchTutorData();
    } else {
      setError('Tutor information not provided. Please select a tutor first.');
      setLoading(false);
    }
    
    return () => unsubscribe();
  }, [tutorId]);
  
  const fetchTutorData = async () => {
    try {
      const tutorDoc = await getDoc(doc(db, 'users', tutorId as string));
      if (tutorDoc.exists()) {
        const tutorData = { id: tutorDoc.id, ...tutorDoc.data() } as Tutor;
        setTutor(tutorData);
        
        // Logs pour déboguer les prix des sessions
        console.log("Prix des sessions du tuteur:", {
          "15min": tutorData.price15min,
          "30min": tutorData.price30min,
          "1h": tutorData.priceHour
        });
        
        // Si aucun prix n'est défini, afficher un message d'erreur
        if (!tutorData.price15min && !tutorData.price30min && !tutorData.priceHour) {
          setError("Ce tuteur n'a pas défini de tarifs pour ses sessions. Veuillez choisir un autre tuteur.");
        }
        
        // Générer tous les créneaux disponibles pour les 7 prochains jours
        if (tutorData.availability && tutorData.availability.length > 0) {
          await generateAllAvailableTimeSlots(tutorData.availability);
        }
      } else {
        setError('Tutor not found.');
      }
    } catch (err) {
      console.error('Error fetching tutor data:', err);
      setError('Failed to load tutor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (tutor) {
      // Set price based on selected duration
      console.log(`Mise à jour du prix et des créneaux pour la durée: ${duration}`);
      
      if (duration === '15min' && tutor.price15min) {
        setPrice(tutor.price15min);
        console.log(`Prix mis à jour: ${tutor.price15min}€`);
      } else if (duration === '30min' && tutor.price30min) {
        setPrice(tutor.price30min);
        console.log(`Prix mis à jour: ${tutor.price30min}€`);
      } else if (duration === 'hour' && tutor.priceHour) {
        setPrice(tutor.priceHour);
        console.log(`Prix mis à jour: ${tutor.priceHour}€`);
      }
      
      // Regenerate available time slots when duration changes
      if (tutor.availability && tutor.availability.length > 0) {
        console.log("Régénération des créneaux disponibles avec la nouvelle durée");
        // Utilisation d'une fonction asynchrone auto-invoquée
        (async () => {
          try {
            await generateAllAvailableTimeSlots(tutor.availability);
          } catch (err) {
            console.error("Erreur lors de la génération des créneaux:", err);
          }
        })();
      }
    }
  }, [duration, tutor]);

  // Générer tous les créneaux disponibles pour les 7 prochains jours
  const generateAllAvailableTimeSlots = async (availability: Tutor['availability']) => {
    if (!availability) return;
    console.log("Disponibilités du tuteur:", availability);

    setLoading(true);

    try {
      // Récupérer toutes les réservations existantes pour ce tuteur (confirmées ET en attente)
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('tutorId', '==', tutorId),
        where('status', 'in', ['confirmed', 'pending']) // Inclure les réservations confirmées ET en attente
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const existingBookings: {date: string, time: string, endTime: string, status: string}[] = [];
      
      bookingsSnapshot.forEach((doc) => {
        const booking = doc.data();
        existingBookings.push({
          date: booking.date,
          time: booking.time,
          endTime: booking.endTime || '',
          status: booking.status
        });
      });
      
      console.log("Réservations existantes:", existingBookings);

      const slots: TimeSlot[] = [];
      const daysEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const daysFr = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const daysFrCapitalized = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      const today = new Date();
      console.log("Date d'aujourd'hui:", today.toISOString());
      
      // Normaliser les jours pour recherche insensible à la casse
      const normalizedAvailability = availability.map(slot => {
        // Convertir les jours français capitalisés à l'anglais minuscule
        let normalizedDay = slot.day.toLowerCase();
        
        // Vérifier si c'est en français et le convertir en anglais
        const frIndex = daysFr.indexOf(normalizedDay);
        if (frIndex !== -1) {
          normalizedDay = daysEn[frIndex];
        } else {
          // Vérifier si c'est en français capitalisé
          const frCapIndex = daysFrCapitalized.indexOf(slot.day);
          if (frCapIndex !== -1) {
            normalizedDay = daysEn[frCapIndex];
          }
        }
        
        console.log(`Jour normalisé : ${slot.day} -> ${normalizedDay}`);
        
        return {
          ...slot,
          day: normalizedDay
        };
      });
      
      // Générer les créneaux pour les 14 prochains jours (2 semaines à venir)
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayName = daysEn[date.getDay()];
        console.log(`Vérification du jour ${dayName} (${date.toISOString().split('T')[0]})`);
        
        // Recherche de correspondance avec le jour normalisé
        const daySlots = normalizedAvailability.filter(slot => 
          slot.day === dayName
        );
        
        console.log(`Créneaux trouvés pour ${dayName}:`, daySlots);
        
        if (daySlots.length > 0) {
          // Utiliser le fuseau horaire local pour éviter le décalage d'un jour
          const dateString = date.getFullYear() + '-' + 
                          String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(date.getDate()).padStart(2, '0');
                          
          const formattedDay = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          daySlots.forEach(slot => {
            if (!slot.startTime || !slot.endTime) {
              console.warn("Créneau invalide détecté:", slot);
              return;
            }
            
            let startTime = convertTimeToMinutes(slot.startTime);
            const endTime = convertTimeToMinutes(slot.endTime);
            
            if (isNaN(startTime) || isNaN(endTime)) {
              console.warn("Horaires invalides détectés:", slot.startTime, slot.endTime);
              return;
            }
            
            console.log(`Génération des créneaux entre ${slot.startTime} (${startTime} min) et ${slot.endTime} (${endTime} min)`);
            
            // Generate slots based on duration
            const slotDuration = duration === '15min' ? 15 : duration === '30min' ? 30 : 60;
            console.log(`Durée de session sélectionnée: ${duration} (${slotDuration} minutes)`);
            
            // Generate slots
            while (startTime + slotDuration <= endTime) {
              const timeString = minutesToTimeString(startTime);
              const endTimeString = minutesToTimeString(startTime + slotDuration);
              
              // Vérifier si ce créneau n'est pas déjà réservé
              const isSlotBooked = existingBookings.some(booking => {
                // Même jour
                if (booking.date !== dateString) return false;
                
                const bookingStartTime = convertTimeToMinutes(booking.time);
                const bookingEndTime = booking.endTime ? convertTimeToMinutes(booking.endTime) : bookingStartTime + 60; // Défaut 1h
                
                // Vérifier si les créneaux se chevauchent
                // Un chevauchement se produit si:
                // - le début du nouveau créneau est avant la fin du créneau existant ET
                // - la fin du nouveau créneau est après le début du créneau existant
                return (
                  startTime < bookingEndTime &&
                  (startTime + slotDuration) > bookingStartTime
                );
              });
              
              if (!isSlotBooked) {
                console.log(`Ajout d'un créneau: ${timeString}-${endTimeString} (${slotDuration} min)`);
                slots.push({
                  day: dayName,
                  date: dateString,
                  time: timeString,
                  formattedDay,
                  endTime: endTimeString,
                  durationMinutes: slotDuration
                });
              } else {
                // Trouver la réservation qui bloque ce créneau
                const blockingBooking = existingBookings.find(booking => {
                  if (booking.date !== dateString) return false;
                  
                  const bookingStartTime = convertTimeToMinutes(booking.time);
                  const bookingEndTime = booking.endTime ? convertTimeToMinutes(booking.endTime) : bookingStartTime + 60;
                  
                  return (
                    startTime < bookingEndTime &&
                    (startTime + slotDuration) > bookingStartTime
                  );
                });
                
                const statusLabel = blockingBooking?.status === 'pending' ? 'en attente' : 'confirmé';
                console.log(`Créneau déjà réservé (${statusLabel}): ${dateString} ${timeString}-${endTimeString}`);
              }
              
              startTime += slotDuration;
            }
          });
        }
      }
      
      // Vérifier si des créneaux ont été générés
      console.log("Créneaux générés:", slots);
      if (slots.length === 0) {
        console.warn("Aucun créneau disponible trouvé pour ce tuteur dans les 14 prochains jours");
      }
      
      setAvailableTimeSlots(slots);
      
      // Si aucun créneau n'est disponible, afficher un message
      if (slots.length === 0) {
        setNoSlotsMessage("Ce tuteur n'a pas de créneaux disponibles pour les deux semaines à venir");
      } else {
        setNoSlotsMessage("");
      }

    } catch (err) {
      console.error("Erreur lors de la récupération des réservations:", err);
      setError("Impossible de charger les disponibilités du tuteur.");
    } finally {
      setLoading(false);
    }
  };
  
  // Convertir minutes en format de temps HH:MM
  const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Convert time string to minutes
  const convertTimeToMinutes = (time: string): number => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    } catch (err) {
      console.error("Erreur lors de la conversion du temps:", time, err);
      return NaN;
    }
  };
  
  const handleTimeSlotSelection = (slot: TimeSlot) => {
    console.log(`Créneau sélectionné: ${slot.date} ${slot.time}-${slot.endTime} (${slot.durationMinutes} min)`);
    setSelectedTimeSlot(slot);
    setSelectedDate(slot.date);
    setSelectedTime(slot.time);
  };
  
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  const validateCurrentStep = () => {
    setError('');
    
    if (currentStep === 1) {
      if (!duration) {
        setError('Please select a session duration.');
        return false;
      }
      if (!selectedSubject && tutor?.tutorSubjects?.length) {
        setError('Please select a subject for your session.');
        return false;
      }
    }
    
    if (currentStep === 2) {
      if (!selectedTimeSlot) {
        setError('Veuillez sélectionner un créneau pour votre session.');
        return false;
      }
    }
    
    return true;
  };
  
  const handleBookSession = async () => {
    if (!validateCurrentStep()) return;
    
    if (!currentUser) {
      navigate('/login', { 
        state: { 
          returnUrl: `/find-tutor`,
          tutorId
        }
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create a booking object
      const booking = {
        tutorId: tutor?.id,
        tutorName: tutor?.displayName || 'Tutor',
        tutorEmail: tutor?.email,
        studentId: currentUser.uid,
        studentName: currentUser.displayName || 'Student',
        studentEmail: currentUser.email,
        subject: selectedSubject || tutor?.tutorSubjects?.[0] || 'General Tutoring',
        duration,
        date: selectedDate,
        time: selectedTime,
        endTime: selectedTimeSlot?.endTime,
        price,
        notes,
        status: 'pending', // Statut "en attente" par défaut
        createdAt: serverTimestamp()
      };
      
      // Add booking to Firestore
      const bookingRef = await addDoc(collection(db, 'bookings'), booking);
      
      // Update tutor's bookings (if the field exists)
      await updateDoc(doc(db, 'users', tutorId as string), {
        bookings: arrayUnion(bookingRef.id)
      }).catch(err => console.log('Note: could not update tutor bookings array', err));
      
      // Update student's bookings
      await updateDoc(doc(db, 'users', currentUser.uid), {
        bookings: arrayUnion(bookingRef.id)
      }).catch(err => console.log('Note: could not update student bookings array', err));
      
      // Nous ne envoyons plus l'email ici - il sera envoyé quand le tuteur acceptera la réservation
      
      // Ajouter l'événement au calendrier Google via Zapier
      try {
        // Préparer les dates pour l'événement Google Calendar
        const bookingDate = new Date(booking.date);
        const startDateTime = formatCalendarDateTime(bookingDate, booking.time);
        const endDateTime = formatCalendarDateTime(bookingDate, booking.endTime || '');
        
        const calendarEvent: CalendarEventData = {
          title: `Session de tutorat - ${booking.subject}`,
          description: `Session avec ${booking.tutorName} et ${booking.studentName}.\n\nNotes: ${booking.notes || 'Aucune'}`,
          location: 'En ligne via PingUp',
          start_time: startDateTime,
          end_time: endDateTime,
          email: booking.tutorEmail // L'email du tuteur pour son calendrier
        };
        
        await sendCalendarEventToZapier(calendarEvent);
        console.log('Événement ajouté au calendrier Google avec succès');
        
        // Ajouter également au calendrier de l'étudiant si nous avons son email
        if (booking.studentEmail) {
          const studentCalendarEvent = {
            ...calendarEvent,
            email: booking.studentEmail
          };
          await sendCalendarEventToZapier(studentCalendarEvent);
        }
      } catch (calendarError) {
        console.error('Erreur lors de l\'ajout au calendrier:', calendarError);
        // On continue même en cas d'échec d'ajout au calendrier
      }
      
      // Rafraîchir les créneaux disponibles après réservation réussie
      if (tutor?.availability) {
        try {
          // Forcer la mise à jour des créneaux disponibles immédiatement
          await generateAllAvailableTimeSlots(tutor.availability);
          console.log('Créneaux disponibles mis à jour après réservation');
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour des créneaux disponibles:', updateError);
        }
      }
      
      setBookingId(bookingRef.id);
      setBookingSuccess(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  
  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Fonction pour gérer explicitement le changement de durée
  const handleDurationChange = (newDuration: '15min' | '30min' | 'hour') => {
    console.log(`Changement de durée de ${duration} à ${newDuration}`);
    setDuration(newDuration);
    if (newDuration !== duration) {
      // Reset le timeSlot sélectionné si on change de durée
      setSelectedTimeSlot(null);
    }
  };
  
  // Fonction pour ajouter des prix par défaut pour les tests
  const handleAddDefaultPrices = () => {
    if (!tutor) return;
    
    console.log("Ajout de prix par défaut pour les tests");
    
    const updatedTutor = { ...tutor };
    if (!updatedTutor.price15min) updatedTutor.price15min = 15;
    if (!updatedTutor.price30min) updatedTutor.price30min = 30;
    if (!updatedTutor.priceHour) updatedTutor.priceHour = 60;
    
    setTutor(updatedTutor);
  };
  
  if (loading) {
    return <div className="book-session-container"><div className="loader"></div></div>;
  }
  
  if (error && !tutor) {
    return (
      <div className="book-session-container">
        <div className="book-session-card">
          <div className="error-alert">{error}</div>
          <div className="navigation-buttons">
            <button 
              className="btn-primary" 
              onClick={() => navigate('/find-tutor')}
            >
              Find a Tutor
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="book-session-container">
        <div className="book-session-card">
          {!bookingSuccess ? (
            <>
              <div className="book-session-header">
                <h2>Réserver une session avec {tutor?.displayName}</h2>
                <p>Complétez les étapes ci-dessous pour réserver votre session de tutorat</p>
              </div>
              
              <div className="step-indicator">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <span>Détails de la session</span>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <span>Planification</span>
                </div>
              </div>
              
              {error && <div className="error-alert">{error}</div>}
              
              <div className="step-content">
                {currentStep === 1 && (
                  <>
                    <h3>
                      <FontAwesomeIcon icon={faClockRotateLeft} />
                      Détails de la session
                    </h3>
                    
                    <div className="form-group">
                      <label>Sélectionner la durée de votre session ↓</label>
                      <p className="duration-help-text">Cliquez sur l'une des options ci-dessous pour choisir la durée de votre session de tutorat</p>
                      
                      {/* Prix des différentes durées */}
                      <div className="price-comparison">
                        <div className="price-comparison-header">
                          <span>Durée</span>
                          <span>Prix</span>
                        </div>
                        {tutor?.price15min && (
                          <div className="price-item">
                            <span>15 minutes</span>
                            <span>{tutor.price15min}€</span>
                          </div>
                        )}
                        {tutor?.price30min && (
                          <div className="price-item">
                            <span>30 minutes</span>
                            <span>{tutor.price30min}€</span>
                          </div>
                        )}
                        {tutor?.priceHour && (
                          <div className="price-item">
                            <span>1 heure</span>
                            <span>{tutor.priceHour}€</span>
                          </div>
                        )}
                      </div>

                      {/* Indicateur si aucune durée n'est disponible */}
                      {!tutor?.price15min && !tutor?.price30min && !tutor?.priceHour && (
                        <div className="error-alert">
                          Ce tuteur n'a pas défini de tarifs pour ses sessions.
                          <button 
                            className="dev-button" 
                            onClick={handleAddDefaultPrices}
                            style={{
                              marginLeft: '10px',
                              padding: '5px 10px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius)',
                              cursor: 'pointer'
                            }}
                          >
                            Ajouter des tarifs (pour test)
                          </button>
                        </div>
                      )}

                      <div className="duration-options">
                        {tutor?.price15min ? (
                          <button 
                            type="button"
                            className={`duration-option duration-15min ${duration === '15min' ? 'selected' : ''}`}
                            onClick={() => {
                              console.log('Durée 15min sélectionnée');
                              handleDurationChange('15min');
                            }}
                            style={{
                              border: duration === '15min' ? '2px solid var(--primary)' : '2px solid var(--gray-300)',
                              backgroundColor: duration === '15min' ? 'var(--blue-50)' : 'var(--white)'
                            }}
                          >
                            <div className="duration-option-label">15 Minutes</div>
                            <span className="duration-option-price">{tutor.price15min}€</span>
                          </button>
                        ) : (
                          <div className="duration-option duration-unavailable">
                            <div className="duration-option-label">15 Minutes</div>
                            <span className="duration-unavailable-text">Non disponible</span>
                          </div>
                        )}
                        {tutor?.price30min ? (
                          <button 
                            type="button"
                            className={`duration-option duration-30min ${duration === '30min' ? 'selected' : ''}`}
                            onClick={() => {
                              console.log('Durée 30min sélectionnée');
                              handleDurationChange('30min');
                            }}
                            style={{
                              border: duration === '30min' ? '2px solid var(--primary)' : '2px solid var(--gray-300)',
                              backgroundColor: duration === '30min' ? 'var(--blue-50)' : 'var(--white)'
                            }}
                          >
                            <div className="duration-option-label">30 Minutes</div>
                            <span className="duration-option-price">{tutor.price30min}€</span>
                          </button>
                        ) : (
                          <div className="duration-option duration-unavailable">
                            <div className="duration-option-label">30 Minutes</div>
                            <span className="duration-unavailable-text">Non disponible</span>
                          </div>
                        )}
                        {tutor?.priceHour ? (
                          <button 
                            type="button"
                            className={`duration-option duration-hour ${duration === 'hour' ? 'selected' : ''}`}
                            onClick={() => {
                              console.log('Durée 1h sélectionnée');
                              handleDurationChange('hour');
                            }}
                            style={{
                              border: duration === 'hour' ? '2px solid var(--primary)' : '2px solid var(--gray-300)',
                              backgroundColor: duration === 'hour' ? 'var(--blue-50)' : 'var(--white)'
                            }}
                          >
                            <div className="duration-option-label">1 Heure</div>
                            <span className="duration-option-price">{tutor.priceHour}€</span>
                          </button>
                        ) : (
                          <div className="duration-option duration-unavailable">
                            <div className="duration-option-label">1 Heure</div>
                            <span className="duration-unavailable-text">Non disponible</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="selected-duration-text">
                        <span className="selected-duration-icon">✓</span>
                        Durée sélectionnée: <strong>{duration === '15min' ? '15 minutes' : duration === '30min' ? '30 minutes' : '1 heure'}</strong> - Prix: <strong>{price}€</strong>
                      </div>
                    </div>
                    
                    {tutor?.tutorSubjects && tutor.tutorSubjects.length > 0 && (
                      <div className="form-group">
                        <label>Sélectionner une matière</label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                          <option value="">Choisir une matière</option>
                          {tutor.tutorSubjects.map((subject, index) => (
                            <option key={index} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>Notes pour la session (Optionnel)</label>
                      <textarea
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ajoutez des sujets spécifiques ou des questions que vous aimeriez aborder lors de cette session..."
                      />
                    </div>
                  </>
                )}
                
                {currentStep === 2 && (
                  <>
                    <h3>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      Planifier votre session
                    </h3>
                    
                    <div className="form-group">
                      <label>Sélectionner un créneau disponible</label>
                      
                      {availableTimeSlots.length > 0 ? (
                        <>
                          <p className="availability-note">
                            Disponibilités pour les deux semaines à venir 
                            ({duration === '15min' ? '15 minutes' : duration === '30min' ? '30 minutes' : '1 heure'} par session):
                          </p>
                          <div className="time-slots-grid">
                            {availableTimeSlots.map((slot, index) => (
                              <div 
                                key={index}
                                className={`time-slot ${selectedTimeSlot && selectedTimeSlot.date === slot.date && selectedTimeSlot.time === slot.time ? 'selected' : ''}`}
                                onClick={() => handleTimeSlotSelection(slot)}
                              >
                                <div className="time-slot-date">
                                  <FontAwesomeIcon icon={faCalendarAlt} />
                                  {slot.formattedDay}
                                </div>
                                <div className="time-slot-time">
                                  <FontAwesomeIcon icon={faClock} />
                                  {slot.time} - {slot.endTime} ({slot.durationMinutes} min)
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="error-text">
                          {noSlotsMessage}
                        </p>
                      )}
                    </div>
                    
                    {selectedTimeSlot && (
                      <div className="session-summary">
                        <h4>Résumé de la session</h4>
                        <div className="summary-item">
                          <span>Date:</span>
                          <span>{selectedTimeSlot.formattedDay}</span>
                        </div>
                        <div className="summary-item">
                          <span>Horaire:</span>
                          <span>{selectedTimeSlot.time} - {selectedTimeSlot.endTime}</span>
                        </div>
                        <div className="summary-item">
                          <span>Durée:</span>
                          <span>{duration === '15min' ? '15 Minutes' : duration === '30min' ? '30 Minutes' : '1 Heure'}</span>
                        </div>
                        {selectedSubject && (
                          <div className="summary-item">
                            <span>Matière:</span>
                            <span>{selectedSubject}</span>
                          </div>
                        )}
                        <div className="summary-item">
                          <span>Prix:</span>
                          <span>{price}€</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="navigation-buttons">
                {currentStep > 1 && (
                  <button 
                    className="btn-secondary" 
                    onClick={handlePreviousStep}
                  >
                    Retour
                  </button>
                )}
                
                {currentStep < 2 ? (
                  <button 
                    className="btn-primary" 
                    onClick={handleNextStep}
                  >
                    Continuer
                  </button>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={handleBookSession}
                    disabled={loading}
                  >
                    {loading ? 'Traitement...' : 'Confirmer la réservation'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="booking-success">
              <div className="success-icon">
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <h3>Réservation en attente de confirmation</h3>
              <p>Votre demande de session avec {tutor?.displayName} a été enregistrée avec succès.</p>
              <p className="pending-info">Le tuteur doit maintenant confirmer cette réservation. Vous recevrez un email dès que votre session sera confirmée.</p>
              <div className="confirmation-summary">
                <div className="confirmation-item">
                <strong>ID de réservation :</strong>
                  <p>{bookingId}</p>
                  <FontAwesomeIcon icon={faUser} />
                  <div>
                    <strong>Tuteur</strong>
                    <p>{tutor?.displayName}</p>
                  </div>
                </div>
                <div className="confirmation-item">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <div>
                    <strong>Date</strong>
                    <p>{formatDisplayDate(selectedDate)}</p>
                  </div>
                </div>
                <div className="confirmation-item">
                  <FontAwesomeIcon icon={faClock} />
                  <div>
                    <strong>Heure</strong>
                    <p>{selectedTime}</p>
                  </div>
                </div>
                <div className="confirmation-item">
                  <FontAwesomeIcon icon={faClockRotateLeft} />
                  <div>
                    <strong>Durée</strong>
                    <p>{duration === '15min' ? '15 Minutes' : duration === '30min' ? '30 Minutes' : '1 Heure'}</p>
                  </div>
                </div>
              </div>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/dashboard')}
              >
                Aller au tableau de bord
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookSession; 