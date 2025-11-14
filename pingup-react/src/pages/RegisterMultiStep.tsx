import { useState, useRef } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from '../components/Navbar';
import './RegisterMultiStep.css';
import { FaUser, FaUpload, FaCamera, FaClock, FaMoneyBill } from 'react-icons/fa';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export default function RegisterMultiStep() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([]);
  const [newStudentSubject, setNewStudentSubject] = useState("");
  const [newTutorSubject, setNewTutorSubject] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState("lundi");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [price15min, setPrice15min] = useState<number | undefined>();
  const [price30min, setPrice30min] = useState<number | undefined>();
  const [priceHour, setPriceHour] = useState<number | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const timeSlots = [];
  for (let hour = 8; hour < 22; hour++) {
    for (let min = 0; min < 60; min += 30) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  timeSlots.push("22:00");

  const handleRegister = async () => {
    try {
      setError("");
      setIsLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName,
        roles,
        studentSubjects,
        tutorSubjects,
        photoURL: photoURL || null,
        bio: bio || null,
        availability: roles.includes("tutor") ? availability : [],
        ...(roles.includes("tutor") ? {
          price15min: price15min || null,
          price30min: price30min || null,
          priceHour: priceHour || null
        } : {}),
        createdAt: new Date(),
        status: "active",
      });

      console.log("Inscription réussie pour l'utilisateur:", user.uid);
      
      setTimeout(() => {
        navigate("/profile");
      }, 1000);
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      setError(error.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!displayName || !email || !password || !confirmPassword) {
        setError("Veuillez remplir tous les champs");
        return;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
    } else if (currentStep === 2) {
      if (roles.length === 0) {
        setError("Veuillez sélectionner au moins un rôle");
        return;
      }
    } else if (currentStep === 3) {
      if (roles.includes("student") && studentSubjects.length === 0) {
        setError("Veuillez ajouter au moins une matière en tant qu'étudiant");
        return;
      }
      if (roles.includes("tutor") && tutorSubjects.length === 0) {
        setError("Veuillez ajouter au moins une matière en tant que tuteur");
        return;
      }
    } else if (currentStep === 4 && roles.includes("tutor")) {
      if (availability.length === 0) {
        setError("Veuillez ajouter au moins une plage de disponibilité");
        return;
      }
    } else if (currentStep === 5) {
    } else if (currentStep === 6) {
    } else if (currentStep === 7) {
      if (bio.length < 40) {
        setError("Votre bio doit contenir au moins 40 caractères");
        return;
      }
    }

    setError("");
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const addStudentSubject = () => {
    if (newStudentSubject && !studentSubjects.includes(newStudentSubject)) {
      setStudentSubjects([...studentSubjects, newStudentSubject]);
      setNewStudentSubject("");
    }
  };

  const addTutorSubject = () => {
    if (newTutorSubject && !tutorSubjects.includes(newTutorSubject)) {
      setTutorSubjects([...tutorSubjects, newTutorSubject]);
      setNewTutorSubject("");
    }
  };

  const removeStudentSubject = (subject: string) => {
    setStudentSubjects(studentSubjects.filter(s => s !== subject));
  };

  const removeTutorSubject = (subject: string) => {
    setTutorSubjects(tutorSubjects.filter(s => s !== subject));
  };

  const addTimeSlot = () => {
    if (startTime >= endTime) {
      setError("L'heure de fin doit être postérieure à l'heure de début");
      return;
    }

    const newSlot: TimeSlot = {
      day: selectedDay,
      startTime,
      endTime
    };

    // Vérifier si un créneau avec le même jour existe déjà
    const hasOverlap = availability.some(slot => {
      if (slot.day !== selectedDay) return false;
      
      // Vérifier le chevauchement des créneaux
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;
      
      return (startTime < slotEnd && endTime > slotStart);
    });

    if (hasOverlap) {
      setError("Ce créneau chevauche un créneau existant");
      return;
    }

    setAvailability([...availability, newSlot]);
    setError("");
  };

  const removeTimeSlot = (index: number) => {
    const newAvailability = [...availability];
    newAvailability.splice(index, 1);
    setAvailability(newAvailability);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setPhotoURL(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  async function handleGoogleSignUp() {
    try {
      setError("");
      setIsGoogleLoading(true);
      
      await signInWithGoogle();
      
      const user = auth.currentUser;
      if (!user) throw new Error("Aucun utilisateur connecté");
      
      // Rediriger vers le profil pour compléter les informations
      navigate("/profile");
    } catch (error: any) {
      console.error("Erreur d'inscription Google:", error);
      setError(error.message || "Erreur lors de l'inscription avec Google");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  // Pour formater l'affichage des jours en français
  const formatDay = (day: string): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Pour formater l'heure en format lisible
  const formatTimeSlot = (slot: TimeSlot): string => {
    return `${formatDay(slot.day)}, ${slot.startTime} - ${slot.endTime}`;
  };

  return (
    <>
      <Navbar />
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h2>Inscription à PingUp</h2>
            <p>Créez votre compte pour commencer à apprendre ou enseigner</p>
          </div>

          <div className="step-indicator">
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} className={`step-dot ${currentStep === i + 1 ? 'active' : ''}`}></div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          {currentStep === 1 && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isLoading || isGoogleLoading}
                className="google-button"
              >
                {isGoogleLoading ? (
                  'Inscription...'
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                    </svg>
                    S'inscrire avec Google
                  </>
                )}
              </button>

              <div className="divider">
                <span>ou</span>
              </div>

              <div className="form-group">
                <label htmlFor="displayName">Nom complet</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Votre nom complet"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Adresse email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Au moins 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirmer le mot de passe</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Retapez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3>Quel est votre rôle ?</h3>
              <p>Vous pouvez sélectionner les deux options si vous le souhaitez</p>
              
              <div className="checkbox-group">
                <input
                  id="student-role"
                  type="checkbox"
                  value="student"
                  checked={roles.includes("student")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRoles(prev => e.target.checked ? [...prev, value] : prev.filter(r => r !== value));
                  }}
                />
                <label htmlFor="student-role">Je suis un étudiant cherchant de l'aide</label>
              </div>
              
              <div className="checkbox-group">
                <input
                  id="tutor-role"
                  type="checkbox"
                  value="tutor"
                  checked={roles.includes("tutor")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRoles(prev => e.target.checked ? [...prev, value] : prev.filter(r => r !== value));
                  }}
                />
                <label htmlFor="tutor-role">Je suis un tuteur souhaitant aider les autres</label>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3>Choisissez vos matières</h3>

              {roles.includes("student") && (
                <div className="form-group">
                  <label htmlFor="student-subjects">Matières en tant qu'étudiant</label>
                  <div className="subject-input">
                    <input
                      id="student-subjects"
                      type="text"
                      placeholder="Ex: Mathématiques"
                      value={newStudentSubject}
                      onChange={(e) => setNewStudentSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addStudentSubject()}
                    />
                    <button type="button" className="btn-next" onClick={addStudentSubject}>Ajouter</button>
                  </div>
                  <div className="subject-chips">
                    {studentSubjects.map(subject => (
                      <div key={subject} className="subject-chip">
                        {subject}
                        <button onClick={() => removeStudentSubject(subject)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roles.includes("tutor") && (
                <div className="form-group">
                  <label htmlFor="tutor-subjects">Matières en tant que tuteur</label>
                  <div className="subject-input">
                    <input
                      id="tutor-subjects"
                      type="text"
                      placeholder="Ex: Programmation"
                      value={newTutorSubject}
                      onChange={(e) => setNewTutorSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTutorSubject()}
                    />
                    <button type="button" className="btn-next" onClick={addTutorSubject}>Ajouter</button>
                  </div>
                  <div className="subject-chips">
                    {tutorSubjects.map(subject => (
                      <div key={subject} className="subject-chip">
                        {subject}
                        <button onClick={() => removeTutorSubject(subject)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && roles.includes("tutor") && (
            <div>
              <h3>
                <FaClock style={{ marginRight: '10px' }} />
                Définissez vos disponibilités
              </h3>
              <p>Ajoutez les créneaux horaires durant lesquels vous êtes disponible pour donner des cours</p>
              
              <div className="availability-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="day-select">Jour</label>
                    <select 
                      id="day-select" 
                      value={selectedDay} 
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="time-select"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{formatDay(day)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="start-time">De</label>
                    <select 
                      id="start-time" 
                      value={startTime} 
                      onChange={(e) => setStartTime(e.target.value)}
                      className="time-select"
                    >
                      {timeSlots.map((time, index) => (
                        <option key={`start-${index}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="end-time">À</label>
                    <select 
                      id="end-time" 
                      value={endTime} 
                      onChange={(e) => setEndTime(e.target.value)}
                      className="time-select"
                    >
                      {timeSlots.map((time, index) => (
                        <option key={`end-${index}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn-add-time" 
                    onClick={addTimeSlot}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
              
              <div className="time-slots-container">
                <h4>Créneaux ajoutés</h4>
                {availability.length === 0 ? (
                  <p className="no-slots">Aucun créneau ajouté</p>
                ) : (
                  <div className="time-slots-list">
                    {availability.map((slot, index) => (
                      <div key={index} className="time-slot-item">
                        <div className="time-slot-info">
                          <span className="day-label">{formatDay(slot.day)}</span>
                          <span className="time-range">{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeTimeSlot(index)} 
                          className="remove-slot-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && roles.includes("tutor") && (
            <div>
              <h3>
                <FaMoneyBill style={{ marginRight: '10px' }} />
                Définissez vos tarifs
              </h3>
              <p>Indiquez les tarifs pour vos séances de tutorat</p>
              
              <div className="pricing-form">
                <div className="form-group">
                  <label htmlFor="price15min">Prix pour 15 minutes (€)</label>
                  <input
                    id="price15min"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price15min || ''}
                    onChange={(e) => setPrice15min(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="price-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="price30min">Prix pour 30 minutes (€)</label>
                  <input
                    id="price30min"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price30min || ''}
                    onChange={(e) => setPrice30min(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="price-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="priceHour">Prix pour 1 heure (€)</label>
                  <input
                    id="priceHour"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceHour || ''}
                    onChange={(e) => setPriceHour(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="price-input"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div>
              <h3>Ajoutez une photo de profil</h3>
              <p>Cela aidera les autres utilisateurs à vous reconnaître</p>
              
              <div className="photo-upload-container">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                
                {previewImage ? (
                  <div className="preview-photo">
                    <img src={previewImage} alt="Aperçu" />
                    <button type="button" className="change-photo" onClick={triggerFileInput}>
                      <FaCamera /> Changer
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder" onClick={triggerFileInput}>
                    <FaUser className="user-icon" />
                    <div className="upload-prompt">
                      <FaUpload />
                      <span>Cliquez pour ajouter une photo</span>
                    </div>
                  </div>
                )}
                
                <p className="photo-info">
                  Formats acceptés: JPG, PNG. Taille maximale: 5MB
                </p>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div>
              <h3>Présentez-vous</h3>
              <p>Partagez quelques informations sur vous (minimum 40 caractères)</p>
              
              <div className="form-group">
                <textarea
                  placeholder="Parlez de votre expérience, vos compétences, votre parcours..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  className="bio-textarea"
                ></textarea>
                <div className="character-count">
                  {bio.length} / 40 caractères minimum
                  {bio.length < 40 && (
                    <span className="character-warning">
                      (encore {40 - bio.length} caractères nécessaires)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 8 && (
            <div className="final-step">
              <h3>Récapitulatif</h3>
              <div className="profile-summary">
                {previewImage && (
                  <div className="summary-photo">
                    <img src={previewImage} alt={displayName} />
                  </div>
                )}
                
                <div className="summary-info">
                  <div className="summary-item">
                    <strong>Nom :</strong> {displayName}
                  </div>
                  <div className="summary-item">
                    <strong>Email :</strong> {email}
                  </div>
                  <div className="summary-item">
                    <strong>Rôles :</strong> {roles.map(role => role === 'student' ? 'Étudiant' : 'Tuteur').join(", ")}
                  </div>
                </div>
              </div>
              
              {roles.includes("student") && (
                <div className="summary-item">
                  <strong>Matières en tant qu'étudiant :</strong> 
                  <div className="subject-chips">
                    {studentSubjects.map(subject => (
                      <div key={subject} className="subject-chip">{subject}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {roles.includes("tutor") && (
                <>
                  <div className="summary-item">
                    <strong>Matières en tant que tuteur :</strong>
                    <div className="subject-chips">
                      {tutorSubjects.map(subject => (
                        <div key={subject} className="subject-chip">{subject}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <strong>Disponibilités :</strong>
                    {availability.length > 0 ? (
                      <div className="availability-summary">
                        {availability.map((slot, index) => (
                          <div key={index} className="availability-item">
                            {formatTimeSlot(slot)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>Aucune disponibilité définie</p>
                    )}
                  </div>
                  
                  <div className="summary-item">
                    <strong>Tarifs :</strong>
                    <div className="pricing-summary">
                      {price15min ? (
                        <div className="price-item">15 minutes : {price15min}€</div>
                      ) : (
                        <div className="price-item">15 minutes : Non défini</div>
                      )}
                      
                      {price30min ? (
                        <div className="price-item">30 minutes : {price30min}€</div>
                      ) : (
                        <div className="price-item">30 minutes : Non défini</div>
                      )}
                      
                      {priceHour ? (
                        <div className="price-item">1 heure : {priceHour}€</div>
                      ) : (
                        <div className="price-item">1 heure : Non défini</div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {bio && (
                <div className="summary-item bio-summary">
                  <strong>À propos de vous :</strong>
                  <p>{bio}</p>
                </div>
              )}
            </div>
          )}

          <div className="button-group">
            {currentStep > 1 && (
              <button 
                type="button" 
                className="btn-back" 
                onClick={handlePrevious}
                disabled={isLoading}
              >
                Précédent
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button 
                type="button" 
                className="btn-next" 
                onClick={handleNext}
                disabled={isGoogleLoading}
              >
                Suivant
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-submit" 
                onClick={handleRegister} 
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? "Création en cours..." : "Valider l'inscription"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
