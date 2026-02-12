# Conception et Développement d'un Système Intelligent de Contrôle Qualité Post-Fabrication des Câbles Industriels

**Projet de Fin d'Études - Développement des Systèmes d'Information**

**Réalisé par :** Maram Laouini & Riheme Mhemdi  
**Entreprise :** ICEM  
**Date :** Février 2026

---

## Table des Matières

1. [Contexte du Projet](#1-contexte-du-projet)
2. [Objectifs du Projet](#2-objectifs-du-projet)
3. [Acteurs du Système](#3-acteurs-du-système)
4. [Architecture Générale](#4-architecture-générale)
5. [Cas d'Utilisation - Application Mobile](#5-cas-dutilisation-application-mobile)
6. [Cas d'Utilisation - Application Web](#6-cas-dutilisation-application-web)
7. [Matrice de Traçabilité](#7-matrice-de-traçabilité)
8. [Technologies Utilisées](#8-technologies-utilisées)
9. [Pipeline Intelligence Artificielle](#9-pipeline-intelligence-artificielle)
10. [Exigences Fonctionnelles et Non Fonctionnelles](#10-exigences)

---

## 1. Contexte du Projet

Dans le cadre du Projet de Fin d'Études en Développement des Systèmes d'Information, ce projet est réalisé au sein de l'entreprise **ICEM**, spécialisée dans la fabrication de câbles industriels. Le contrôle qualité post-fabrication représente une étape critique afin de garantir la conformité des produits aux exigences techniques et normatives.

### Problématique

Les méthodes actuelles de contrôle reposent essentiellement sur des inspections manuelles, ce qui entraîne :
- ❌ Risques d'erreurs humaines
- ❌ Absence de traçabilité numérique
- ❌ Faible exploitation des données collectées
- ❌ Processus lent et coûteux

### Solution Proposée

L'intégration de technologies de **vision artificielle**, **intelligence artificielle** et **applications numériques** (web et mobile) permet d'automatiser, fiabiliser et optimiser ce processus.

---

## 2. Objectifs du Projet

### 2.1 Objectif Général

Concevoir et développer un **système intelligent de contrôle qualité automatisé**, basé sur l'analyse d'images par intelligence artificielle, intégré à une application web de supervision et une application mobile de gestion opérationnelle.

### 2.2 Objectifs Spécifiques

✅ Automatiser l'inspection visuelle des câbles par IA  
✅ Gérer les ordres de fabrication  
✅ Détecter et classifier les anomalies  
✅ Générer automatiquement des rapports qualité  
✅ Centraliser et analyser les données de contrôle  
✅ Fournir des tableaux de bord décisionnels  

---

## 3. Acteurs du Système

### 3.1 Acteurs Humains

| Acteur | Rôle | Interface Principale |
|--------|------|---------------------|
| **Technicien Qualité** | Exécute les contrôles qualité sur les câbles, utilise la caméra pour l'inspection, gère les anomalies détectées | Application Mobile |
| **Responsable Qualité** | Supervise les opérations de contrôle qualité, analyse les indicateurs, prend les décisions stratégiques | Application Web |
| **Administrateur Système** | Gère les utilisateurs, configure les paramètres du système, administre les modèles IA | Application Web |
| **Direction** | Consulte les rapports globaux, les statistiques et les tableaux de bord décisionnels | Application Web |

### 3.2 Acteurs Système

| Acteur | Description |
|--------|-------------|
| **Système IA** | Acteur automatisé qui effectue l'analyse des images, la détection des anomalies et la vérification de conformité |
| **Système de Notification** | Envoie des alertes en cas de non-conformité |

---

## 4. Architecture Générale

Le système repose sur une **architecture client-serveur distribuée** :

```
┌─────────────────────────────────────────────────────────┐
│                    COUCHE CLIENT                        │
├─────────────────────────────────────────────────────────┤
│  Application Mobile (Flutter)  │  Application Web       │
│  - Technicien Qualité          │  (React.js)            │
│  - Capture d'images            │  - Dashboard           │
│  - IA embarquée (YOLOv8)       │  - Reporting           │
│  - Inspection terrain          │  - Administration      │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│                  COUCHE BACKEND                         │
├─────────────────────────────────────────────────────────┤
│              Backend API (Node.js)                      │
│              API REST + WebSocket                        │
│              Authentification Firebase                   │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│                  COUCHE SERVICES                        │
├─────────────────────────────────────────────────────────┤
│  Service IA (Python/FastAPI)  │  Firebase Services     │
│  - Modèle YOLOv8               │  - Firestore DB        │
│  - Modèle de guidage           │  - Cloud Storage       │
│  - Vérification conformité     │  - Authentication      │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Cas d'Utilisation - Application Mobile

### Vue d'Ensemble des Cas d'Utilisation Mobile

| ID | Cas d'Utilisation | Acteur Principal | Priorité |
|----|-------------------|------------------|----------|
| UC1 | Authentification | Technicien Qualité | Haute |
| UC2 | Gérer Ordres de Fabrication | Technicien Qualité | Haute |
| UC3 | Capturer Image du Câble | Technicien Qualité | Haute |
| UC4 | Analyser Image par IA | Système IA | Haute |
| UC5 | Détecter Anomalies | Système IA | Haute |
| UC6 | Gérer Checklists (Visuelle/Électrique) | Technicien Qualité | Moyenne |
| UC7 | Générer Rapport d'Inspection | Système | Haute |
| UC8 | Synchroniser Données | Système | Haute |

---

### UC1 - Authentification

**Acteur principal :** Technicien Qualité  
**Objectif :** Se connecter de manière sécurisée à l'application mobile

**Préconditions :**
- L'utilisateur possède des identifiants valides
- L'application est installée sur un appareil mobile

**Scénario principal :**
1. Le technicien lance l'application mobile
2. Le système affiche l'écran de connexion
3. Le technicien saisit son identifiant et mot de passe
4. Le système vérifie les credentials via Firebase Authentication
5. Le système charge le profil et les autorisations de l'utilisateur
6. Le système affiche l'écran d'accueil avec la liste des ordres de fabrication

**Scénarios alternatifs :**
- **3a.** Identifiants incorrects
  - Le système affiche un message d'erreur
  - Retour à l'étape 3
- **4a.** Pas de connexion internet
  - Le système affiche un message d'erreur de connexion
  - Fin du cas d'utilisation

**Postconditions :**
- L'utilisateur est authentifié
- La session est créée
- Les données sont synchronisées

---

### UC2 - Gérer les Ordres de Fabrication

**Acteur principal :** Technicien Qualité  
**Objectif :** Consulter et sélectionner un ordre de fabrication pour le contrôle qualité

**Préconditions :**
- Le technicien est authentifié
- Des ordres de fabrication existent dans le système

**Scénario principal :**
1. Le système affiche la liste des ordres de fabrication actifs
2. Le technicien sélectionne un ordre de fabrication
3. Le système affiche les détails de l'ordre (référence, type de câble, quantité, etc.)
4. Le technicien sélectionne un câble spécifique à inspecter
5. Le technicien saisit la référence et le code du câble
6. Le système valide les informations
7. Le système active l'interface de capture d'images

**Scénarios alternatifs :**
- **5a.** Référence invalide
  - Le système affiche un message d'erreur
  - Retour à l'étape 5
- **6a.** Code déjà inspecté
  - Le système affiche l'historique de l'inspection précédente
  - Le technicien peut choisir de réinspecter ou annuler

**Postconditions :**
- Un câble est sélectionné pour inspection
- Les informations sont enregistrées

---

### UC3 - Capturer Image du Câble

**Acteur principal :** Technicien Qualité  
**Acteur secondaire :** Système IA (modèle de guidage)

**Objectif :** Capturer des images de qualité du câble pour l'analyse IA

**Préconditions :**
- Un câble est sélectionné pour inspection
- La caméra du mobile fonctionne correctement

**Scénario principal :**
1. Le technicien active la fonction de capture d'image
2. Le système active la caméra et le modèle de guidage intelligent
3. Le système affiche un cadre de positionnement avec des repères visuels
4. Le modèle IA de guidage analyse le flux vidéo en temps réel
5. Le système guide le technicien pour positionner correctement le câble
6. Lorsque le positionnement est optimal, le système indique la validation
7. Le technicien déclenche la capture (ou capture automatique)
8. Le système capture plusieurs images sous différents angles
9. Le système vérifie la qualité des images (netteté, luminosité)
10. Le système enregistre les images localement
11. Le système passe automatiquement à l'analyse IA

**Scénarios alternatifs :**
- **9a.** Image de mauvaise qualité
  - Le système demande une nouvelle capture
  - Retour à l'étape 7
- **8a.** Problème de stockage
  - Le système affiche un message d'erreur
  - Fin du cas d'utilisation

**Postconditions :**
- Des images de qualité sont capturées
- Les images sont prêtes pour l'analyse IA

---

### UC4 - Analyser Image par IA

**Acteur principal :** Système IA  
**Objectif :** Analyser les images capturées pour détecter les anomalies

**Préconditions :**
- Des images de qualité sont disponibles
- Le modèle YOLOv8 est chargé en mémoire

**Scénario principal :**
1. Le système charge les images capturées
2. Le système applique les prétraitements nécessaires
3. Le modèle YOLOv8 effectue l'inférence sur chaque image
4. Le système détecte et localise les anomalies potentielles
5. Le système classe les anomalies par type et gravité
6. Le système calcule un score de confiance pour chaque détection
7. Le système génère un rapport d'analyse avec les bounding boxes
8. Le système affiche les résultats à l'utilisateur

**Scénarios alternatifs :**
- **3a.** Erreur d'inférence
  - Le système affiche un message d'erreur
  - Proposition de réessayer ou annuler
- **4a.** Aucune anomalie détectée
  - Le système marque le câble comme conforme
  - Passage au cas d'utilisation UC7

**Postconditions :**
- Les anomalies sont détectées et classifiées
- Un rapport d'analyse est généré

---

### UC5 - Détecter Anomalies

**Acteur principal :** Système IA  
**Acteur secondaire :** Technicien Qualité

**Objectif :** Identifier, classifier et alerter sur les anomalies détectées

**Préconditions :**
- L'analyse IA est terminée
- Des résultats sont disponibles

**Scénario principal :**
1. Le système extrait les anomalies du rapport d'analyse
2. Pour chaque anomalie, le système détermine :
   - Type (rayure, déformation, défaut de surface, etc.)
   - Gravité (mineur, majeur, critique)
   - Localisation précise
   - Score de confiance
3. Le système vérifie les seuils de conformité
4. Si des anomalies critiques sont détectées, le système génère une alerte
5. Le système affiche les anomalies avec marqueurs visuels sur les images
6. Le technicien visualise les anomalies détectées
7. Le système propose de lancer les checklists de vérification

**Scénarios alternatifs :**
- **3a.** Câble non conforme (anomalies critiques)
  - Le système marque le câble comme NON CONFORME
  - Génération automatique d'une alerte
  - Notification au responsable qualité
- **3b.** Câble conforme (pas d'anomalie ou anomalies mineures acceptables)
  - Le système marque le câble comme CONFORME
  - Passage direct au rapport d'inspection

**Postconditions :**
- Les anomalies sont enregistrées
- Un statut de conformité est attribué
- Des alertes sont générées si nécessaire

---

### UC6 - Gérer Checklists (Visuelle/Électrique)

**Acteur principal :** Technicien Qualité  
**Objectif :** Effectuer des vérifications complémentaires visuelles et électriques

**Préconditions :**
- Des anomalies ont été détectées ou une vérification manuelle est requise

**Scénario principal :**
1. Le système affiche le menu des checklists disponibles
2. Le technicien sélectionne le type de checklist (Visuelle ou Électrique)
3. Le système charge la checklist appropriée avec tous les points de contrôle
4. Pour chaque point de contrôle :
   - Le système affiche la description du contrôle
   - Le technicien effectue la vérification
   - Le technicien saisit le résultat (OK / NOK)
   - Si NOK, le technicien peut ajouter un commentaire et une photo
5. Le système calcule le taux de conformité
6. Le technicien valide la checklist complétée
7. Le système enregistre tous les résultats

**Checklist Visuelle inclut :**
- État de la gaine extérieure
- Qualité des marquages
- Aspect général du câble
- Absence de déformations
- Propreté

**Checklist Électrique inclut :**
- Continuité électrique
- Isolation
- Résistance
- Tests fonctionnels

**Scénarios alternatifs :**
- **4a.** Point de contrôle non applicable
  - Le technicien peut marquer comme N/A
- **6a.** Checklist incomplète
  - Le système affiche un avertissement
  - Le technicien peut sauvegarder en brouillon ou compléter

**Postconditions :**
- La checklist est complétée et enregistrée
- Les résultats sont associés au câble inspecté

---

### UC7 - Générer Rapport d'Inspection

**Acteur principal :** Système  
**Acteur secondaire :** Technicien Qualité

**Objectif :** Générer automatiquement un rapport complet de l'inspection

**Préconditions :**
- L'inspection est terminée (analyse IA + checklists si nécessaire)

**Scénario principal :**
1. Le système collecte toutes les données d'inspection :
   - Informations de l'ordre de fabrication
   - Référence et code du câble
   - Date et heure de l'inspection
   - Identité du technicien
   - Images capturées avec annotations
   - Résultats de l'analyse IA
   - Liste des anomalies détectées
   - Résultats des checklists
   - Statut de conformité final
2. Le système génère un rapport structuré au format PDF
3. Le système affiche un aperçu du rapport au technicien
4. Le technicien peut ajouter des observations complémentaires
5. Le technicien valide le rapport
6. Le système enregistre le rapport localement et dans Firebase
7. Le système affiche une confirmation

**Scénarios alternatifs :**
- **5a.** Le technicien refuse le rapport
  - Possibilité de modifier ou refaire l'inspection
- **6a.** Échec de synchronisation
  - Le rapport est sauvegardé localement
  - Synchronisation automatique ultérieure

**Postconditions :**
- Un rapport d'inspection complet est généré
- Le rapport est stocké et traçable
- Les données sont synchronisées avec le backend

---

### UC8 - Synchroniser Données

**Acteur principal :** Système  
**Objectif :** Synchroniser les données entre l'application mobile et le cloud

**Préconditions :**
- Des données locales nécessitent une synchronisation
- Une connexion internet est disponible

**Scénario principal :**
1. Le système détecte les données non synchronisées
2. Le système établit une connexion avec Firebase
3. Pour chaque élément à synchroniser :
   - Upload des images vers Cloud Storage
   - Enregistrement des données dans Firestore
   - Mise à jour de l'état des ordres de fabrication
   - Synchronisation des rapports
4. Le système met à jour le statut de synchronisation
5. Le système supprime les données locales temporaires
6. Le système affiche une notification de succès

**Scénarios alternatifs :**
- **2a.** Pas de connexion internet
  - Le système garde les données localement
  - Nouvelle tentative automatique plus tard
- **3a.** Erreur partielle de synchronisation
  - Le système identifie les éléments non synchronisés
  - Nouvelle tentative pour ces éléments uniquement

**Postconditions :**
- Les données sont synchronisées avec le cloud
- Les données locales temporaires sont nettoyées

---

## 6. Cas d'Utilisation - Application Web

### Vue d'Ensemble des Cas d'Utilisation Web

| ID | Cas d'Utilisation | Acteur Principal | Priorité |
|----|-------------------|------------------|----------|
| UC9 | Consulter Dashboard | Responsable Qualité, Direction | Haute |
| UC10 | Gérer Ordres de Fabrication Web | Responsable Qualité | Moyenne |
| UC11 | Analyser Anomalies | Responsable Qualité | Moyenne |
| UC12 | Générer Rapports Qualité | Responsable Qualité | Moyenne |
| UC13 | Exporter Données | Responsable Qualité | Basse |
| UC14 | Gérer Utilisateurs | Administrateur | Moyenne |
| UC15 | Configurer Système | Administrateur | Basse |
| UC16 | Gérer Modèles IA | Administrateur | Basse |
| UC17 | Consulter Statistiques | Direction | Basse |

---

### UC9 - Consulter Dashboard

**Acteur principal :** Responsable Qualité, Direction  
**Objectif :** Visualiser les indicateurs clés de performance qualité

**Préconditions :**
- L'utilisateur est authentifié
- Des données de contrôle sont disponibles

**Scénario principal :**
1. L'utilisateur accède au tableau de bord
2. Le système charge les dernières données
3. Le système affiche :
   - **KPI Qualité :**
     - Taux de conformité global
     - Nombre d'inspections réalisées
     - Nombre d'anomalies détectées
     - Taux de non-conformité par type de câble
   - **Graphiques et visualisations :**
     - Évolution de la conformité dans le temps
     - Répartition des anomalies par type
     - Performance par technicien
     - Tendances et analyses prédictives
   - **Alertes actives :** Anomalies critiques non traitées
   - **Statistiques temps réel :** Inspections en cours
4. L'utilisateur peut filtrer par période, type de câble, technicien
5. Le système met à jour les visualisations selon les filtres

**Scénarios alternatifs :**
- **2a.** Aucune donnée disponible
  - Le système affiche un message informatif

**Postconditions :**
- Les indicateurs sont consultés
- Les décisions peuvent être prises basées sur les données

---

### UC10 - Gérer Ordres de Fabrication (Web)

**Acteur principal :** Responsable Qualité  
**Objectif :** Créer, modifier et suivre les ordres de fabrication

**Scénario principal :**
1. L'utilisateur accède au module de gestion des ordres
2. Le système affiche la liste des ordres de fabrication avec leur statut
3. L'utilisateur peut :
   - **Créer un nouvel ordre :**
     - Saisir les informations (référence, type de câble, quantité, date de production)
     - Définir les critères de conformité
     - Assigner un technicien
   - **Modifier un ordre existant :**
     - Modifier les paramètres
     - Changer le statut
   - **Consulter les détails :**
     - Voir l'avancement
     - Consulter les câbles inspectés
     - Voir les statistiques de l'ordre
4. Le système enregistre les modifications
5. Le système synchronise avec l'application mobile

**Postconditions :**
- Les ordres de fabrication sont à jour
- Les données sont disponibles sur mobile

---

### UC11 - Analyser Anomalies

**Acteur principal :** Responsable Qualité  
**Objectif :** Analyser en détail les anomalies détectées

**Scénario principal :**
1. L'utilisateur accède au module d'analyse des anomalies
2. Le système affiche la liste complète des anomalies
3. L'utilisateur peut filtrer par :
   - Période
   - Type d'anomalie
   - Gravité
   - Câble/Ordre de fabrication
   - Technicien
4. L'utilisateur sélectionne une anomalie
5. Le système affiche les détails :
   - Images annotées avec bounding boxes
   - Type et gravité
   - Score de confiance IA
   - Contexte (ordre, câble, date)
   - Actions prises
   - Historique
6. L'utilisateur peut :
   - Valider ou invalider la détection
   - Ajouter des commentaires
   - Déclencher des actions correctives
   - Marquer comme résolu

**Postconditions :**
- Les anomalies sont analysées et traitées
- Un historique est conservé

---

### UC12 - Générer Rapports Qualité

**Acteur principal :** Responsable Qualité  
**Objectif :** Générer des rapports qualité personnalisés

**Scénario principal :**
1. L'utilisateur accède au module de reporting
2. L'utilisateur sélectionne le type de rapport :
   - Rapport d'inspection individuel
   - Rapport de conformité par période
   - Rapport d'anomalies
   - Rapport de performance
3. L'utilisateur configure les paramètres :
   - Période
   - Filtres (câbles, techniciens, types d'anomalies)
   - Niveau de détail
4. Le système génère le rapport avec :
   - Statistiques clés
   - Graphiques et visualisations
   - Liste détaillée des inspections
   - Images et preuves
   - Recommandations
5. L'utilisateur prévisualise le rapport
6. L'utilisateur valide et enregistre le rapport

**Postconditions :**
- Un rapport qualité est généré
- Le rapport est archivé

---

### UC13 - Exporter Données

**Acteur principal :** Responsable Qualité  
**Objectif :** Exporter les données et rapports dans différents formats

**Scénario principal :**
1. L'utilisateur sélectionne les données à exporter
2. L'utilisateur choisit le format :
   - PDF (pour rapports)
   - Excel (pour analyses)
   - CSV (pour données brutes)
3. L'utilisateur configure les options d'export
4. Le système génère le fichier d'export
5. Le système propose le téléchargement
6. L'utilisateur télécharge le fichier

**Postconditions :**
- Les données sont exportées
- Le fichier est disponible localement

---

### UC14 - Gérer Utilisateurs

**Acteur principal :** Administrateur  
**Objectif :** Gérer les comptes utilisateurs et leurs autorisations

**Scénario principal :**
1. L'administrateur accède au module de gestion des utilisateurs
2. Le système affiche la liste des utilisateurs
3. L'administrateur peut :
   - **Créer un nouvel utilisateur :**
     - Saisir les informations (nom, email, rôle)
     - Définir les autorisations
     - Générer les identifiants
   - **Modifier un utilisateur :**
     - Changer le rôle
     - Modifier les autorisations
     - Désactiver le compte
   - **Supprimer un utilisateur**
4. Le système enregistre les modifications
5. Le système synchronise avec Firebase Authentication

**Postconditions :**
- Les utilisateurs sont gérés
- Les autorisations sont à jour

---

### UC15 - Configurer Système

**Acteur principal :** Administrateur  
**Objectif :** Configurer les paramètres globaux du système

**Scénario principal :**
1. L'administrateur accède aux paramètres système
2. L'administrateur peut configurer :
   - Seuils de détection IA
   - Critères de conformité
   - Templates de checklists
   - Notifications et alertes
   - Paramètres de synchronisation
3. L'administrateur modifie les paramètres souhaités
4. Le système valide les configurations
5. L'administrateur enregistre les modifications
6. Le système applique les nouveaux paramètres

**Postconditions :**
- Le système est configuré selon les besoins
- Les paramètres sont appliqués

---

### UC16 - Gérer Modèles IA

**Acteur principal :** Administrateur  
**Objectif :** Gérer les modèles d'intelligence artificielle

**Scénario principal :**
1. L'administrateur accède au module de gestion des modèles IA
2. Le système affiche la liste des modèles :
   - Modèle de guidage
   - Modèle de détection (YOLOv8)
   - Modèle de vérification de conformité
3. Pour chaque modèle, l'administrateur peut voir :
   - Version
   - Performances (précision, rappel, F1-score)
   - Date de déploiement
   - Statut (actif/inactif)
4. L'administrateur peut :
   - Uploader un nouveau modèle
   - Activer/Désactiver un modèle
   - Configurer les paramètres d'inférence
   - Consulter les métriques de performance
5. Le système déploie les modifications

**Postconditions :**
- Les modèles IA sont à jour
- Les performances sont optimisées

---

### UC17 - Consulter Statistiques

**Acteur principal :** Direction  
**Objectif :** Consulter les statistiques globales et les rapports exécutifs

**Scénario principal :**
1. La direction accède aux statistiques globales
2. Le système affiche :
   - Indicateurs de performance globaux
   - Évolution de la qualité sur le long terme
   - ROI du système de contrôle qualité
   - Comparaisons et benchmarks
3. La direction peut exporter les rapports exécutifs
4. Le système génère des visualisations de haut niveau

**Postconditions :**
- Les statistiques sont consultées
- Les décisions stratégiques sont informées

---

## 7. Matrice de Traçabilité

### 7.1 Traçabilité Exigences ↔ Cas d'Utilisation

| Exigence Fonctionnelle | Cas d'Utilisation |
|------------------------|-------------------|
| Détection automatique des anomalies | UC4, UC5 |
| Gestion des ordres de fabrication | UC2, UC10 |
| Génération automatique de rapports | UC7, UC12 |
| Traçabilité complète | UC7, UC8, UC11 |
| Inspection visuelle par caméra | UC3 |
| Checklists de vérification | UC6 |
| Tableaux de bord décisionnels | UC9, UC17 |
| Export des données | UC13 |
| Gestion des utilisateurs et rôles | UC1, UC14 |
| Configuration du système | UC15 |
| Administration des modèles IA | UC16 |

### 7.2 Matrice Acteurs × Cas d'Utilisation

| Cas d'Utilisation | Technicien Qualité | Responsable Qualité | Administrateur | Direction | Système IA |
|-------------------|:------------------:|:-------------------:|:--------------:|:---------:|:----------:|
| UC1 - Authentification | ✅ | ✅ | ✅ | ✅ | - |
| UC2 - Gérer Ordres (Mobile) | ✅ | - | - | - | - |
| UC3 - Capturer Image | ✅ | - | - | - | 🔧 |
| UC4 - Analyser par IA | - | - | - | - | ✅ |
| UC5 - Détecter Anomalies | - | - | - | - | ✅ |
| UC6 - Gérer Checklists | ✅ | - | - | - | - |
| UC7 - Générer Rapport Inspection | ✅ | - | - | - | - |
| UC8 - Synchroniser Données | 🔧 | - | - | - | - |
| UC9 - Consulter Dashboard | - | ✅ | - | ✅ | - |
| UC10 - Gérer Ordres (Web) | - | ✅ | - | - | - |
| UC11 - Analyser Anomalies | - | ✅ | - | - | - |
| UC12 - Générer Rapports Qualité | - | ✅ | - | - | - |
| UC13 - Exporter Données | - | ✅ | - | - | - |
| UC14 - Gérer Utilisateurs | - | - | ✅ | - | - |
| UC15 - Configurer Système | - | - | ✅ | - | - |
| UC16 - Gérer Modèles IA | - | - | ✅ | - | - |
| UC17 - Consulter Statistiques | - | - | - | ✅ | - |

**Légende :**
- ✅ : Acteur principal (initie et interagit)
- 🔧 : Acteur secondaire ou système (support)

---

## 8. Technologies Utilisées

### 8.1 Application Mobile

| Technologie | Usage |
|-------------|-------|
| **Flutter** | Framework de développement multiplateforme |
| **Dart** | Langage de programmation |
| **Caméra Mobile** | Capture d'images |
| **TensorFlow Lite** | Inférence IA locale |

### 8.2 Application Web

| Technologie | Usage |
|-------------|-------|
| **React.js** | Framework frontend |
| **Chart.js / Recharts** | Visualisations et graphiques |
| **Material-UI** | Composants UI |

### 8.3 Backend

| Technologie | Usage |
|-------------|-------|
| **Node.js** | Runtime serveur |
| **Express.js** | Framework API REST |
| **Socket.io** | Communication temps réel |

### 8.4 Intelligence Artificielle

| Technologie | Usage |
|-------------|-------|
| **Python** | Langage principal IA |
| **PyTorch / TensorFlow** | Frameworks deep learning |
| **YOLOv8** | Modèle de détection d'objets |
| **OpenCV** | Traitement d'images |
| **FastAPI** | API service IA |

### 8.5 Base de Données & Cloud

| Technologie | Usage |
|-------------|-------|
| **Firebase Firestore** | Base de données NoSQL |
| **Firebase Cloud Storage** | Stockage d'images |
| **Firebase Authentication** | Authentification utilisateurs |
| **Firebase Cloud Functions** | Fonctions serverless |

---

## 9. Pipeline Intelligence Artificielle

### 9.1 Modèles IA

Le système utilise **trois modèles d'IA** spécialisés :

1. **Modèle de Guidage**
   - **Rôle :** Guider le technicien pour positionner correctement le câble
   - **Technologie :** Réseau de neurones convolutionnel (CNN)
   - **Input :** Flux vidéo temps réel
   - **Output :** Validation de position (OK/NOK)

2. **Modèle de Détection (YOLOv8)**
   - **Rôle :** Détecter et localiser les anomalies sur les câbles
   - **Technologie :** YOLOv8 (You Only Look Once version 8)
   - **Input :** Images capturées
   - **Output :** Bounding boxes + classes + scores de confiance

3. **Modèle de Vérification de Conformité**
   - **Rôle :** Classifier le câble comme conforme/non-conforme
   - **Technologie :** Réseau de classification
   - **Input :** Features extraites + résultats de détection
   - **Output :** Statut de conformité + probabilité

### 9.2 Pipeline de Traitement

```
1. Acquisition des Images
   └─> Caméra mobile avec guidage IA

2. Prétraitement
   └─> Normalisation, redimensionnement, augmentation

3. Inférence YOLOv8
   └─> Détection et localisation des anomalies

4. Post-traitement
   └─> Filtrage, regroupement, classification

5. Vérification de Conformité
   └─> Décision finale : CONFORME / NON CONFORME

6. Génération du Rapport
   └─> Visualisation + statistiques + recommandations
```

### 9.3 Entraînement des Modèles

**Dataset :**
- Images de câbles annotées (conformes et défectueux)
- Classes d'anomalies : rayures, déformations, défauts de surface, etc.
- Minimum 10 000 images par classe

**Processus d'entraînement :**
1. Collecte et annotation des données
2. Augmentation de données (rotation, zoom, flip, etc.)
3. Division : 70% train / 20% validation / 10% test
4. Entraînement avec YOLOv8
5. Optimisation des hyperparamètres
6. Validation des performances
7. Déploiement sur mobile (TensorFlow Lite)

**Métriques de performance :**
- **Précision (Precision)** : > 95%
- **Rappel (Recall)** : > 90%
- **F1-Score** : > 92%
- **mAP (mean Average Precision)** : > 0.85
- **Temps d'inférence** : < 500ms par image

---

## 10. Exigences

### 10.1 Exigences Fonctionnelles

| ID | Exigence | Priorité |
|----|----------|----------|
| EF1 | Le système doit détecter automatiquement les anomalies visuelles sur les câbles | Haute |
| EF2 | Le système doit gérer les ordres de fabrication (création, modification, suivi) | Haute |
| EF3 | Le système doit générer automatiquement des rapports d'inspection au format PDF | Haute |
| EF4 | Le système doit assurer la traçabilité complète de chaque inspection | Haute |
| EF5 | Le système doit permettre la capture d'images via caméra mobile avec guidage IA | Haute |
| EF6 | Le système doit supporter des checklists de vérification manuelles | Moyenne |
| EF7 | Le système doit fournir des tableaux de bord avec KPIs et visualisations | Moyenne |
| EF8 | Le système doit permettre l'export des données (PDF, Excel, CSV) | Basse |
| EF9 | Le système doit gérer les utilisateurs avec contrôle d'accès basé sur les rôles | Moyenne |
| EF10 | Le système doit permettre la configuration des paramètres système | Basse |
| EF11 | Le système doit permettre la gestion et le déploiement des modèles IA | Basse |

### 10.2 Exigences Non Fonctionnelles

| ID | Catégorie | Exigence | Critère de Succès |
|----|-----------|----------|-------------------|
| ENF1 | **Performance** | Temps d'inférence IA optimisé | < 500ms par image |
| ENF2 | **Performance** | Temps de chargement de l'application web | < 3 secondes |
| ENF3 | **Performance** | Synchronisation des données | < 5 secondes pour 10 images |
| ENF4 | **Sécurité** | Authentification sécurisée | Firebase Authentication avec hash bcrypt |
| ENF5 | **Sécurité** | Contrôle d'accès basé sur les rôles | RBAC avec 4 rôles distincts |
| ENF6 | **Sécurité** | Chiffrement des données sensibles | HTTPS + chiffrement au repos |
| ENF7 | **Fiabilité** | Disponibilité du système | 99.5% uptime |
| ENF8 | **Fiabilité** | Précision de détection IA | > 95% de précision |
| ENF9 | **Fiabilité** | Tolérance aux pannes | Mode hors ligne avec synchronisation automatique |
| ENF10 | **Scalabilité** | Support de nouveaux modèles IA | Architecture modulaire permettant l'ajout de modèles |
| ENF11 | **Scalabilité** | Support de multiples utilisateurs | Jusqu'à 100 utilisateurs simultanés |
| ENF12 | **Usabilité** | Interface intuitive | Formation utilisateur < 2 heures |
| ENF13 | **Usabilité** | Support multilingue | Français et Anglais |
| ENF14 | **Maintenance** | Documentation technique complète | Tous les modules documentés |
| ENF15 | **Compatibilité** | Support des navigateurs modernes | Chrome, Firefox, Edge (dernières versions) |
| ENF16 | **Compatibilité** | Support mobile | Android 8+ et iOS 12+ |

---

## 11. Flux Principaux du Système

### 11.1 Flux d'Inspection Complet (Mobile)

```
1. Authentification
   └─> Connexion sécurisée via Firebase

2. Sélection Ordre de Fabrication
   └─> Choix de l'ordre et du câble à inspecter

3. Saisie Référence Câble
   └─> Validation de la référence

4. Capture Image avec Guidage IA
   └─> Positionnement assisté + capture multi-angles

5. Analyse IA Automatique
   └─> Détection des anomalies par YOLOv8

6. Détection et Classification Anomalies
   └─> Identification type + gravité + score

7. [Si anomalies] Checklists Manuelles
   └─> Vérifications visuelles et électriques

8. Génération Rapport PDF
   └─> Rapport complet avec images annotées

9. Synchronisation Cloud
   └─> Upload vers Firebase

10. Notification
    └─> Alerte au responsable qualité si non-conforme
```

### 11.2 Flux de Supervision (Web)

```
1. Authentification
   └─> Connexion sécurisée

2. Consultation Dashboard
   └─> Vue d'ensemble KPIs et tendances

3. Analyse Anomalies
   └─> Examen détaillé des non-conformités

4. Prise de Décision
   └─> Actions correctives

5. Génération Rapport Qualité
   └─> Rapport périodique personnalisé

6. Export Données
   └─> Téléchargement PDF/Excel/CSV
```

### 11.3 Flux d'Administration

```
1. Authentification Administrateur
   └─> Accès privilégié

2. Gestion Utilisateurs / Configuration / Modèles IA
   └─> Administration du système

3. Validation et Déploiement
   └─> Application des modifications
```

---

## 12. Priorisation pour le Développement

### Phase 1 - MVP (Minimum Viable Product)

**Objectif :** Système fonctionnel de base

**Fonctionnalités :**
- ✅ UC1 - Authentification
- ✅ UC2 - Gérer Ordres Mobile
- ✅ UC3 - Capturer Images
- ✅ UC4 - Analyser par IA
- ✅ UC5 - Détecter Anomalies
- ✅ UC7 - Générer Rapport
- ✅ UC8 - Synchroniser Données
- ✅ UC9 - Dashboard Web

**Durée estimée :** 6-8 semaines

### Phase 2 - Fonctionnalités Avancées

**Objectif :** Enrichissement et optimisation

**Fonctionnalités :**
- ✅ UC6 - Checklists Manuelles
- ✅ UC10 - Gestion Ordres Web
- ✅ UC11 - Analyse Anomalies Web
- ✅ UC12 - Rapports Qualité Personnalisés
- ✅ UC14 - Gestion Utilisateurs

**Durée estimée :** 4-6 semaines

### Phase 3 - Administration et Export

**Objectif :** Complétion du système

**Fonctionnalités :**
- ✅ UC13 - Export Données
- ✅ UC15 - Configuration Système
- ✅ UC16 - Gestion Modèles IA
- ✅ UC17 - Statistiques Direction

**Durée estimée :** 3-4 semaines

---

## 13. Conclusion

Ce document de conception présente un système intelligent et complet de contrôle qualité post-fabrication pour les câbles industriels de l'entreprise ICEM.

### Points Clés

✅ **17 cas d'utilisation détaillés** couvrant toutes les fonctionnalités  
✅ **6 acteurs** (4 humains, 2 systèmes) avec rôles bien définis  
✅ **Architecture moderne** client-serveur avec IA embarquée  
✅ **Technologies de pointe** (Flutter, React.js, YOLOv8, Firebase)  
✅ **Traçabilité complète** de bout en bout  
✅ **Scalabilité** et évolutivité du système  

### Valeur Ajoutée

- **Automatisation** : Réduction de 80% du temps d'inspection
- **Fiabilité** : Détection précise à 95%+ des anomalies
- **Traçabilité** : Historique complet de chaque inspection
- **Décisionnel** : Tableaux de bord et analytics avancés
- **ROI** : Réduction des coûts et amélioration de la qualité

### Conformité Industrie 4.0

Ce projet s'inscrit pleinement dans la transformation numérique de l'industrie :
- IoT et vision artificielle
- Intelligence artificielle embarquée
- Cloud computing
- Analytics et Big Data
- Mobilité et connectivité

---

**Document réalisé dans le cadre du Projet de Fin d'Études**  
**ICEM - Février 2026**  
**Maram Laouini & Riheme Mhemdi**
