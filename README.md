# 🎓 FlashTOEFL - Cramming Assistant

**FlashTOEFL** est une application web progressive (PWA) conçue pour l'apprentissage accéléré du vocabulaire avant le TOEFL. Elle utilise un algorithme de répétition espacée optimisé pour des sessions courtes (7 jours).

![Aperçu de l'application](https://via.placeholder.com/800x400?text=FlashTOEFL+Preview)

## 🚀 Fonctionnalités Clés

- **⚡ Algorithme "Cram Mode"** : Intervalles ultra-courts (1 min, 10 min, 4h) pour maximiser la rétention sur 7 jours.
- **🔄 Génération Intelligente de Cartes** : À partir d'une simple ligne CSV, l'application génère 3 variantes pédagogiques :
    1.  **Contexte (Cloze)** : Phrase à trou (Le plus efficace).
    2.  **Définition** : Anglais → Mot Cible.
    3.  **Traduction** : Français → Mot Cible.
- **📱 Mobile First** : Interface fluide et gestuelle pensée pour smartphone.
- **💾 100% Offline** : Vos données sont stockées localement dans votre navigateur.

## 🛠️ Installation & Démarrage

### Prérequis
- `Node.js` (v18+)
- `npm`

### Installation
```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev -- --host
```

## 📂 Architecture du Projet

Le projet suit une architecture React moderne et modulaire :

```
src/
├── components/     # Composants UI réutilisables (Flashcard, Boutons...)
├── contexts/       # Gestion d'état global (DeckContext)
├── pages/          # Vues principales (Home, StudySession)
├── utils/          # Logique métier pure
│   ├── scheduler.js  # Algorithme de répétition espacée (SM-2 modifié)
│   ├── csvParser.js  # Moteur d'import et génération de cartes
│   └── deckManager.js # Couche de persistence (localStorage)
└── App.jsx         # Routeur et point d'entrée
```

## 📝 Format CSV Supporté

Pour importer vos propres listes, utilisez le format CSV suivant (séparateur `;`) :

```csv
Word;French Translation;English Definition;Example Sentence
Epiphany;Épiphanie;A moment of sudden revelation;After days of struggle, she had an epiphany.
```

## 🧠 L'Algorithme de Révision

Contrairement aux applications classiques (Anki) qui espacent sur des mois, **FlashTOEFL** est agressif :
- **Again** : Révérification dans **1 minute**.
- **Hard** : Révérification dans **10 minutes**.
- **Good** : Révérification dans **4 heures** (permet plusieurs révisions par jour).
- **Easy** : Révérification dans **3 jours**.

---
*Développé pour réussir.*
