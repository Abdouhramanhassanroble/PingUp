import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import './RegisterMultiStep.css';

export default function RegisterMultiStep() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([]);
  const [newStudentSubject, setNewStudentSubject] = useState("");
  const [newTutorSubject, setNewTutorSubject] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setError("");
      setIsLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        roles,
        studentSubjects,
        tutorSubjects,
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
    // Validation par étape
    if (currentStep === 1) {
      if (!email || !password || !confirmPassword) {
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

          {/* Étape 1: Informations de compte */}
          {currentStep === 1 && (
            <div>
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

          {/* Étape 2: Choix du rôle */}
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

          {/* Étape 3: Choix des matières */}
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

          {/* Étape 4: Récapitulatif */}
          {currentStep === 4 && (
            <div>
              <h3>Récapitulatif</h3>
              <div className="summary-item">
                <strong>Email :</strong> {email}
              </div>
              <div className="summary-item">
                <strong>Rôles :</strong> {roles.map(role => role === 'student' ? 'Étudiant' : 'Tuteur').join(", ")}
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
                <div className="summary-item">
                  <strong>Matières en tant que tuteur :</strong>
                  <div className="subject-chips">
                    {tutorSubjects.map(subject => (
                      <div key={subject} className="subject-chip">{subject}</div>
                    ))}
                  </div>
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
              >
                Suivant
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-submit" 
                onClick={handleRegister} 
                disabled={isLoading}
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
