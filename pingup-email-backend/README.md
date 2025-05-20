# PingUp Email Backend

Un service backend simple pour gérer l'envoi d'emails de confirmation lors des réservations de sessions de tutorat sur PingUp.

## Fonctionnalités

- Envoi d'emails de confirmation aux étudiants et tuteurs
- Support complet de CORS pour une intégration facile avec le frontend
- Configuration simple via variables d'environnement
- Templates d'emails HTML et texte pour une présentation professionnelle

## Installation

1. Clonez ce dépôt et naviguez dans le dossier du projet
```bash
cd pingup-email-backend
```

2. Installez les dépendances
```bash
npm install
```

3. Créez un fichier `.env` basé sur le modèle `.env.example`
```bash
cp .env.example .env
```

4. Modifiez le fichier `.env` avec vos informations
```
PORT=3002
NODE_ENV=development
EMAIL_SERVICE=gmail
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-d-application
```

**Important pour Gmail** : 
- Utilisez un "mot de passe d'application" et non votre mot de passe normal
- Activez l'authentification à 2 facteurs sur votre compte Google
- Créez un mot de passe d'application spécifique pour cette application
- Plus d'informations: https://support.google.com/accounts/answer/185833

5. Lancez le serveur en mode développement
```bash
npm run dev
```

## Utilisation

### Envoi d'un email de confirmation

Envoyez une requête POST à l'endpoint `/api/send-confirmation-email` avec le corps suivant :

```json
{
  "tutorName": "Nom du tuteur",
  "tutorEmail": "tuteur@example.com",
  "studentName": "Nom de l'étudiant",
  "studentEmail": "etudiant@example.com",
  "subject": "Mathématiques",
  "date": "Lundi 10 janvier 2024",
  "time": "14:00",
  "endTime": "15:00",
  "duration": "1 heure",
  "price": 60
}
```

### Intégration avec le frontend

Dans votre service d'email côté frontend, modifiez l'URL pour utiliser ce backend:

```typescript
// emailService.ts
const sendBookingConfirmationEmail = async (booking: BookingInfo) => {
  try {
    // Utiliser l'URL du backend d'emails
    const response = await fetch('http://localhost:3002/api/send-confirmation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};
```

## Déploiement

### Déploiement sur Render

1. Créez un compte sur [Render](https://render.com/)
2. Allez dans le tableau de bord et cliquez sur "New Web Service"
3. Configurez le service avec les paramètres suivants :
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Ajoutez les variables d'environnement de votre fichier .env

### Déploiement sur Railway ou Vercel

Un processus similaire peut être suivi pour déployer sur [Railway](https://railway.app/) ou [Vercel](https://vercel.com/), en important votre fichier .env ou en configurant manuellement les variables d'environnement.

## Support

Pour toute question ou problème, ouvrez une issue dans le dépôt GitHub. 