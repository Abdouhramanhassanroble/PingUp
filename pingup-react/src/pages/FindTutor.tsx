import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore'
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import './FindTutor.css';
import { FaStar, FaSearch, FaClock } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';

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
  studentSubjects?: string[];
  photoURL?: string;
  status?: string;
  availability?: TimeSlot[];
  price15min?: number;
  price30min?: number;
  priceHour?: number;
}

export default function FindTutor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  // Nous n'avons plus besoin des états pour l'image puisque nous utilisons un dégradé CSS
  
  const [allTutors, setAllTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  
  // États pour les filtres de disponibilité
  const [filterByAvailability, setFilterByAvailability] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(getCurrentDay());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(getCurrentTimeSlot());
  const [priceSort, setPriceSort] = useState<string>("");
  
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
  
  // Liste des jours pour le sélecteur
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  
  // Générer les créneaux horaires pour le sélecteur
  const timeSlots = [];
  for (let hour = 8; hour < 22; hour++) {
    for (let min = 0; min < 60; min += 30) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  timeSlots.push("22:00");
  
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        console.log("Tous les utilisateurs:", querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const tutorsData = querySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            console.log("Données utilisateur:", doc.id, data);
            // Vérifier si roles existe et est un tableau qui inclut 'tutor'
            return data.roles && Array.isArray(data.roles) && data.roles.includes('tutor');
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Tutor[];
        
        console.log("Tuteurs filtrés:", tutorsData);
        
        // Si aucun tuteur n'est trouvé, ajouter un tuteur de test
        if (tutorsData.length === 0) {
          tutorsData.push({
            id: 'test-tutor-id',
            displayName: 'Jean Dupont',
            email: 'jean.dupont@example.com',
            roles: ['tutor'],
            tutorSubjects: ['Mathématiques', 'Physique'],
            photoURL: 'https://randomuser.me/api/portraits/men/1.jpg',
            status: 'active',
            price15min: 9.99,
            price30min: 18.99,
            priceHour: 34.99,
            availability: [
              { day: 'lundi', startTime: '18:00', endTime: '20:00' },
              { day: 'mercredi', startTime: '14:00', endTime: '16:00' }
            ]
          });
        }
        
        setAllTutors(tutorsData);
        setFilteredTutors(tutorsData); // Initialement, afficher tous les tuteurs
      } catch (error) {
        console.error("Erreur lors de la récupération des tuteurs:", error);
      }
    };
    
    fetchTutors();
    
    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('query');
    const subjectParam = params.get('subject');
    
    if (queryParam) setSearchQuery(queryParam);
    if (subjectParam) setSubject(subjectParam);
  }, [location.search]);
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Vérifie si un tuteur est disponible pour un créneau spécifique
  const isTutorAvailable = (tutor: Tutor, day: string, time: string): boolean => {
    if (!tutor.availability || tutor.availability.length === 0) {
      return false;
    }
    
    return tutor.availability.some(slot => {
      if (slot.day.toLowerCase() !== day.toLowerCase()) return false;
      
      // Convertir les heures en minutes pour faciliter la comparaison
      const requestedTime = convertTimeToMinutes(time);
      const startTime = convertTimeToMinutes(slot.startTime);
      const endTime = convertTimeToMinutes(slot.endTime);
      
      // Vérifier si l'heure demandée est dans la plage de disponibilité
      return startTime <= requestedTime && requestedTime <= endTime;
    });
  };
  
  // Fonction utilitaire pour convertir l'heure au format "HH:MM" en minutes
  const convertTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Fonction pour formater le jour en français avec majuscule
  const formatDay = (day: string): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };
  
  // Fonction pour filtrer les tuteurs en fonction de la recherche et des disponibilités
  const filterTutors = () => {
    let results = [...allTutors];
    
    // Filtrer par matière si une matière est spécifiée
    if (subject) {
      const subjectLower = subject.toLowerCase();
      results = results.filter(tutor => 
        tutor.tutorSubjects && 
        tutor.tutorSubjects.some(s => 
          s.toLowerCase().includes(subjectLower)
        )
      );
    }
    
    // Filtrer par question/recherche générale si spécifiée
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      results = results.filter(tutor => 
        (tutor.displayName && tutor.displayName.toLowerCase().includes(queryLower)) ||
        (tutor.email && tutor.email.toLowerCase().includes(queryLower)) ||
        (tutor.tutorSubjects && tutor.tutorSubjects.some(s => s.toLowerCase().includes(queryLower)))
      );
    }
    
    // Filtrer par disponibilité si l'option est activée
    if (filterByAvailability) {
      results = results.filter(tutor => 
        isTutorAvailable(tutor, selectedDay, selectedTimeSlot)
      );
    }
    
    // Trier par prix si un tri est sélectionné
    if (priceSort) {
      results.sort((a, b) => {
        // Utiliser le prix de 15 minutes pour le tri, ou le prix de 30 min ou 1 heure si non disponible
        const priceA = a.price15min || a.price30min || a.priceHour || Number.MAX_VALUE;
        const priceB = b.price15min || b.price30min || b.priceHour || Number.MAX_VALUE;
        
        if (priceSort === 'low') {
          return priceA - priceB; // Prix croissant
        } else {
          return priceB - priceA; // Prix décroissant
        }
      });
    }
    
    setFilteredTutors(results);
  };
  
  // Appliquer les filtres chaque fois que les critères changent
  useEffect(() => {
    filterTutors();
  }, [searchQuery, subject, filterByAvailability, selectedDay, selectedTimeSlot, priceSort, allTutors]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterTutors();
  };
  
  // Déterminer s'il faut afficher un message "Aucun tuteur trouvé"
  const noTutorsFound = allTutors.length > 0 && filteredTutors.length === 0;
  
  // Fonction pour naviguer vers le profil du tuteur
  const navigateToTutorProfile = (tutorId: string) => {
    navigate(`/tutor-profile/${tutorId}`);
  };
  
  // Gérer la réservation d'une session
  const handleBookSession = (tutorId: string, sessionPrice: number | undefined) => {
    if (!isAuthenticated) {
      // Rediriger vers la page de connexion
      navigate('/login', { 
        state: { 
          returnUrl: `/find-tutor${location.search}`,
          tutorId: tutorId,
          sessionType: '15min',
          sessionPrice: sessionPrice
        } 
      });
    } else {
      // Procéder à la réservation
      navigate(`/book-session/${tutorId}`, {
        state: {
          sessionType: '15min',
          sessionPrice: sessionPrice
        }
      });
    }
  };
  
  return (
    <>
      <Navbar />
      
      <div className="find-tutor-page">
        <div className="search-header">
          <h1>Trouver un tuteur</h1>
          <p>Des experts disponibles immédiatement pour des sessions de 15 minutes</p>
          
          <form onSubmit={handleSearch} className="advanced-search">
            <div className="search-inputs">
              <div className="input-group">
                <FaSearch className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Quelle est votre question ?" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Matière (Maths, Langues, etc.)" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <button type="submit" className="btn-search">Rechercher</button>
            </div>
            
            <div className="search-filters">
              <div className="filter">
                <label>
                  <input 
                    type="checkbox" 
                    checked={filterByAvailability}
                    onChange={(e) => setFilterByAvailability(e.target.checked)}
                  />
                  Filtrer par disponibilité
                </label>
              </div>
              
              {filterByAvailability && (
                <div className="availability-filter">
                  <div className="filter-select">
                    <select 
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="time-select"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{formatDay(day)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filter-select">
                    <select 
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="time-select"
                    >
                      {timeSlots.map((time, index) => (
                        <option key={`time-${index}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="filter">
                <label>
                  <input type="checkbox" />
                  Top tuteurs
                </label>
              </div>
              
              <div className="filter">
                <select 
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value)}
                >
                  <option value="">Prix (Tous)</option>
                  <option value="low">Prix croissant</option>
                  <option value="high">Prix décroissant</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        
        <div className="tutors-results">
          <h2>{filteredTutors.length} tuteurs disponibles</h2>
          
          {noTutorsFound ? (
            <div className="no-results">
              <h3>Aucun tuteur ne correspond à votre recherche</h3>
              <p>Essayez de modifier vos critères de recherche ou d'explorer d'autres matières</p>
            </div>
          ) : (
            <div className="tutors-grid">
              {filteredTutors.map(tutor => (
                <div key={tutor.id} className="tutor-card">
                  <div className="tutor-header">
                    <span className="rating"><FaStar /> 5.0</span> {/* Valeur par défaut */}
                    <span className="sessions">50 sessions</span> {/* Valeur par défaut */}
                  </div>

                  <img src={tutor.photoURL || "/default-avatar.png"} alt={tutor.displayName || tutor.email || "Tuteur"} />
                  <h3>{tutor.displayName || tutor.email || "Nom inconnu"}</h3>
                  <p className="subject">{(tutor.tutorSubjects && tutor.tutorSubjects.join(", ")) || "Matière inconnue"}</p>
                  
                  <div className="prices">
                    {tutor.price15min ? (
                      <p className="price primary-price">{tutor.price15min}€ <span>/15min</span></p>
                    ) : null}
                    
                    {tutor.price30min ? (
                      <p className="price">{tutor.price30min}€ <span>/30min</span></p>
                    ) : null}
                    
                    {tutor.priceHour ? (
                      <p className="price">{tutor.priceHour}€ <span>/heure</span></p>
                    ) : null}
                    
                    {!tutor.price15min && !tutor.price30min && !tutor.priceHour && (
                      <p className="price">Sur devis</p>
                    )}
                  </div>
                  
                  <p className="bio">Disponible pour vous aider à progresser rapidement.</p>

                  <div className="tutor-status">
                    {tutor.availability && tutor.availability.length > 0 ? (
                      isTutorAvailable(tutor, selectedDay, selectedTimeSlot) ? (
                        <span className="status available">
                          <BiTimeFive /> Disponible maintenant
                        </span>
                      ) : (
                        <span className="status unavailable">
                          <FaClock /> {tutor.availability.some(slot => slot.day.toLowerCase() === selectedDay.toLowerCase()) ? 
                            `Disponible à d'autres heures ${formatDay(selectedDay).toLowerCase()}` : 
                            `Non disponible ${formatDay(selectedDay).toLowerCase()}`}
                        </span>
                      )
                    ) : (
                      <span className="status unavailable">
                        <FaClock /> Planning non renseigné
                      </span>
                    )}
                  </div>

                  <div className="tutor-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => navigateToTutorProfile(tutor.id)}
                    >
                      Voir le profil
                    </button>
                    <button 
                      className="btn-primary" 
                      onClick={() => handleBookSession(tutor.id, tutor.price15min)}
                    >
                      {tutor.price15min ? `${tutor.price15min}€ - 15 min` : "Session de 15 min"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 