@echo off
TITLE Anki Polymeres Launcher
CLS

ECHO ===================================================
ECHO      Lancement de l'App Anki Polymeres (Docker)
ECHO ===================================================
ECHO.

REM Verifier si Docker est lance
docker info >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERREUR] Docker n'est pas lance ou installe.
    ECHO Veuillez lancer Docker Desktop et reessayer.
    PAUSE
    EXIT /B
)

REM Se placer dans le dossier du script pour eviter les erreurs de chemin
REM Utilisation de pushd pour supporter les chemins UNC (ex: \\wsl.localhost\...)
pushd "%~dp0"

ECHO [1/2] Construction de l'image (cela peut prendre un moment la premiere fois)...
docker build -t anki-polymere-app .

ECHO.
ECHO [2/2] Lancement de l'application...
ECHO Une fois lance, ouvrez votre navigateur a l'adresse : http://localhost:8501
ECHO Vos donnees seront sauvegardees dans le dossier 'data'.
ECHO.
ECHO Pour arreter le serveur, faites Ctrl+C dans cette fenetre.
ECHO.

REM On cree le dossier de donnees local s'il n'existe pas
IF NOT EXIST "data" (
    MKDIR "data"
)

REM On lance le conteneur en interactif (-it)
REM On supprime le conteneur apres execution (--rm)
REM On monte le dossier data pour la persistance (-v)
REM On mappe le port 8501 pour acceder a l'interface web (-p)
docker run -it --rm -v "%cd%\data:/app/data" -p 8501:8501 anki-polymere-app

ECHO.
ECHO Application fermee.
popd
PAUSE
