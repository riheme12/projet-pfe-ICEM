const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ShadingType, VerticalAlign, BorderStyle, ImageRun } = require('docx');
const fs = require('fs');
const path = require('path');

// Configuration des styles et couleurs (Thème Bleu ICEM)
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
        spacing: { before: 300, after: 150 },
        children: [new TextRun({ text, bold: true, color: BLUE })]
    });
}

function para(text, opts = {}) {
    return new Paragraph({
        spacing: { after: 120 },
        alignment: opts.align || AlignmentType.JUSTIFIED,
        children: [new TextRun({ text, size: 22, color: opts.color || BLACK, ...opts })]
    });
}

function noteBox(title, text) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        spacing: { after: 150 },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        shading: { type: ShadingType.SOLID, color: 'ebf8ff' },
                        margins: { top: 150, bottom: 150, left: 150, right: 150 },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `${title} : `, bold: true, color: BLUE_LIGHT, size: 20 }),
                                    new TextRun({ text, italic: true, color: BLACK, size: 20 })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
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
            children: [new TextRun({ text, size: 18, bold: opts.bold || false, color: opts.color || BLACK })]
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
            width: widths ? widths[i] : undefined,
            align: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
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

// Fonction pour insérer une image si elle existe
function tryAddImage(imageName, docPath) {
    const imgPath = path.join(docPath, 'images', imageName);
    if (fs.existsSync(imgPath)) {
        try {
            return new Paragraph({
                spacing: { before: 100, after: 200 },
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: fs.readFileSync(imgPath),
                        transformation: {
                            width: 320,
                            height: 240,
                        },
                    })
                ]
            });
        } catch (e) {
            console.error(`Erreur d'intégration de l'image ${imageName}:`, e.message);
        }
    }
    return para(`[Image manquante ou invalide : ${imageName}]`, { color: GRAY_SOFT, italic: true });
}

// --- CONSTRUCTION DU DOCUMENT ---

const docsDir = __dirname;

