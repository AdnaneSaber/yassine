# Configuration des Variables d'Environnement

Ce projet charge automatiquement les variables depuis `.env.local` - plus besoin d'exporter manuellement !

## 🚀 Comment ça marche

### Développement

```bash
npm run dev
```
Les variables sont chargées automatiquement depuis `.env.local`.

### Tests

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tous les tests
npm run test:run

# E2E avec Playwright
npm run test:e2e
```

Tous les scripts chargent automatiquement `.env.local`.

## 📁 Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `load-env.js` | Script qui parse `.env.local` et charge les variables |
| `vitest.config.ts` | Importe `load-env.js` automatiquement |
| `vitest.integration.config.ts` | Importe `load-env.js` automatiquement |
| `playwright.config.ts` | Importe `load-env.js` automatiquement |
| `package.json` | Scripts `dev`, `build`, `start` chargent l'env |

## 📝 Format supporté

Le fichier `.env.local` peut utiliser ces formats :

```bash
# Avec export (bash style)
export MONGODB_URI="mongodb+srv://..."
export RESEND_API_KEY="re_..."

# Sans export (standard dotenv)
MONGODB_URI=mongodb+srv://...
RESEND_API_KEY=re_...

# Avec ou sans guillemets
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL="http://localhost:3000"
```

## ✅ Variables requises

```bash
# Base de données
export MONGODB_URI="your_mongodb_uri"

# Email (Resend)
export RESEND_API_KEY="re_your_key"
export EMAIL_FROM="noreply@yourdomain.com"

# NextAuth
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="your_secret_key"

# App
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🔧 Fonctionnement technique

Le script `load-env.js` :
1. Lit le fichier `.env.local`
2. Supprime le préfixe `export ` si présent
3. Gère les guillemets et les retours à la ligne Windows (`\r\n`)
4. Définit les variables dans `process.env`
5. Ne remplace pas les variables déjà définies

## 🐛 Dépannage

Si les variables ne sont pas chargées :

```bash
# Vérifier que .env.local existe
test -f .env.local && echo "OK" || echo "Fichier manquant"

# Tester le chargement
node -e "require('./load-env'); console.log(process.env.MONGODB_URI)"

# Vérifier les permissions
ls -la .env.local
```
