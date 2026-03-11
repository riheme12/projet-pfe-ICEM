# ICEM Backend - Guide de Test Postman

Ce guide explique comment tester les différents endpoints de l'API avec Postman.

**Base URL** : `http://localhost:5000`

---

## 1. Ordres de Fabrication (`/api/orders`)

### Récupérer tous les ordres
- **Méthode** : `GET`
- **URL** : `http://localhost:5000/api/orders`

### Ajouter un nouvel ordre
- **Méthode** : `POST`
- **URL** : `http://localhost:5000/api/orders`
- **Headers** : `Content-Type: application/json`
- **Body (JSON)** :
```json
{
  "reference": "OF-2026-001",
  "statut": "en_attente",
  "quantitePrevue": 1000,
  "typeCable": "Câble Industriel A"
}
```

### Statistiques des ordres
- **Méthode** : `GET`
- **URL** : `http://localhost:5000/api/orders/stats/summary`

---

## 2. Inspections (`/api/inspections`)

### Liste des inspections
- **Méthode** : `GET`
- **URL** : `http://localhost:5000/api/inspections`

### Créer une inspection
- **Méthode** : `POST`
- **URL** : `http://localhost:5000/api/inspections`
- **Body (JSON)** :
```json
{
  "cableId": "cable123",
  "technicienId": "user123",
  "ordreFabricationId": "ordre123",
  "statut": "en_cours"
}
```

---

## 3. Anomalies (`/api/anomalies`)

### Liste des anomalies
- **Méthode** : `GET`
- **URL** : `http://localhost:5000/api/anomalies`

### Statistiques des anomalies
- **Méthode** : `GET`
- **URL** : `http://localhost:5000/api/anomalies/stats/summary`

---

## 4. Rapports (`/api/reports`)

### Déclencher la génération
- **Méthode** : `POST`
- **URL** : `http://localhost:5000/api/reports/generate`
- **Body (JSON)** :
```json
{
  "inspectionId": "votre_id_inspection"
}
```

---

## 5. Utilisateurs (`/api/users`)

### Liste des utilisateurs
- **Méthode** : `GET`
- **URL** : `http://localhost:5000/api/users`