const doc = new Document({
    sections: [{
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
        children: [
            // PAGE DE GARDE
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1500, after: 100 }, children: [new TextRun({ text: 'SPÉCIFICATIONS TECHNIQUES', size: 40, bold: true, color: BLUE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'FABRICATION D\'UN CÂBLE DE TEST AVEC ANOMALIES', size: 28, bold: true, color: BLUE_LIGHT })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 }, children: [new TextRun({ text: 'Projet de Fin d\'Études — Système Intelligent de Contrôle Qualité', size: 20, italics: true, color: GRAY_SOFT })] }),

            new Paragraph({ spacing: { before: 500 } }),
            styledTable(null, [
                ['Destinataire', 'Encadrant de l\'entreprise ICEM / Responsable Production'],
                ['Auteurs', 'Maram Laouini & Riheme Mhemdi'],
                ['Projet PFE', 'Contrôle qualité automatique par Vision IA (YOLOv11 & Roboflow)'],
                ['Objectif', 'Validation en direct (Live Demo) devant le jury de soutenance'],
                ['Date', '26 mai 2026'],
            ], [40, 60]),

            new Paragraph({ pageBreakBefore: true }),

            // INTRODUCTION
            heading('1. Contexte et Objectif'),
            para('Dans le cadre du déploiement de notre modèle d\'intelligence artificielle de détection d\'anomalies (YOLOv11 entraîné via Roboflow), nous devons effectuer une démonstration en direct (Live Demo) devant les membres du jury de soutenance.'),
            para('Afin de valider la détection en temps réel sur l\'application mobile des techniciens et le tableau de bord web de supervision, nous sollicitons la fabrication d\'un câble prototype (Golden Cable) comportant volontairement les anomalies et défauts listés dans ce document. Ce câble doit être représentatif des pièces produites au sein de l\'usine ICEM.'),

            noteBox('REMARQUE IMPORTANTE', 'Ce câble de test physique constituera la preuve concrète du bon fonctionnement de notre solution devant la jury de soutenance.'),

            // TABLEAU
            heading('2. Tableau Récapitulatif des Défauts'),
            styledTable(
                ['N°', 'Composant', 'Défaut physique', 'Classe Roboflow', 'Code', 'Sévérité'],
                [
                    ['1', 'Terminal / Broche', 'Composant mal inséré (semi-verrouillé)', 'composant_mal_insere', 'P', 'Critique'],
                    ['2', 'Connecteur', 'Cavité vide (fil manquant dans le boîtier)', 'composant_manquant', 'P', 'Critique'],
                    ['3', 'Connecteur', 'Boîtier plastique fissuré ou clip cassé', 'connecteur_anomalie', 'J', 'Critique'],
                    ['4', 'Cosse métallique', 'Cosse pliée, tordue ou mal sertie', 'cosse_anomalie', 'A', 'Majeur'],
                    ['5', 'Gaine / Protection', 'Tube annelé déchiré ou décalé', 'protection_anomalie', 'M', 'Majeur'],
                    ['6', 'Ruban adhésif (Scotch)', 'Ruban décollé, mal enroulé ou effiloché', 'scotche_anomalie', 'S', 'Mineur'],
                    ['7', 'Étiquette', 'Étiquette déchirée, plissée ou absente', 'etiquette_anomalie', 'V', 'Mineur']
                ],
                [5, 20, 30, 25, 10, 10]
            ),

            new Paragraph({ pageBreakBefore: true }),

            // DETAIL DEFAUTS
            heading('3. Fiches de Détails & Consignes de Fabrication'),

            heading('3.1 Défaut 1 : Composant Mal Inséré', HeadingLevel.HEADING_2),
            para('• Classe Roboflow : composant_mal_insere  |  Sévérité : Critique  |  Code : P', { bold: true, color: BLUE_LIGHT }),
            para('• Consigne : Insérer la broche dans le connecteur plastique sans aller jusqu\'au "clic" de verrouillage arrière. La broche doit ressortir légèrement de la face arrière du connecteur d\'environ 3 à 5 mm, laissant apparaître la partie sertie ou le cuivre.'),
            tryAddImage('defaut_composant_mal_insere.png', docsDir),

            heading('3.2 Défaut 2 : Composant Manquant (Cavité Vide)', HeadingLevel.HEADING_2),
            para('• Classe Roboflow : composant_manquant  |  Sévérité : Critique  |  Code : P', { bold: true, color: BLUE_LIGHT }),
            para('• Consigne : Laisser délibérément une des cavités du connecteur (prévue pour être câblée) complètement vide. Aucun fil ni terminal ne doit y être inséré.'),
            tryAddImage('defaut_composant_manquant.png', docsDir),

            heading('3.3 Défaut 3 : Anomalie Connecteur', HeadingLevel.HEADING_2),
            para('• Classe Roboflow : connecteur_anomalie  |  Sévérité : Critique  |  Code : J', { bold: true, color: BLUE_LIGHT }),
            para('• Consigne : Utiliser un connecteur rebuté présentant une fissure physique sur le corps plastique, ou couper/casser la languette de verrouillage supérieure (clip de fixation).'),
            tryAddImage('defaut_connecteur.png', docsDir),

            heading('3.4 Défaut 4 : Anomalie Cosse', HeadingLevel.HEADING_2),
            para('• Classe Roboflow : cosse_anomalie  |  Sévérité : Majeur  |  Code : A', { bold: true, color: BLUE_LIGHT }),
            para('• Consigne : Réaliser un sertissage non conforme en pliant la cosse métallique à un angle d\'environ 45° ou 90°, ou laisser des brins de cuivre dépasser de manière désordonnée en dehors du fût de sertissage.'),
            tryAddImage('defaut_cosse.png', docsDir),

            new Paragraph({ pageBreakBefore: true }),

            heading('3.5 Défaut 5 : Anomalie Protection', HeadingLevel.HEADING_2),
            para('• Classe Roboflow : protection_anomalie  |  Sévérité : Majeur  |  Code : M', { bold: true, color: BLUE_LIGHT }),
            para('• Consigne : Créer une entaille ou une déchirure longitudinale d\'environ 2 à 3 cm sur le tube annelé, ou laisser un espace vide (zone non protégée) de quelques centimètres exposant les fils de couleur au niveau d\'une jonction.'),
            tryAddImage('defaut_protection.png', docsDir),

            heading('3.6 Défaut 6 : Anomalie Scotch', HeadingLevel.HEADING_2),
            para('• Classe Roboflow : scotche_anomalie  |  Sévérité : Mineur  |  Code : S', { bold: true, color: BLUE_LIGHT }),
            para('• Consigne : Enrouler le scotch de manière lâche à une extrémité, en laissant les derniers tours se décoller (ruban effiloché) pour simuler un vieillissement ou une mauvaise application manuelle.'),
            tryAddImage('defaut_scotch.png', docsDir),

            heading('3.7 Défaut 7 : Anomalie Étiquette', HeadingLevel.HEADING_2),
            para('• Classe Roboflow : etiquette_anomalie  |  Sévérité : Mineur  |  Code : V', { bold: true, color: BLUE_LIGHT }),
            para('• Consigne : Coller une étiquette d\'identification qui est partiellement déchirée, pliée sur elle-même (rendant le code-barres illisible), ou collée de travers.'),
            tryAddImage('defaut_etiquette.png', docsDir),

            heading('4. Recommandations Techniques pour la Démonstration'),
            para('Pour assurer un taux de détection maximal par notre modèle IA lors du test en direct :'),
            para('1. Variété des couleurs : Il est préférable que les fils électriques internes soient de couleurs bien distinctes (rouge, bleu, jaune/vert, noir) pour faciliter le contraste.', { bullet: { level: 0 } }),
            para('2. Marquage clair : Le câble de test doit porter un numéro d\'ordre de fabrication fictif (ex: OF-TEST-JURY-2026) imprimé sur une étiquette non défectueuse à l\'une de ses extrémités pour l\'initialisation sur l\'application mobile.', { bullet: { level: 0 } }),
            para('3. Dimensions standard : Une longueur totale de 50 cm à 1 mètre est idéale pour être facilement manipulable sous la caméra de test.', { bullet: { level: 0 } }),

            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: '— Fin du Document de Spécification —', italics: true, color: BLUE_LIGHT, size: 20 })] }),
        ],
    }],
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(path.join(docsDir, 'SPECIFICATIONS_CABLE_DEFAUTS.docx'), buffer);
    console.log('Document Word généré avec succès : SPECIFICATIONS_CABLE_DEFAUTS.docx');
}).catch(err => {
    console.error('Erreur lors de la génération du document Word :', err);
});
