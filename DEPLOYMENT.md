# Guide de déploiement de PingUp

Ce document explique comment déployer l'application PingUp pour la production.

## Architecture de l'application

PingUp est composé de deux parties principales :

1. **Frontend React (pingup-react)** - Application React qui fournit l'interface utilisateur
2. **Backend d'Emails (pingup-email-backend)** - Service Node.js pour l'envoi d'emails de confirmation

## 1. Déploiement du Backend d'Emails

### Prérequis
- Un compte Gmail pour l'envoi d'emails (ou autre service de messagerie)
- Un mot de passe d'application Gmail (si vous utilisez Gmail)

### Option A: Déploiement sur Render.com (Recommandé)

1. Créez un compte sur [Render.com](https://render.com/)
2. Depuis le dashboard, cliquez sur "New" puis "Web Service"
3. Connectez votre dépôt GitHub ou utilisez l'option "Deploy from Git Repo"
4. Configurez votre service :
   - **Name**: pingup-email-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (ou plus selon vos besoins)

5. Ajoutez les variables d'environnement suivantes dans l'onglet "Environment" :
   - `EMAIL_SERVICE`: gmail (ou autre service)
   - `EMAIL_USER`: votre-email@gmail.com
   - `EMAIL_PASSWORD`: votre-mot-de-passe-d-application
   - `PORT`: 10000
   - `NODE_ENV`: production
   - `ALLOWED_ORIGINS`: https://votre-frontend.vercel.app (ajoutez d'autres origines séparées par des virgules)

6. Cliquez sur "Create Web Service"
7. Notez l'URL de votre service (ex: https://pingup-email-backend.onrender.com)

### Option B: Déploiement sur Heroku

1. Créez un compte sur [Heroku](https://heroku.com)
2. Installez l'[Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Connectez-vous et créez une nouvelle application :
   ```
   heroku login
   cd pingup-email-backend
   heroku create pingup-email-backend
   ```
4. Ajoutez les variables d'environnement :
   ```
   heroku config:set EMAIL_SERVICE=gmail
   heroku config:set EMAIL_USER=votre-email@gmail.com
   heroku config:set EMAIL_PASSWORD=votre-mot-de-passe-d-application
   heroku config:set NODE_ENV=production
   heroku config:set ALLOWED_ORIGINS=https://votre-frontend.vercel.app
   ```
5. Déployez l'application :
   ```
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

## 2. Déploiement du Frontend React

### Prérequis
- Les identifiants Firebase pour l'authentification et la base de données
- L'URL de votre backend d'emails déployé

### Option A: Déploiement sur Vercel (Recommandé)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Installez Vercel CLI : `npm i -g vercel` ou utilisez l'interface web
3. Connectez votre dépôt GitHub sur Vercel
4. Configurez les paramètres de build :
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   
5. Ajoutez les variables d'environnement :
   - `VITE_API_URL`: URL de votre backend (ex: https://pingup-email-backend.onrender.com)
   - `VITE_FIREBASE_API_KEY`: Votre clé API Firebase
   - `VITE_FIREBASE_AUTH_DOMAIN`: Domaine d'authentification Firebase
   - `VITE_FIREBASE_PROJECT_ID`: ID du projet Firebase
   - `VITE_FIREBASE_STORAGE_BUCKET`: Bucket de stockage Firebase
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: ID de l'expéditeur Firebase
   - `VITE_FIREBASE_APP_ID`: ID de l'application Firebase

6. Cliquez sur "Deploy"
7. Notez l'URL de votre frontend (ex: https://pingup.vercel.app)

### Option B: Déploiement sur Netlify

1. Créez un compte sur [Netlify](https://netlify.com)
2. Cliquez sur "New site from Git"
3. Connectez votre dépôt GitHub
4. Configurez les paramètres de build :
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   
5. Ajoutez les mêmes variables d'environnement que pour Vercel (dans "Site settings" > "Environment variables")
6. Cliquez sur "Deploy site"

## 3. Configuration finale

### Mise à jour des origines CORS

Après le déploiement, assurez-vous que votre backend d'emails accepte les requêtes de votre frontend déployé. Dans votre backend, assurez-vous que l'URL de votre frontend est incluse dans les origines autorisées (via la variable d'environnement `ALLOWED_ORIGINS`).

### Test du système déployé

1. Accédez à votre frontend déployé
2. Créez un compte ou connectez-vous
3. Essayez de réserver une session de tutorat
4. Vérifiez que l'email de confirmation est bien envoyé

## Résolution des problèmes courants

### Problèmes CORS

Si vous rencontrez des erreurs CORS, vérifiez :
- Que l'URL exacte de votre frontend est bien dans la liste des origines autorisées du backend
- Que vous utilisez le protocole correct (https:// et non http://)

### Problèmes d'envoi d'emails

Si les emails ne sont pas envoyés :
- Vérifiez les journaux du backend pour voir les erreurs spécifiques
- Assurez-vous que votre compte Gmail (ou autre) autorise les applications moins sécurisées, ou utilisez un mot de passe d'application
- Vérifiez que vos variables d'environnement sont correctement configurées

### Problèmes Firebase

Si l'authentification ou la base de données ne fonctionne pas :
- Vérifiez que toutes les variables d'environnement Firebase sont correctement définies
- Assurez-vous que votre projet Firebase est configuré pour permettre l'authentification et Firestore
- Vérifiez que l'URL de votre site déployé est autorisée dans la console Firebase (Authentication > Sign-in method > Authorized domains)

## Notes de sécurité

- Ne partagez jamais vos identifiants de compte de service ou mots de passe dans votre code
- Utilisez toujours des variables d'environnement pour les informations sensibles
- Si vous utilisez Gmail, créez un compte dédié pour votre application plutôt que d'utiliser votre compte personnel 