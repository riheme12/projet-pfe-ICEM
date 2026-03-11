# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE (VERSION EXHAUSTIVE)

## Projet de Fin d'Études — Système Intelligent de Contrôle Qualité

| Information | Détail |
|-------------|--------|
| **Sujet** | Conception et développement d'un système intelligent de contrôle qualité post-fabrication des câbles industriels |
| **Entreprise d'accueil** | ICEM |
| **Domaine** | Industrie 4.0 / Vision par Ordinateur / IA |
| **Spécialité** | Développement des Systèmes d'Information (DSI) |
| **Période** | Année universitaire 2025 / 2026 |
| **Réalisé par** | Maram Laouini & Riheme Mhemdi |
| **Tuteur Entreprise** | Responsable Qualité ICEM |
| **Date de mise à jour** | 17/02/2026 |

---

## 1. Introduction Générale

### 1.1 Contexte du projet
Dans le secteur industriel hautement compétitif, la qualité des produits finis est un impératif stratégique. L'entreprise **ICEM**, leader dans la fabrication de câbles industriels, accorde une importance capitale à la phase de contrôle post-fabrication. Traditionnellement, ce contrôle est manuel, mobilisant des techniciens pour inspecter visuellement chaque segment de câble afin de détecter des défauts de surface, des déformations ou des marquages erronés.

### 1.2 Problématique
Le processus actuel, bien que rigoureux, souffre de plusieurs lacunes inhérentes à la nature humaine et aux méthodes papier :
- **Subjectivité** : L'interprétation d'un défaut peut varier d'un technicien à l'autre.
- **Fatigue cognitive** : L'attention humaine baisse après plusieurs heures d'inspection répétitive.
- **Traçabilité fragmentée** : Les rapports papier sont difficiles à centraliser, à auditer et à analyser statistiquement.
- **Coût et Temps** : Le processus manuel ralentit la cadence de livraison globale.

### 1.3 Solution préconisée
Pour répondre à ces enjeux, le projet propose de basculer vers le paradigme de l'**Industrie 4.0** en digitalisant et automatisant l'inspection. La solution repose sur une architecture 3-tiers intégrant :
1. Une **Intelligence Artificielle (Deep Learning)** capable de simuler l'œil humain pour détecter les anomalies avec une précision constante.
2. Une **Application Mobile** dédiée aux techniciens pour l'exécution des contrôles en bord de ligne.
3. Une **Application Web** de supervision pour le management et l'analyse décisionnelle.

---

## 2. Objectifs du Projet

### 2.1 Objectif Général
Développer une solution écosystémique intelligente permettant d'automatiser la détection d'anomalies sur les câbles industriels et d'assurer une gestion numérique intégrale des ordres de fabrication et des rapports qualité.

### 2.2 Objectifs Spécifiques
- **Automatisation** : Analyse automatique d'image via le modèle **YOLOv8** pour identifier les défauts.
- **Guidage Intelligent** : Accompagner le technicien lors de la capture pour garantir des images exploitables par l'IA.
- **Traçabilité** : Archivage électronique de chaque inspection avec photos, horodatage et score de confiance.
- **Reporting** : Génération instantanée de rapports PDF conformes aux audits industriels.
- **Analytics** : Mise à jour en temps réel des tableaux de bord (KPIs) pour la direction.

---

## 3. Méthodologie : Rational Unified Process (RUP)

Contrairement aux méthodes agiles pures (Scrum), la méthodologie **RUP** est choisie pour sa structure rigoureuse, centrée sur l'architecture et les risques, ce qui est crucial pour un projet intégrant de l'IA expérimentale.

### 3.1 Phase d'Inception (Initialisation)
- **Activités** : Compréhension du métier ICEM, identification des types de câbles et de défauts, étude de faisabilité de YOLOv8 sur mobile.
- **Résultat** : Définition du périmètre et validation des cas d'utilisation critiques.

### 3.2 Phase d'Élaboration
- **Activités** : Conception de l'architecture logicielle (Express, Flutter, React), modélisation des données Firestore, et premier "pipeline" d'entraînement IA.
- **Résultat** : Architecture stable et réduction des risques techniques liés à l'IA.

### 3.3 Phase de Construction
- **Activités** : Développement itératif des modules mobile, web et backend. Intégration du service d'inférence.
- **Résultat** : Premier prototype (MVP) fonctionnel testable.

