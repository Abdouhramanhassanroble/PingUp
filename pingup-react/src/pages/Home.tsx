import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../App.css';
import './Home.css';
import { FaStar, FaUsers, FaCheck, FaClock } from 'react-icons/fa';
import { BiTimeFive } from 'react-icons/bi';
import { MdSpeed, MdOutlineSchedule } from 'react-icons/md';

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-background">
            <video 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="background-video"
                poster="/BackgroundRecherche.jpg" 
                onLoadedData={(e) => console.log("Vidéo chargée avec succès", e)}
                onError={(e) => {
                    console.error("Erreur de chargement vidéo:", e);
                    console.error("Source de l'erreur:", e.currentTarget.currentSrc);
                    console.error("Erreur de chargement:", e.currentTarget.error);
                    e.currentTarget.style.display = 'none';
                    // Ajouter une classe pour utiliser le fallback d'image
                    const heroElement = document.querySelector('.hero');
                    if (heroElement) {
                        heroElement.classList.add('video-fallback');
                    }
                }}
            >
                <source src="/backgroundVideo.mp4" type="video/mp4" />
                <source src="./backgroundVideo.mp4" type="video/mp4" />
                <source src="../public/backgroundVideo.mp4" type="video/mp4" />
                Votre navigateur ne supporte pas la vidéo HTML5.
            </video>
            <div className="overlay"></div>
        </div>
        <div className="hero-content">
          <h1>Des réponses en 15 minutes chrono</h1>
          <p>Résolvez vos problèmes rapidement avec des tuteurs experts disponibles à la demande</p>
          <div className="simple-search">
            <button 
              onClick={() => navigate('/find-tutor')} 
              className="btn-find-tutor"
            >
              Trouver un tuteur
            </button>
          </div>
          <div className="trust-badges">
            <div className="badge"><BiTimeFive /> 15 min par session</div>
            <div className="badge"><FaUsers /> +3000 experts</div>
            <div className="badge"><FaStar /> 4.9/5 satisfaction</div>
          </div>
        </div>
      </section>

      {/* QUI SOMMES-NOUS */}
      <section id="about" className="about-us">
        <h2>Qui sommes-nous ?</h2>
        <div className="about-content">
          <div className="about-text">
            <div className="about-logo">
              <img src="/PingUpLogoRemoved.png" alt="Logo PingUp" />
            </div>
            <p className="lead">PingUp est une plateforme innovante de micro-tutorat qui offre des sessions de 15 minutes pour obtenir des réponses rapides et précises à vos questions.</p>
            
            <p>Notre mission est simple : vous faire gagner du temps. Nous savons que dans un monde où tout va vite, attendre des heures pour obtenir de l'aide n'est plus viable. C'est pourquoi nous avons créé un service qui vous connecte instantanément avec des experts qualifiés prêts à résoudre vos problèmes en quelques minutes.</p>
            
            <p>Que vous soyez bloqué sur un exercice de mathématiques, que vous ayez besoin d'aide pour comprendre un concept de programmation ou que vous cherchiez des conseils rapides dans n'importe quelle matière, PingUp vous offre des réponses immédiates, sans rendez-vous ni longues explications.</p>
          </div>
          
          <div className="about-values">
            <div className="value-card">
              <div className="value-icon"><FaClock /></div>
              <h3>Gain de temps</h3>
              <p>Des sessions courtes de 15 minutes, sans perte de temps ni détours. Allez droit à l'essentiel.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon"><MdSpeed /></div>
              <h3>Rapidité</h3>
              <p>Connexion avec un tuteur en moins de 3 minutes. Obtenez des réponses quand vous en avez besoin.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon"><MdOutlineSchedule /></div>
              <h3>Flexibilité</h3>
              <p>Sans rendez-vous, à la demande. Disponible 24/7 pour s'adapter à votre emploi du temps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="advantages">
        <h2>Pourquoi choisir PingUp ?</h2>
        <div className="advantages-grid">
          <div className="advantage-card">
            <div className="advantage-icon">15</div>
            <h3>Minutes par session</h3>
            <p>Des sessions courtes et efficaces pour répondre précisément à vos questions, sans perte de temps.</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">24/7</div>
            <h3>Disponibilité</h3>
            <p>Des tuteurs disponibles à tout moment, même tard le soir ou le week-end quand vous en avez besoin.</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">3min</div>
            <h3>Délai de connexion</h3>
            <p>Connectez-vous à un expert en moins de 3 minutes et obtenez une solution immédiatement.</p>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="how-it-works">
        <h2>Comment fonctionne PingUp ?</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Posez votre question</h3>
            <p>Détaillez votre problème en quelques lignes et sélectionnez la matière concernée.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Connectez-vous en 3 min</h3>
            <p>Notre algorithme vous met en relation avec l'expert disponible le plus qualifié.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Session de 15 minutes</h3>
            <p>Obtenez des explications concises et des solutions efficaces à votre problème.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Problème résolu !</h3>
            <p>Avancez dans votre travail sans perdre des heures à chercher des réponses.</p>
          </div>
        </div>
        <div className="session-example">
          <h3>Exemple de session</h3>
          <div className="timeline">
            <div className="timeline-item">
              <span className="time">0:00</span>
              <div className="timeline-content">
                <h4>Présentation du problème</h4>
                <p>"Mon code JavaScript pour filtrer des données n'affiche pas les résultats attendus."</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="time">2:00</span>
              <div className="timeline-content">
                <h4>Identification de l'erreur</h4>
                <p>Le tuteur examine le code et identifie une erreur dans la fonction de callback du filter()</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="time">5:00</span>
              <div className="timeline-content">
                <h4>Explication du concept</h4>
                <p>Clarification du fonctionnement des méthodes d'array et de la portée des variables</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="time">8:00</span>
              <div className="timeline-content">
                <h4>Correction du code</h4>
                <p>Modification du code avec l'étudiant et test de la solution</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="time">12:00</span>
              <div className="timeline-content">
                <h4>Application des conseils</h4>
                <p>L'étudiant applique les principes appris à d'autres parties du code</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="time">15:00</span>
              <div className="timeline-content">
                <h4>Fin de session</h4>
                <p>Problème résolu et compétences améliorées pour éviter des erreurs similaires</p>
              </div>
            </div>
          </div>
        </div>
        <button className="btn-primary">Essayer maintenant</button>
      </section>

      {/* CATÉGORIES POPULAIRES */}
      <section id="services" className="categories">
        <h2>Nos domaines d'expertise</h2>
        <div className="categories-list">
          <div className="category-card">
            <div className="category-icon">📚</div>
            <h3>Soutien scolaire</h3>
            <p>Maths, Physique, Chimie, Biologie, Français...</p>
          </div>
          <div className="category-card">
            <div className="category-icon">💻</div>
            <h3>Programmation</h3>
            <p>JavaScript, Python, Java, C++, CSS/HTML...</p>
          </div>
          <div className="category-card">
            <div className="category-icon">📊</div>
            <h3>Business</h3>
            <p>Marketing, Finance, Comptabilité, Management...</p>
          </div>
          <div className="category-card">
            <div className="category-icon">🗣️</div>
            <h3>Langues</h3>
            <p>Anglais, Espagnol, Allemand, Chinois...</p>
          </div>
          <div className="category-card">
            <div className="category-icon">🎨</div>
            <h3>Design</h3>
            <p>Photoshop, Illustrator, UI/UX, Animation...</p>
          </div>
          <div className="category-card">
            <div className="category-icon">📝</div>
            <h3>Rédaction</h3>
            <p>Dissertations, Lettres, CV, Relecture...</p>
          </div>
        </div>
        <button className="btn-primary">Tous nos domaines</button>
      </section>

      {/* TUTEURS VEDETTES */}
      <section className="featured-tutors">
        <h2>Nos experts disponibles</h2>
        <div className="profiles-list">
          <div className="profile-card">
            <div className="profile-header">
              <span className="rating"><FaStar /> 4.9</span>
              <span className="lesson-count">128 sessions</span>
            </div>
            <img src="/tutor-1.jpg" alt="Marie, experte en mathématiques" />
            <h3>Marie D.</h3>
            <p className="subject">Mathématiques</p>
            <p className="price">9€ / 15 min</p>
            <p className="bio">Docteure en mathématiques, spécialisée dans la résolution rapide de problèmes complexes.</p>
            <div className="tutor-badges">
              <span><BiTimeFive /> Disponible</span>
              <span><FaCheck /> Expert</span>
            </div>
            <button className="btn-secondary">Session de 15 min</button>
          </div>
          
          <div className="profile-card">
            <div className="profile-header">
              <span className="rating"><FaStar /> 5.0</span>
              <span className="lesson-count">93 sessions</span>
            </div>
            <img src="/tutor-2.jpg" alt="Thomas, expert en programmation" />
            <h3>Thomas L.</h3>
            <p className="subject">Programmation</p>
            <p className="price">12€ / 15 min</p>
            <p className="bio">Développeur senior avec 8 ans d'expérience, résout vos bugs et problèmes de code en minutes.</p>
            <div className="tutor-badges">
              <span><BiTimeFive /> Disponible</span>
              <span><FaCheck /> Expert</span>
            </div>
            <button className="btn-secondary">Session de 15 min</button>
          </div>
          
          <div className="profile-card">
            <div className="profile-header">
              <span className="rating"><FaStar /> 4.8</span>
              <span className="lesson-count">75 sessions</span>
            </div>
            <img src="/tutor-3.jpg" alt="Sophie, experte en langues" />
            <h3>Sophie M.</h3>
            <p className="subject">Anglais & Espagnol</p>
            <p className="price">8€ / 15 min</p>
            <p className="bio">Traductrice professionnelle, je corrige rapidement vos textes et vous aide avec les expressions difficiles.</p>
            <div className="tutor-badges">
              <span><BiTimeFive /> Disponible</span>
              <span><FaCheck /> Expert</span>
            </div>
            <button className="btn-secondary">Session de 15 min</button>
          </div>
        </div>
        <button className="btn-primary">Tous nos experts</button>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="testimonials">
        <h2>Ce que disent nos utilisateurs</h2>
        <div className="testimonial-list">
          <div className="testimonial">
            <div className="testimonial-header">
              <img src="/student-1.jpg" alt="Claire" className="student-img" />
              <div>
                <h4>Claire D.</h4>
                <div className="stars">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
              </div>
            </div>
            <p>"J'étais bloquée sur un problème de maths à 23h, avec un devoir à rendre le lendemain. En 15 minutes, Marie m'a tout expliqué et j'ai pu terminer. PingUp m'a sauvé la vie !"</p>
          </div>
          
          <div className="testimonial">
            <div className="testimonial-header">
              <img src="/student-2.jpg" alt="Lucas" className="student-img" />
              <div>
                <h4>Lucas T.</h4>
                <div className="stars">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
              </div>
            </div>
            <p>"Mon code ne fonctionnait pas et je perdais des heures à chercher le bug. En 10 minutes, Thomas l'a identifié et corrigé. Je n'aurais jamais trouvé seul !"</p>
          </div>
          
          <div className="testimonial">
            <div className="testimonial-header">
              <img src="/student-3.jpg" alt="Emma" className="student-img" />
              <div>
                <h4>Emma F.</h4>
                <div className="stars">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
              </div>
            </div>
            <p>"J'avais besoin de vérifier rapidement une lettre en anglais avant de l'envoyer. Sophie m'a corrigé toutes les erreurs en 15 minutes. Service rapide et efficace !"</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Débloquez-vous en 15 minutes</h2>
          <p>Ne perdez plus des heures sur un problème. Obtenez une réponse d'expert immédiatement.</p>
          <button className="btn-cta">Résoudre mon problème maintenant</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{ width: '100%', maxWidth: '100vw', boxSizing: 'border-box', overflow: 'hidden' }}>
        <div className="footer-content">
          <div className="footer-section">
            <h3>PingUp</h3>
            <p>Le micro-tutorat en 15 minutes qui vous fait gagner du temps.</p>
          </div>
          <div className="footer-section">
            <h3>Liens utiles</h3>
            <ul>
              <li><a href="#about">À propos</a></li>
              <li><a href="#services">Nos services</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Matières</h3>
            <ul>
              <li><a href="#math">Mathématiques</a></li>
              <li><a href="#programming">Programmation</a></li>
              <li><a href="#languages">Langues</a></li>
              <li><a href="#business">Business</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <ul>
              <li>contact@pingup.fr</li>
              <li>01 23 45 67 89</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 PingUp. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}
