const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ShadingType, TableLayoutType, VerticalAlign, BorderStyle } = require('docx');
const fs = require('fs');

// Configuration des styles et couleurs
const BLUE = '1a365d';
const BLUE_LIGHT = '2b6cb0';
const GRAY_SOFT = '718096';
const GRAY_BG = 'f7fafc';
const WHITE = 'ffffff';
const BLACK = '000000';

const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 1, color: BLUE };

// --- HELPERS DE MISE EN PAGE ---

function heading(text, level = HeadingLevel.HEADING_1) {
    return new Paragraph({
        heading: level,
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ text, bold: true, color: BLUE })]
    });
}

function para(text, opts = {}) {
    return new Paragraph({
        spacing: { after: 150 },
        alignment: opts.align || AlignmentType.JUSTIFIED,
        children: [new TextRun({ text, size: 22, color: opts.color || BLACK, ...opts })]
    });
}

function bullet(text, level = 0) {
    return new Paragraph({
        bullet: { level },
        spacing: { after: 80 },
        children: [new TextRun({ text, size: 22 })]
    });
}

function cell(text, opts = {}) {
    return new TableCell({
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [new Paragraph({
            alignment: opts.align || AlignmentType.LEFT,
            children: [new TextRun({ text, size: 20, bold: opts.bold || false, color: opts.color || BLACK })]
        })],
    });
}

function row(texts, widths, isHeader = false) {
    return new TableRow({
        tableHeader: isHeader,
        children: texts.map((t, i) => cell(t, {
            bold: isHeader,
            shading: isHeader ? BLUE : undefined,
            color: isHeader ? WHITE : undefined,
            width: widths ? widths[i] : undefined
        })),
    });
}

function styledTable(headers, rows, widths) {
    const tRows = headers ? [row(headers, widths, true)] : [];
    rows.forEach(r => tRows.push(row(r, widths)));
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tRows,
        spacing: { after: 200 }
    });
}

// --- CONSTRUCTION DU DOCUMENT ---

