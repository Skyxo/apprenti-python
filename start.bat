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
cd /d "%~dp0"

ECHO [1/2] Construction de l'image (cela peut prendre un moment la premiere fois)...
docker build -t anki-polymere-app .

ECHO.
ECHO [2/2] Lancement de l'application...
ECHO Vos donnees seront sauvegardees dans ce dossier.
ECHO.

REM Creer le fichier json vide s'il n'existe pas pour eviter que Docker ne cree un dossier a la place
IF NOT EXIST "polymere_data.json" (
    ECHO {} > "polymere_data.json"
)

REM On lance le conteneur en interactif (-it)
REM On supprime le conteneur apres execution (--rm)
REM On monte le fichier JSON actuel pour la persistance (-v)
docker run -it --rm -v "%cd%\polymere_data.json:/app/polymere_data.json" anki-polymere-app

ECHO.
ECHO Application fermee.
PAUSE
