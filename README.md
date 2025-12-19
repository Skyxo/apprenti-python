# Anki Polymères CLI (Version Docker)

Une application de révision par répétition espacée (type Anki) pour le cours de Polymères et Composites, fonctionnant dans un conteneur Docker pour une installation facile.

## Prérequis

1.  **Docker Desktop** doit être installé sur votre machine.
    *   [Télécharger Docker Desktop pour Windows/Mac/Linux](https://www.docker.com/products/docker-desktop/)

## Installation & Lancement (Windows)

1.  Dézippez le dossier du projet ou clonez-le.
2.  Assurez-vous que Docker Desktop est lancé.
3.  Double-cliquez sur le fichier `start.bat`.

Une fenêtre noire va s'ouvrir, construire l'application automatiquement et la lancer. Vos progrès (XP, cartes, séries) seront sauvegardés automatiquement dans le fichier `polymere_data.json` situé dans le même dossier.

## Lancement Manuel (Linux / Mac / Expert)

Si vous préférez utiliser le terminal :

1.  **Construire l'image :**
    ```bash
    docker build -t anki-polymere-app .
    ```

2.  **Lancer le conteneur :**
    ```bash
    docker run -it --rm -v "$(pwd)/polymere_data.json:/app/polymere_data.json" anki-polymere-app
    ```

   *L'argument `-v` est crucial pour que vos progrès soient sauvegardés sur votre ordinateur et non perdus à la fermeture du conteneur.*
