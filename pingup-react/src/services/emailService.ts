import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Interface pour les informations de réservation
export interface BookingInfo {
  tutorName: string;
  tutorEmail: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  date: string;
  time: string;
  endTime?: string;
  duration: string;
  price: number;
  notes?: string;
}

// URL du backend d'emails
const EMAIL_API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/send-confirmation-email`
  : 'http://localhost:3002/api/send-confirmation-email';

/**
 * Envoie un email de confirmation aux deux parties (étudiant et expert)
 * lors d'une réservation de session de tutorat
 * 
 * @param booking Informations de la réservation
 * @returns Promesse qui se résout à true si l'envoi est réussi, false sinon
 */
export const sendBookingConfirmationEmail = async (
  booking: BookingInfo
): Promise<boolean> => {
  try {
    console.log('Envoi d\'un email de confirmation aux deux parties:', booking);
    
    // Appel à l'API backend pour envoyer l'email
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'envoi de l\'email');
    }
    
    console.log('Email de confirmation envoyé avec succès:', data);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    
    // Solution de secours : afficher une notification à l'utilisateur
    console.log('⚠️ L\'email n\'a pas pu être envoyé. Veuillez noter les détails de votre réservation.');
    
    return false;
  }
};

// Fonction pour envoyer un email
const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // Ajouter l'email à la collection 'emails' dans Firestore
    await addDoc(collection(db, 'emails'), {
      to,
      subject,
      html,
      status: 'pending',
      createdAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}; 