const doc = new Document({
    sections: [{
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
        children: [
            // PAGE DE GARDE PROFESSIONNELLE
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000, after: 100 }, children: [new TextRun({ text: 'CAHIER DES CHARGES', size: 48, bold: true, color: BLUE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'FONCTIONNEL ET TECHNIQUE', size: 36, bold: true, color: BLUE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1000 }, children: [new TextRun({ text: 'Projet de Fin d\'Études (Version Exhaustive)', size: 24, italics: true, color: GRAY_SOFT })] }),

            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'Système Intelligent de Contrôle Qualité\nPost-Fabrication des Câbles Industriels', size: 32, bold: true, color: BLUE_LIGHT })] }),

            new Paragraph({ spacing: { before: 800 } }),
            styledTable(null, [
                ['Sujet', 'Système Intelligent de Contrôle Qualité Industrielle'],
                ['Entreprise d\'accueil', 'ICEM'],
                ['Réalisé par', 'Maram Laouini & Riheme Mhemdi'],
                ['Spécialité', 'Développement des Systèmes d\'Information'],
                ['Année Universitaire', '2025 / 2026'],
                ['Date de Révision', '17 Février 2026'],
            ], [40, 60]),

            new Paragraph({ pageBreakBefore: true }),

            // SECTION 1
            heading('1. Introduction Générale'),
            para('Dans le secteur industriel hautement compétitif, la qualité des produits finis est un impératif stratégique. L\'entreprise ICEM, leader dans la fabrication de câbles industriels, accorde une importance capitale à la phase de contrôle post-fabrication.'),
            para('Ce projet vise à automatiser ce contrôle via des technologies d\'Intelligence Artificielle et une architecture Cloud moderne, s\'inscrivant dans la démarche Industrie 4.0.'),

            // SECTION 2
            heading('2. Analyse du Contexte'),
            para('Le contrôle qualité chez ICEM est actuellement manuel, ce qui limite la performance industrielle par :', { bold: true }),
            bullet('Une subjectivité inhérente à l\'interprétation humaine des défauts.'),
            bullet('Une fatigue cognitive impactant la fiabilité après plusieurs heures.'),
            bullet('Une absence de centralisation numérique instantanée pour les audits.'),
            para('La solution proposée remplace les supports papier par un écosystème numérique intelligent (Web & Mobile) capable de détecter les anomalies avec une précision constante.'),

            // SECTION 3
            heading('3. Méthodologie Rational Unified Process (RUP)'),
            para('Le projet adopte RUP pour sa structure itérative et incrémentale, idéale pour la gestion des risques liés à l\'IA :'),
            bullet('Inception : Analyse des besoins ICEM et faisabilité algorithmique.'),
            bullet('Élaboration : Conception de l\'architecture 3-tiers et du pipeline IA.'),
            bullet('Construction : Développement Backend/Mobile/Web et entraînement de YOLOv8.'),
            bullet('Transition : Déploiement industriel et formation des techniciens.'),

            // SECTION 4
            heading('4. Analyse des Acteurs'),
            styledTable(['Acteur', 'Rôles & Responsabilités', 'Plateforme'], [
                ['Technicien Qualité', 'Exécution des contrôles, capture d\'images assistée par IA, checklists.', 'Mobile'],
                ['Responsable Qualité', 'Supervision, validation des non-conformités, dashboard.', 'Web'],
                ['Administrateur', 'Gestion des comptes, des modèles IA et configuration système.', 'Web'],
                ['Direction', 'Pilotage stratégique via rapports de synthèse et statistiques.', 'Web'],
            ], [20, 60, 20]),

            // SECTION 5
            heading('5. Description Fonctionnelle Exhaustive'),
            para('Le système est découpé en 17 Cas d\'Utilisation (UC) pour couvrir tous les besoins métier d\'ICEM.', { bold: true }),

            heading('5.1 Menu Application Mobile (Opérations Terrain)', HeadingLevel.HEADING_2),
            styledTable(['Code', 'Cas d\'Utilisation', 'Priorité'], [
                ['UC1', 'Authentification sécurisée (Firebase Auth)', 'Critique'],
                ['UC2', 'Sélection des Ordres de Fabrication (OF)', 'Haute'],
                ['UC3', 'Capture avec Guidage IA Intelligent', 'Haute'],
                ['UC4', 'Analyse IA automatique (Inférence YOLOv8)', 'Critique'],
                ['UC5', 'Classification & Gravité des Anomalies', 'Critique'],
                ['UC6', 'Checklists (Visuelle & Électrique)', 'Moyenne'],
                ['UC7', 'Génération automatique de rapport local (PDF)', 'Haute'],
                ['UC8', 'Synchronisation en mode hors-ligne', 'Moyenne'],
            ], [15, 65, 20]),

            heading('5.2 Menu Application Web (Gestion & Supervision)', HeadingLevel.HEADING_2),
            styledTable(['Code', 'Cas d\'Utilisation', 'Priorité'], [
                ['UC9', 'Dashboard Decisionnel (KPIs temps réel)', 'Critique'],
                ['UC10', 'Gestion industrielle des OF (Création/Planif)', 'Haute'],
                ['UC11', 'Validation & Revue managériale des défauts', 'Haute'],
                ['UC12', 'Génération de Syntheses Qualité PDF/Excel', 'Moyenne'],
                ['UC14', 'Administration du Personnel (RBAC)', 'Moyenne'],
                ['UC16', 'Monitoring des performances du Modèle IA', 'Faible'],
                ['UC17', 'Statistiques de Pilotage Direction', 'Moyenne'],
            ], [15, 65, 20]),

            new Paragraph({ pageBreakBefore: true }),

            // SECTION 6
            heading('6. Spécifications Techniques : Pipeline IA'),
            para('L\'Intelligence Artificielle est au cœur du dispositif ICEM.', { bold: true }),
            bullet('Modèle : YOLOv8 (You Only Look Once version 8) pour sa rapidité.'),
            bullet('Prétraitement : Redimensionnement automatique 640x640 et normalisation.'),
            bullet('Augmentation : Rotation, bruit et flou pour renforcer la robustesse.'),
            bullet('Seuil de Confiance : Paramétrable par l\'administrateur (Défault 0.45).'),

            // SECTION 7
            heading('7. Architecture Globale du Système'),
            para('Architecture distribuée 3-tiers :'),
            bullet('Cote Client : Flutter (Android/iOS) et React.js (Navigateurs).'),
            bullet('Cote Serveur : Node.js (API REST) et FastAPI (Service Inférence IA).'),
            bullet('Infrastructure : Firebase (Firestore DB, storage pour images HD).'),

            // MATRICE DE TRAÇABILITÉ
            heading('8. Matrice de Traçabilité'),
            styledTable(['Exigence Métier', 'Cas d\'Utilisation Associés', 'Composant Technique'], [
                ['Détection IA', 'UC4, UC5, UC11', 'FastAPI / YOLOv8'],
                ['Traçabilité OF', 'UC2, UC10', 'Express / Firestore'],
                ['Reporting PDF', 'UC7, UC12', 'Express (PDF-LIB)'],
                ['Sécurité RBAC', 'UC1, UC14', 'Firebase Auth'],
            ], [25, 45, 30]),

            // RISQUES
            heading('9. Gestion des Risques Industriels'),
            styledTable(['Risque', 'Gravité', 'Stratégie de Mitigation'], [
                ['Précision insuffisante', 'Haute', 'Entraînement assisté (Fine-tuning).'],
                ['Instabilité réseau', 'Moyenne', 'Mode Offline / Sync Firestore.'],
                ['Adoption utilisateurs', 'Moyenne', 'Interfaces UX simplifiées.'],
            ], [30, 20, 50]),

            // CONCLUSION
            heading('10. Conclusion'),
            para('Ce cahier des charges établit une feuille de route rigoureuse pour la mise en œuvre du système intelligent ICEM. En fusionnant l\'IA et le Cloud, ICEM s\'impose comme un pionnier de la qualité automatisée dans la fabrication de câbles industriels.'),

            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1000 }, children: [new TextRun({ text: '— Fin du Document Officiel de PFE —', italics: true, color: BLUE_LIGHT, size: 24 })] }),
        ],
    }],
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('CAHIER_DES_CHARGES_FINAL_PFE.docx', buffer);
    console.log('✅ Word Ultra-Détaillé généré : CAHIER_DES_CHARGES_FINAL_PFE.docx');
});
