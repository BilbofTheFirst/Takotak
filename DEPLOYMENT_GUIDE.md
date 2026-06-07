# Guide de Déploiement - Mise à jour Drapeaux et Matchs KO

## Résumé des Changements

### Frontend - Changements Effectués ✅
1. **Remplacé l'import emoji flags par react-country-flag**
   - Fichiers modifiés: `Predictions.js`, `Simulation.js`, `KOBracket.js`, `TournamentBracket.js`
   - Nouveau fichier: `utils/countryCode.js` - Mapping ISO country codes pour tous les pays

2. **Package.json mis à jour**
   - Ajouté: `"react-country-flag": "^3.0.0"`
   - Ajouté: `"country-flag-icons": "^6.0.0"`

### Backend - À Faire ⚠️
Les matchs KO doivent être ajoutés à la base de données Railway

## Instructions de Déploiement

### Étape 1: Mettre à jour la base de données Railway

#### Option A: Via Railway Dashboard (Plus simple)
1. Aller sur https://dashboard.railway.app
2. Sélectionner le projet **takotak**
3. Aller dans l'onglet **Data** → PostgreSQL
4. Cliquer sur **Query** (ou CLI)
5. Copier-coller tout le contenu de: `backend/db/MIGRATE_KO_MATCHES.sql`
6. Exécuter la requête

#### Option B: Via Terminal SSH sur Railway
```bash
# Depuis le dashboard Railway, ouvrir le terminal du service PostgreSQL
# Copier la commande de connexion fournie
# Exécuter les migrations
psql -U postgres -d railway -c "$(cat backend/db/MIGRATE_KO_MATCHES.sql)"
```

### Étape 2: Vérifier la migration
Après exécution du script SQL, vérifier que:
- ✅ Total: 104 matchs (72 poules + 32 KO)
- ✅ La finale est le 19 juillet 21:00 (UTC+2)
- ✅ Le match 3e place est le 18 juillet 23:00 (UTC+2)

### Étape 3: Redéployer le Frontend

#### Via Vercel (Automatique)
1. Push les changements vers main (déjà fait en local):
   ```bash
   git push origin main
   ```
2. Vercel détecte automatiquement le changement et redéploie
3. Attendre ~5-10 minutes pour le déploiement

#### Ou manuellement via CLI:
```bash
cd frontend
npm install
npm run build
vercel --prod
```

### Étape 4: Redéployer le Backend

#### Via Railway (Automatique)
1. Push les changements vers main
2. Railway détecte automatiquement et redéploie
3. Attendre ~2-3 minutes pour le déploiement

### Étape 5: Tester

Accéder à https://takotak.vercel.app et vérifier:

#### Page Prédictions
- ✅ Les drapeaux des équipes s'affichent (pas de codes ISO comme MX, ZA)
- ✅ Les stages sont corrects (16ème, 8ème, Quarts, Semis, etc.)
- ✅ Les dates finales: 18 juillet 23:00 et 19 juillet 21:00

#### Page Simulation
- ✅ Les 2 groupes par ligne s'affichent correctement
- ✅ Les drapeaux apparaissent dans les tableaux
- ✅ Le bracket de phase éliminatoire se charge
- ✅ Les simulations se sauvegardent en localStorage

## Fichiers Modifiés

### Code Changes (Déjà pushés):
- `frontend/package.json` - Dépendances ajoutées
- `frontend/src/utils/countryCode.js` - **NOUVEAU FILE**
- `frontend/src/pages/Predictions.js` - Remplacé getCountryFlag par CountryFlag
- `frontend/src/pages/Simulation.js` - Remplacé getCountryFlag par CountryFlag
- `frontend/src/components/KOBracket.js` - Remplacé getCountryFlag par CountryFlag
- `frontend/src/components/TournamentBracket.js` - Remplacé getFlag par CountryFlag

### Database Scripts (À exécuter):
- `backend/db/MIGRATE_KO_MATCHES.sql` - Migration complète KO matches

### Anciens fichiers (plus utilisés):
- `frontend/src/utils/flags.js` - **DEPRECATED** (emoji flags)

## Rollback (Si besoin)
Si quelque chose va mal:
1. Faire un commit vide: `git revert HEAD`
2. Vercel/Railway redéploient automatiquement la version précédente
3. Pour la DB: `DELETE FROM matches WHERE id > 72;` puis réexécuter le script

## Vérification Finale - Checklist

- [ ] Script SQL exécuté sur Railway → 104 matchs total
- [ ] Frontend redéployé sur Vercel
- [ ] Backend redéployé sur Railway
- [ ] Drapeaux visibles sur page Prédictions
- [ ] Dates correctes pour finale (19 juillet 21:00)
- [ ] Simulation charge sans erreurs
- [ ] Bracket KO s'affiche correctement

## Questions?
Vérifier les logs:
- **Frontend**: https://vercel.com (projet takotak)
- **Backend**: https://dashboard.railway.app (takotak PostgreSQL)
