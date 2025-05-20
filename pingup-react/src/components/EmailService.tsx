import { useState } from 'react';
import './EmailService.css';

interface EmailFormData {
  to: string;
  subject: string;
  text: string;
}

interface EmailServiceProps {
  zapierWebhookUrl: string; // L'URL du webhook Zapier
}

const EmailService: React.FC<EmailServiceProps> = ({ zapierWebhookUrl }) => {
  const [emailData, setEmailData] = useState<EmailFormData>({
    to: '',
    subject: '',
    text: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Réinitialisation des états
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      // Envoi des données au webhook Zapier
      const response = await fetch(zapierWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de l'envoi: ${response.statusText}`);
      }
      
      setSuccess(true);
      
      // Réinitialisation du formulaire après envoi réussi
      setEmailData({
        to: '',
        subject: '',
        text: ''
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-service">
      <h2>Envoyer un email</h2>
      
      {success && (
        <div className="success-message">
          <p>Email envoyé avec succès!</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>Erreur: {error}</p>
        </div>
      )}
      
      <form onSubmit={sendEmail}>
        <div className="form-group">
          <label htmlFor="to">Destinataire *</label>
          <input
            type="email"
            id="to"
            name="to"
            value={emailData.to}
            onChange={handleChange}
            required
            placeholder="email@exemple.com"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="subject">Sujet *</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={emailData.subject}
            onChange={handleChange}
            required
            placeholder="Sujet de l'email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="text">Message *</label>
          <textarea
            id="text"
            name="text"
            value={emailData.text}
            onChange={handleChange}
            required
            placeholder="Votre message..."
            rows={5}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Envoyer l\'email'}
        </button>
      </form>
    </div>
  );
};

export default EmailService; 