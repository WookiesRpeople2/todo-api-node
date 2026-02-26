## Quick Start Guide - Intégration Sentry

### 1️⃣ Créer un compte Sentry

```bash
# Aller sur https://sentry.io/ et créer un compte
# Créer un nouveau projet Node.js
# Copier votre DSN (Data Source Name)
```

### 2️⃣ Configurer l'environnement

```bash
# Dans votre fichier .env
SENTRY_DSN=https://votre-dsn@o123456.ingest.sentry.io/123456
NODE_ENV=production  # ou development
```

### 3️⃣ Démarrer l'application

```bash
npm install   # Sentry est déjà en dépendance
npm start     # Démarre le serveur
```

### 4️⃣ Tester l'intégration (développement uniquement)

```bash
# L'endpoint /test-error est disponible en développement
curl http://localhost:3000/test-error

# Avec un message personnalisé
curl "http://localhost:3000/test-error?message=Test%20personnalisé"
```

### 5️⃣ Voir les erreurs dans Sentry

1. Allez sur votre dashboard Sentry
2. Cliquez sur "Issues"
3. Les erreurs capturées apparaîtront en temps réel

---

## Fonctionnalités Implémentées ✨

### ✅ Capture Automatique d'Erreurs
- Les erreurs non gérées sont automatiquement envoyées à Sentry
- Tous les routes Todo (CRUD) ont un `asyncHandler` qui capture les erreurs

### ✅ Contexte de Requête
Chaque erreur inclut:
- Méthode HTTP (GET, POST, PUT, DELETE)
- URL de la requête
- Headers (sauf les sensitifs)
- Query parameters
- Body (si applicable)

### ✅ Request/Error Handler Middleware
- `Sentry.Handlers.requestHandler()` - Capture les infos de requête
- `Sentry.Handlers.errorHandler()` - Gère les erreurs HTTP

### ✅ Logging Structuré
- Logs Pino + Sentry présentent ensemble
- Erreurs routes capturées avec contexte complet

### ✅ Endpoint de Test
- `GET /test-error` - Pour tester la capture Sentry
- Disabled en production (NODE_ENV=production)

### ✅ Variable Conditioning
- Sentry uniquement actif si `SENTRY_DSN` est défini
- Safe pour développement local (laissez `SENTRY_DSN` vide)

---

## Architecture 📐

```
App Initialization
    ↓
Sentry.init() → Configure si SENTRY_DSN existe
    ↓
Express Middleware Stack
    ├─ json()
    ├─ Sentry.requestHandler() → Capture infos requête
    ├─ Context Enrichment → Ajoute tags & contexte
    ├─ Routes (GET, POST, PUT, DELETE)
    │   └─ asyncHandler() → Capture erreurs
    └─ Sentry.errorHandler() → Gère erreurs HTTP
```

---

## Routes Avec Sentry

### ✅ Routes Todo Protégées
- `POST /todos` - asyncHandler wrapping
- `GET /todos` - asyncHandler wrapping
- `GET /todos/:id` - asyncHandler wrapping
- `PUT /todos/:id` - asyncHandler wrapping
- `DELETE /todos/:id` - asyncHandler wrapping
- `GET /todos/search/all` - asyncHandler wrapping

### ✅ Autres Routes
- `GET /` - Welcome
- `GET /health` - Health check
- `GET /feat` - Feature flags
- `GET /debug` - Debug endpoint (dev only)
- `GET /test-error` - Test Sentry (dev only)

---

## Configuration Production 🚀

```bash
# .env.production
NODE_ENV=production
SENTRY_DSN=https://votre-dsn-production@o123456.ingest.sentry.io/123456
PORT=3000

# Les traces sont sampliées à 10% en production (voir app.js)
# Modifiez tracesSampleRate pour ajuster
```

---

## Dépannage 🔧

### Sentry ne capture pas les erreurs?
1. Vérifiez que `SENTRY_DSN` est défini
2. Vérifiez NODE_ENV (doit être production pour tracer à 10%)
3. Vérifiez que @sentry/node est installé: `npm list @sentry/node`

### Les logs Pino bloquent Sentry?
- Non, les deux coexistent parfaitement
- Logs locaux + erreurs Sentry

### Comment désactiver Sentry?
1. Laissez `SENTRY_DSN` vide dans .env
2. Application tourne normalement sans Sentry

---

## Ressources 📚

- [Sentry Docs](https://docs.sentry.io/platforms/node/)
- [Express Integration](https://docs.sentry.io/platforms/node/integrations/express/)
- Voir aussi: `SENTRY.md` dans le projet

---

## Test en Local 🧪

```bash
# Développement (Sentry optionnel)
npm test

# Avec Sentry enabled
SENTRY_DSN=https://example@o123.ingest.sentry.io/123 npm test

# Lancer le serveur en dev
npm start

# Tester l'endpoint de test
curl http://localhost:3000/test-error?message="Mon%20erreur"
```
