import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FindTutor.css';
import { FaStar, FaSearch } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';

export default function FindTutor() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [imageError, setImageError] = useState(false);
  // On utilise une image par défaut qui est garantie d'exister
  const [backgroundImage, setBackgroundImage] = useState('/BackgroundRecherche.jpg');
  
  const [tutors, setTutors] = useState([
    {
      id: 1,
      name: 'Marie D.',
      subject: 'Mathématiques',
      rating: 4.9,
      sessions: 128,
      price: 9,
      bio: 'Docteure en mathématiques, spécialisée dans la résolution rapide de problèmes complexes.',
      available: true,
      image: '/tutor-1.jpg'
    },
    {
      id: 2,
      name: 'Thomas L.',
      subject: 'Programmation',
      rating: 5.0,
      sessions: 93,
      price: 12,
      bio: 'Développeur senior avec 8 ans d\'expérience, résout vos bugs et problèmes de code en minutes.',
      available: true,
      image: '/tutor-2.jpg'
    },
    {
      id: 3,
      name: 'Sophie M.',
      subject: 'Anglais & Espagnol',
      rating: 4.8,
      sessions: 75,
      price: 8,
      bio: 'Traductrice professionnelle, je corrige rapidement vos textes et vous aide avec les expressions difficiles.',
      available: true,
      image: '/tutor-3.jpg'
    }
  ]);
  
  useEffect(() => {
    // Test avec différents chemins pour trouver celui qui fonctionne
    const imagePaths = [
      '/backgroundBook.jpg',
      './backgroundBook.jpg',
      '/BackgroundRecherche.jpg' // une autre image qui existe sûrement
    ];
    
    // Fonction pour tester si une image peut être chargée
    const checkImage = (path: string) => {
      const img = new Image();
      img.onload = () => {
        console.log('Image chargée avec succès:', path);
        setBackgroundImage(path);
        setImageError(false);
      };
      img.onerror = () => console.error('Échec de chargement:', path);
      img.src = path;
    };
    
    // Essayer tous les chemins
    imagePaths.forEach(checkImage);
    
    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('query');
    const subjectParam = params.get('subject');
    
    if (queryParam) setSearchQuery(queryParam);
    if (subjectParam) setSubject(subjectParam);
  }, [location.search]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtrage des tuteurs (simulation)
    console.log("Recherche:", searchQuery, subject);
  };
  
  return (
    <>
      <Navbar />
      
      <div className="find-tutor-page">
        <div 
          className={`background-image ${imageError ? 'fallback' : ''}`}
          style={{
            backgroundImage: `url(${backgroundImage})`
          }}
        >
          <div className="overlay"></div>
        </div>
        
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
                  <input type="checkbox" />
                  Disponibles maintenant
                </label>
              </div>
              
              <div className="filter">
                <label>
                  <input type="checkbox" />
                  Top tuteurs
                </label>
              </div>
              
              <div className="filter">
                <select>
                  <option value="">Prix</option>
                  <option value="low">Prix croissant</option>
                  <option value="high">Prix décroissant</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        
        <div className="tutors-results">
          <h2>{tutors.length} tuteurs disponibles</h2>
          
          <div className="tutors-grid">
            {tutors.map(tutor => (
              <div key={tutor.id} className="tutor-card">
                <div className="tutor-header">
                  <span className="rating"><FaStar /> {tutor.rating}</span>
                  <span className="sessions">{tutor.sessions} sessions</span>
                </div>
                
                <img src={tutor.image} alt={tutor.name} />
                <h3>{tutor.name}</h3>
                <p className="subject">{tutor.subject}</p>
                <p className="price">{tutor.price}€ / 15 min</p>
                <p className="bio">{tutor.bio}</p>
                
                <div className="tutor-status">
                  <span className="status available">
                    <BiTimeFive /> Disponible maintenant
                  </span>
                </div>
                
                <div className="tutor-actions">
                  <button className="btn-secondary">Voir le profil</button>
                  <button className="btn-primary">Session de 15 min</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 