### 3.4 Phase de Transition
- **Activités** : Tests en usine, formation des techniciens, correction des bugs résiduels et déploiement final.
- **Résultat** : Système en exploitation réelle chez ICEM.

---

## 4. Analyse des Acteurs

### 4.1 Acteurs Humains
| Acteur | Rôle et Responsabilités | Plateforme |
|--------|--------------------------|------------|
| **Technicien Qualité** | Responsable de l'inspection physique. Il saisit l'OF, capture les images, valide les résultats IA et remplit les checklists manuelles. | App Mobile |
| **Responsable Qualité** | Supervise l'équipe de techniciens. Il analyse les tendances, gère les non-conformités bloquantes et valide les rapports finaux. | App Web |
| **Administrateur** | Gère les comptes utilisateurs, paramètre les seuils de gravité des anomalies et surveille l'état du système Cloud. | App Web |
| **Direction** | Consulte les statistiques de production et de qualité pour le pilotage stratégique de l'usine. | App Web |

### 4.2 Acteurs Système
- **Système IA (YOLOv8)** : Analyseur d'images qui extrait les coordonnées des défauts et leur type.
- **Moteur de Synchronisation** : Assure la persistence des données en mode hors-ligne sur mobile.

---

## 5. Description Fonctionnelle : Cas d'Utilisation (UC)

### 5.1 Liste exhaustive des Cas d'Utilisation
Le système est décomposé en **17 cas d'utilisation** garantissant une couverture fonctionnelle totale.

#### 5.1.1 Front-Office (Application Mobile)
- **UC1 : Authentification** (Accès sécurisé).
- **UC2 : Sélection Ordre de Fabrication** (Ciblage de la production).
- **UC3 : Capture avec Guidage IA** (Positionnement optimal).
- **UC4 : Inférence IA Automatique** (Détection en temps réel).
- **UC5 : Classification des Anomalies** (Évaluation type/gravité).
- **UC6 : Checklists Complémentaires** (Contrôles visuels/électriques).
- **UC7 : Génération de Rapport local** (Consultation immédiate).
- **UC8 : Synchronisation Cloud** (Envoi vers Firestore/Storage).

#### 5.1.2 Back-Office (Application Web)
- **UC9 : Dashboard de Pilotage** (KPIs et statistiques).
- **UC10 : Gestion des Ordres de Fabrication** (Plannification).
- **UC11 : Analyse et Validation des Anomalies** (Revue managériale).
- **UC12 : Rapports Qualité Groupés** (Génération PDF/Excel).
- **UC13 : Export de données brutes** (Audit externe).
- **UC14 : Gestion du personnel (Users)** (Administration RH).
- **UC15 : Configuration Système** (Seuils et alertes).
- **UC16 : Supervision des Modèles IA** (Monitoring précision).
- **UC17 : Rapports Stratégiques** (Vue Direction).

---

### 5.2 Scénarios Détaillés (Exemples majeurs)

#### UC3 - Capture d'Image avec Guidage Intelligent
- **Acteur :** Technicien Qualité + Système IA (Guidage).
- **Préconditions :** OF sélectionné, éclairage suffisant.
- **Scénario Nominal :**
  1. Le technicien active l'option "Inspection Caméra".
  2. Le système superpose un cadre d'assistance dynamique à l'écran.
  3. L'algorithme de guidage analyse la distance et l'angle du câble.
  4. Le système affiche "Position OK" en vert lorsque le câble est centré.
  5. La capture est déclenchée automatiquement.
- **Postcondition :** Image de haute qualité enregistrée.

#### UC4 - Analyse IA (Inférence)
- **Acteur :** Système IA (YOLOv8).
- **Scénario :**
  1. Le système reçoit l'image brute (taille 640x640).
  2. Le modèle YOLOv8 identifie les "Bounding Boxes" des défauts.
  3. Chaque détection est associée à une classe (Rayure, Bosselure, Déchirement).
  4. Le système renvoie la liste des anomalies avec un score de confiance (%).
- **Exception :** Si confiance < 30%, le système demande une nouvelle capture.

---

## 6. Architecture Technique et Stack Logicielle

Le système adopte une architecture **Backend-for-Frontend (BFF)** et une infrastructure **Cloud NoSQL**.

