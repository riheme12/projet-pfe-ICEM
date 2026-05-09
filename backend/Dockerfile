# Image de base légère
FROM node:18-alpine

# Dossier de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste du code source
COPY . .

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Exposer le port du serveur
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]
