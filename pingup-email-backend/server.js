require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://pingup.vercel.app',
      'https://pingup-app.netlify.app'
    ];

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (comme les appels API directs)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Origine bloquée par CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware pour parser le JSON
app.use(express.json());

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Route de test
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>PingUp Email Service</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { color: #4285f4; }
          .endpoint { background: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
          code { background: #e6e6e6; padding: 3px 6px; border-radius: 3px; font-family: monospace; }
        </style>
      </head>
      <body>
        <h1>PingUp Email Service</h1>
        <p>Ce serveur gère l'envoi d'emails pour l'application PingUp.</p>
        
        <div class="endpoint">
          <h3>Endpoint pour envoyer des emails de confirmation</h3>
          <p>Pour envoyer un email de confirmation, utilisez l'endpoint suivant :</p>
          <p><code>POST ${req.protocol}://${req.get('host')}/api/send-confirmation-email</code></p>
        </div>
        
        <p><strong>Statut</strong> : Opérationnel ✅</p>
        <p><strong>Environnement</strong> : ${process.env.NODE_ENV || 'development'}</p>
      </body>
    </html>
  `);
});

// Route pour envoyer un email de confirmation
app.post('/api/send-confirmation-email', async (req, res) => {
  try {
    const { 
      tutorName, 
      tutorEmail, 
      studentName, 
      studentEmail, 
      subject, 
      date, 
      time, 
      endTime,
      duration,
      price
    } = req.body;

    // Validation des données requises
    if (!tutorEmail || !studentEmail || !subject || !date || !time) {
      return res.status(400).json({ success: false, message: 'Données manquantes pour l\'envoi de l\'email' });
    }

    // Préparation du contenu de l'email
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://i.imgur.com/4SfjWEc.png" alt="PingUp" style="max-width: 150px; height: auto;" />
        </div>
        
        <div style="background-color: #f9f9f9; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <h2 style="color: #2c8f83; margin-top: 0; font-weight: 600;">Confirmation de Réservation</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Bonjour ${studentName} et ${tutorName},</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Nous vous confirmons que votre session de tutorat a été réservée avec succès.</p>
        </div>
        
        <div style="background-color: #fff; border-left: 4px solid #3fb8a9; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #2c8f83; margin-top: 0; font-size: 18px;">Détails de la session</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666; width: 40%;"><strong>Matière</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Date</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Horaire</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${time} - ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Durée</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333;">${duration}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Tarif</strong></td>
              <td style="padding: 8px 0; color: #333;"><span style="font-weight: 600;">${price}€</span></td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #f0f9f7; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #333; margin-top: 0; font-size: 15px;">✓ Un événement a été ajouté à votre calendrier Google.</p>
          <p style="color: #333; margin-bottom: 0; font-size: 15px;">✓ Vous recevrez un rappel automatique 24 heures avant la session.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
          <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.</p>
          <p style="margin-bottom: 5px;">Cordialement,</p>
          <p style="font-weight: 600; color: #2c8f83; margin-top: 0;">L'équipe PingUp</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
          <p>© 2024 PingUp. Tous droits réservés.</p>
        </div>
      </div>
    `;

    const textContent = `
      Confirmation de Réservation - PingUp

      Bonjour ${studentName} et ${tutorName},

      Nous vous confirmons que votre session de tutorat a été réservée avec succès.

      Détails de la session :
      - Matière : ${subject}
      - Date : ${date}
      - Horaire : ${time} - ${endTime}
      - Durée : ${duration}
      - Tarif : ${price}€

      Un événement a été ajouté à votre calendrier Google.
      Vous recevrez un rappel automatique 24 heures avant la session.

      Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.

      Cordialement,
      L'équipe PingUp
    `;

    // Options d'email
    const mailOptions = {
      from: `"PingUp" <${process.env.EMAIL_USER}>`,
      to: [studentEmail, tutorEmail].join(','),
      subject: `Confirmation de votre session de tutorat - ${subject}`,
      text: textContent,
      html: htmlContent
    };

    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);

    res.status(200).json({ 
      success: true, 
      message: 'Email de confirmation envoyé avec succès',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur d'emails démarré sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
}); 