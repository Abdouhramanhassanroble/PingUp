import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { FaUser, FaUpload, FaCamera, FaSave, FaTimes, FaGraduationCap, FaChalkboardTeacher, FaBook } from 'react-icons/fa';
import './EditProfile.css';

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

export default function EditProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [newStudentSubject, setNewStudentSubject] = useState("");
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [newTutorSubject, setNewTutorSubject] = useState("");
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isStudent, setIsStudent] = useState(false);
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        
        if (!user) {
          navigate('/login');
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserData;
          console.log("User data loaded:", data);
          setUserData(data);
          
          // Initialize form state with user data
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setPhotoURL(data.photoURL || "");
          setPreviewImage(data.photoURL || "");
          setStudentSubjects(data.studentSubjects || []);
          setTutorSubjects(data.tutorSubjects || []);
          setRoles(data.roles || []);
          setIsStudent(data.roles.includes('student'));
          setIsTutor(data.roles.includes('tutor'));
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dans une application réelle, vous téléchargeriez le fichier sur un service de stockage
      // et utiliseriez l'URL renvoyée. Ici, nous utilisons simplement un dataURL local
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

  const addStudentSubject = () => {
    if (newStudentSubject && !studentSubjects.includes(newStudentSubject)) {
      setStudentSubjects([...studentSubjects, newStudentSubject]);
      setNewStudentSubject("");
    }
  };

  const removeStudentSubject = (subject: string) => {
    setStudentSubjects(studentSubjects.filter(s => s !== subject));
  };

  const addTutorSubject = () => {
    if (newTutorSubject && !tutorSubjects.includes(newTutorSubject)) {
      setTutorSubjects([...tutorSubjects, newTutorSubject]);
      setNewTutorSubject("");
    }
  };

  const removeTutorSubject = (subject: string) => {
    setTutorSubjects(tutorSubjects.filter(s => s !== subject));
  };

  const toggleStudentRole = () => {
    setIsStudent(!isStudent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) return;
    
    try {
      setSaving(true);
      setError("");
      setSuccess(false);
      
      // Vérifiez si la biographie est assez longue (si elle est fournie)
      if (bio && bio.length < 40) {
        setError("La biographie doit contenir au moins 40 caractères");
        setSaving(false);
        return;
      }
      
      // Préparer les rôles mis à jour
      const updatedRoles = [...roles];
      
      // Gérer le rôle étudiant
      if (isStudent && !updatedRoles.includes('student')) {
        updatedRoles.push('student');
      } else if (!isStudent && updatedRoles.includes('student')) {
        const index = updatedRoles.indexOf('student');
        if (index > -1) {
          updatedRoles.splice(index, 1);
        }
      }
      
      const userDocRef = doc(db, "users", userData.uid);
      await updateDoc(userDocRef, {
        displayName,
        bio,
        photoURL,
        studentSubjects,
        tutorSubjects,
        roles: updatedRoles
      });
      
      setSuccess(true);
      
      // Réinitialiser le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      setError("Une erreur est survenue lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="edit-profile-container">
          <div className="edit-profile-card loading">
            <div className="loader"></div>
          </div>
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Navbar />
        <div className="edit-profile-container">
          <div className="edit-profile-card error">
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
      <div className="edit-profile-container">
        <div className="edit-profile-card">
          <div className="edit-profile-header">
            <h2>Modifier votre profil</h2>
            <p>Mettez à jour vos informations personnelles</p>
          </div>
          
          {error && (
            <div className="alert alert-error">
              <FaTimes className="alert-icon" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <FaSave className="alert-icon" />
              Votre profil a été mis à jour avec succès !
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Informations générales</h3>
              
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
              </div>
              
              <div className="form-group">
                <label htmlFor="displayName">Nom complet</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Votre nom complet"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">
                  À propos de vous <span className="sub-label">(minimum 40 caractères)</span>
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  placeholder="Partagez quelques informations sur vous..."
                ></textarea>
                <div className="character-count">
                  {bio.length} / 40 caractères minimum
                  {bio.length > 0 && bio.length < 40 && (
                    <span className="character-warning">
                      (encore {40 - bio.length} caractères nécessaires)
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {!userData.roles.includes('student') && (
              <div className="role-toggle-section">
                <h3>
                  <FaGraduationCap />
                  Une envie d'apprendre ? Devenez étudiant
                </h3>
                <p>
                  Activez le rôle d'étudiant pour accéder à des tuteurs et recevoir de l'aide
                  dans les matières de votre choix.
                </p>
                <div className="toggle-container">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={isStudent} 
                      onChange={toggleStudentRole}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">
                    {isStudent ? 'Rôle étudiant activé' : 'Activer le rôle étudiant'}
                  </span>
                </div>
              </div>
            )}
            
            {userData.roles.includes('student') && (
              <div className="role-toggle-section">
                <h3>
                  <FaGraduationCap />
                  Statut étudiant
                </h3>
                <p>
                  Désactivez votre statut étudiant si vous ne souhaitez plus recevoir d'aide
                  dans vos matières.
                </p>
                <div className="toggle-container">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={isStudent} 
                      onChange={toggleStudentRole}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">
                    {isStudent ? 'Statut étudiant activé' : 'Statut étudiant désactivé'}
                  </span>
                </div>
              </div>
            )}
            
            {(userData.roles.includes('student') || isStudent) && (
              <div className="form-section">
                <h3>
                  <FaBook style={{ marginRight: '10px', color: 'var(--blue-400)' }} />
                  Matières en tant qu'étudiant
                </h3>
                <div className="subject-input">
                  <input
                    type="text"
                    placeholder="Ajouter une matière"
                    value={newStudentSubject}
                    onChange={(e) => setNewStudentSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStudentSubject())}
                  />
                  <button type="button" onClick={addStudentSubject}>Ajouter</button>
                </div>
                
                <div className="subject-chips">
                  {studentSubjects.map(subject => (
                    <div key={subject} className="subject-chip student-subject-chip">
                      {subject}
                      <button type="button" onClick={() => removeStudentSubject(subject)}>×</button>
                    </div>
                  ))}
                  {studentSubjects.length === 0 && (
                    <p className="no-subjects">Aucune matière ajoutée en tant qu'étudiant</p>
                  )}
                </div>
              </div>
            )}
            
            {userData.roles.includes('tutor') && (
              <div className="form-section">
                <h3>
                  <FaChalkboardTeacher style={{ marginRight: '10px', color: 'var(--green-400)' }} />
                  Matières en tant que tuteur
                </h3>
                <div className="subject-input">
                  <input
                    type="text"
                    placeholder="Ajouter une matière"
                    value={newTutorSubject}
                    onChange={(e) => setNewTutorSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTutorSubject())}
                  />
                  <button type="button" onClick={addTutorSubject}>Ajouter</button>
                </div>
                
                <div className="subject-chips">
                  {tutorSubjects.map(subject => (
                    <div key={subject} className="subject-chip tutor-subject-chip">
                      {subject}
                      <button type="button" onClick={() => removeTutorSubject(subject)}>×</button>
                    </div>
                  ))}
                  {tutorSubjects.length === 0 && (
                    <p className="no-subjects">Aucune matière ajoutée en tant que tuteur</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/profile')}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 