### 6.1 Architecture 3-Tiers
1. **Client Tier** :
   - Mobile : **Flutter** (Dart) - Performance native et interface réactive.
   - Web : **React.js** (JS) - Dashboard interactif et SPA.
2. **Logic Tier (API)** :
   - Backend : **Node.js** avec **Express** - Gestion des routes, authentification et logique métier.
   - Service IA : **FastAPI** (Python) - Serveur d'inférence haute performance.
3. **Data Tier (Cloud)** :
   - **Firebase Firestore** : Base de données temps réel.
   - **Firebase Authentication** : Sécurité des accès.
   - **Firebase Storage** : Stockage des preuves images (HA).

### 6.2 Pipeline IA (Focus Technique)
Le pipeline de détection d'objets (Object Detection) est configuré comme suit :
- **Algorithme** : YOLOv8 (Ultralytics).
- **Pré-traitement** : Normalisation des pixels, redimensionnement et augmentation de données (flou, rotation, bruit).
- **Post-traitement** : NMS (Non-Maximum Suppression) pour éviter les détections multiples du même défaut.
- **Déploiement** : Inférence via API FastAPI pour le web, et **TFLite** pour le mobile.

---

## 7. Modèle de Données (Collections Firestore)

La structure des données est synchronisée entre tous les services :

- **`users`** : Stocke les informations des employés et leurs statistiques.
- **`orders`** (ManufacturingOrder) : Référence les lots de production, quantités et taux de conformité.
- **`cables`** : Détail chaque unité inspectée, son statut et ses liens vers les images.
- **`anomalies`** : Liste atomique de chaque défaut (type, sévérité, coordonnées).
- **`reports`** : Métadonnées sur les documents PDF générés.

---

## 8. Exigences du Système

### 8.1 Exigences Fonctionnelles (Extraits critiques)
- **EF1** : Le système doit être capable de détecter au moins 5 types de défauts majeurs.
- **EF2** : Les ordres de fabrication doivent être mis à jour instantanément sur mobile après création web.
- **EF3** : Le technicien doit pouvoir invalider manuellement une détection IA s'il juge que c'est un faux positif.

### 8.2 Exigences Non Fonctionnelles
- **Performance** : L'analyse d'une image doit prendre moins de **2 secondes**.
- **Sécurité** : Chiffrement SSL/TLS pour tous les échanges.
- **Disponibilité** : Le mode hors-ligne doit permettre de stocker jusqu'à 50 inspections en cache local.
- **Précision** : Le modèle doit atteindre un **mAP (mean Average Precision)** de 0.85 minimum.

---

## 9. Matrice de Traçabilité

| Exigence | Cas d'Utilisation Associés | Code Module |
|----------|----------------------------|-------------|
| Détection IA | UC4, UC5, UC11 | `service-ia/` |
| Traçabilité OF | UC2, UC10 | `backend/routes/orders.js` |
| Reporting PDF | UC7, UC12, UC13 | `backend/utils/pdf-gen.js` |
| Sécurité RBAC | UC1, UC14, UC15 | `backend/middleware/auth.js` |

---

## 10. Gestion des Risques

| Risque | Gravité | Mitigation |
|--------|---------|------------|
| **Précision IA insuffisante** | Haute | Entraînement continu (Active Learning) sur les cas marginaux. |
| **Instabilité Réseau (Désert numérique)** | Moyenne | Mise en place de `LocalStore` et synchronisation asynchrone. |
| **Faible adoption par les ouvriers** | Moyenne | Interface simplifiée (UI/UX) et formation sur site. |
| **Consommation batterie excessive** | Faible | Optimisation des modèles TFLite et gestion intelligente de la caméra. |

---

## 11. Conclusion

Le système intelligent de contrôle qualité ICEM représente une avancée majeure vers la digitalisation complète de l'usine. En remplaçant l'inspection manuelle par une solution assistée par IA, ICEM garantit non seulement la conformité de ses câbles aux normes internationales, mais se dote également d'un outil de pilotage puissant pour améliorer sa productivité globale. Ce projet démontre l'efficacité de la synergie entre le Deep Learning, les technologies mobiles et les infrastructures Cloud sécurisées.

---
*Ce document de Cahier des Charges constitue le référentiel unique pour la réalisation et la validation du PFE.*
