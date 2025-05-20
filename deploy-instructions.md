# PingUp Deployment Instructions

Ce guide explique comment déployer votre application PingUp (frontend React et backend d'email) sur des services d'hébergement populaires.

## 1. Déployer le Backend d'Emails (pingup-email-backend)

### Option 1: Render.com (Recommandé)

1. Créez un compte sur [Render.com](https://render.com/)
2. Depuis le dashboard, cliquez sur "New +" puis "Web Service"
3. Connectez votre dépôt GitHub ou utilisez l'option "Deploy from Git Repo"
4. Configurez le service:
   - **Name**: pingup-email-backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (ou plus selon vos besoins)

5. Ajoutez les variables d'environnement suivantes:
   - `EMAIL_SERVICE`: gmail
   - `EMAIL_USER`: votre-email@gmail.com
   - `EMAIL_PASSWORD`: votre-mot-de-passe-d-application
   - `PORT`: 10000

   > **Note**: Pour Gmail, vous devez utiliser un "Mot de passe d'application" et non votre mot de passe régulier. [Voir les instructions ici](https://support.google.com/accounts/answer/185833).

6. Cliquez sur "Create Web Service"

### Option 2: Heroku

1. Créez un compte sur [Heroku](https://heroku.com)
2. Installez l'[Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Connectez-vous et créez une nouvelle application:
   ```
   heroku login
   cd pingup-email-backend
   heroku create pingup-email-backend
   ```
4. Ajoutez les variables d'environnement:
   ```
   heroku config:set EMAIL_SERVICE=gmail
   heroku config:set EMAIL_USER=votre-email@gmail.com
   heroku config:set EMAIL_PASSWORD=votre-mot-de-passe-d-application
   ```
5. Déployez l'application:
   ```
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

## 2. Déployer le Frontend React (pingup-react)

### Option 1: Vercel (Recommandé)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Installez Vercel CLI ou utilisez l'interface web
3. Importez votre projet GitHub
4. Configurez les paramètres de build:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   
5. Ajoutez la variable d'environnement pour pointer vers votre backend:
   - `VITE_API_URL`: https://votre-backend-url.onrender.com

6. Déployez l'application

### Option 2: Netlify

1. Créez un compte sur [Netlify](https://netlify.com)
2. Cliquez sur "New site from Git"
3. Connectez votre dépôt GitHub
4. Configurez les paramètres de build:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   
5. Ajoutez la variable d'environnement:
   - `VITE_API_URL`: https://votre-backend-url.onrender.com
   
6. Cliquez sur "Deploy site"

## 3. Configuration CORS

Pour que votre backend accepte les requêtes de votre frontend déployé, vous devez mettre à jour la configuration CORS dans `server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://pingup.vercel.app',  // Ajoutez l'URL de votre frontend déployé
  'https://votre-domaine-personnalisé.com'  // Si vous utilisez un domaine personnalisé
];
```

## 4. Variables d'environnement pour le frontend

Créez un fichier `.env.production` dans le dossier `pingup-react` avec:

```
VITE_API_URL=https://votre-backend-url.onrender.com
VITE_FIREBASE_API_KEY=votre-api-key
VITE_FIREBASE_AUTH_DOMAIN=votre-auth-domain
VITE_FIREBASE_PROJECT_ID=votre-project-id
VITE_FIREBASE_STORAGE_BUCKET=votre-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre-messaging-sender-id
VITE_FIREBASE_APP_ID=votre-app-id
```

## 5. Vérification du déploiement

1. Testez votre API backend en accédant à `https://votre-backend.onrender.com/`
2. Testez votre frontend en accédant à l'URL fournie par Vercel ou Netlify
3. Essayez de réserver une session pour vérifier que les emails sont envoyés correctement

## Résolution des problèmes courants

- **Erreurs CORS**: Assurez-vous que votre backend autorise les requêtes depuis l'URL de votre frontend déployé
- **Problèmes d'email**: Vérifiez que vous utilisez un mot de passe d'application pour Gmail et non votre mot de passe principal
- **Erreurs de connexion à Firebase**: Vérifiez vos variables d'environnement Firebase 