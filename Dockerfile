# Utiliser une image Python officielle légère
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY anki_polymere.py .
# On copie aussi le json par défaut au cas où, mais il sera monté par volume idéalement
COPY polymere_data.json .

# Commande par défaut pour lancer l'application
ENTRYPOINT ["python", "anki_polymere.py"]
