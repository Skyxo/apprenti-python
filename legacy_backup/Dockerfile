# Utiliser une image Python officielle légère
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY backend.py .
COPY app.py .

# Commande par défaut pour lancer l'application
# Exposer le port par defaut de Streamlit
EXPOSE 8501

# Commande par défaut pour lancer l'application Streamlit
ENTRYPOINT ["streamlit", "run", "app.py", "--server.address=0.0.0.0"]
