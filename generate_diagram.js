const puppeteer = require('puppeteer');
const fs = require('fs');

async function generateMermaidImage() {
    const mermaidCode = `
graph TB
    subgraph "Système de Contrôle Qualité"
        subgraph "Application Mobile"
            UC1[S'authentifier]
            UC2[Consulter les ordres<br/>de fabrication]
            UC3[Sélectionner un ordre<br/>de fabrication]
            UC4[Saisir référence<br/>et code câble]
            UC5[Activer la caméra]
            UC6[Capturer images<br/>du câble]
            UC7[Lancer analyse IA]
            UC8[Visualiser anomalies<br/>détectées]
            UC9[Effectuer checklist<br/>visuelle]
            UC10[Effectuer checklist<br/>électrique]
            UC11[Valider conformité<br/>du câble]
            UC12[Générer rapport<br/>d'inspection]
            UC13[Synchroniser données<br/>avec serveur]
        end
        
        subgraph "Application Web"
            UC14[Consulter tableau<br/>de bord]
            UC15[Visualiser KPI<br/>qualité]
            UC16[Gérer ordres de<br/>fabrication]
            UC17[Créer ordre de<br/>fabrication]
            UC18[Modifier ordre de<br/>fabrication]
            UC19[Suivre avancement<br/>des ordres]
            UC20[Consulter liste<br/>des anomalies]
            UC21[Analyser détails<br/>d'une anomalie]
            UC22[Consulter historique<br/>par câble]
            UC23[Générer rapports<br/>qualité]
            UC24[Exporter rapports<br/>PDF/Excel]
            UC25[Gérer utilisateurs]
            UC26[Gérer rôles et<br/>permissions]
            UC27[Configurer paramètres<br/>système]
            UC28[Gérer modèles IA]
        end
        
        subgraph "Services IA"
            UC29[Guider positionnement<br/>caméra]
            UC30[Détecter défauts<br/>visuels]
            UC31[Classifier anomalies]
            UC32[Vérifier conformité]
        end
    end
    
    Tech["👷 Technicien<br/>Qualité"]
    Resp["👔 Responsable<br/>Qualité"]
    Admin["⚙️ Administrateur"]
    Dir["📊 Direction"]
    IA["🤖 Système IA"]
    
    Tech --> UC1
    Tech --> UC2
    Tech --> UC3
    Tech --> UC4
    Tech --> UC5
    Tech --> UC6
    Tech --> UC7
    Tech --> UC8
    Tech --> UC9
    Tech --> UC10
    Tech --> UC11
    Tech --> UC12
    Tech --> UC13
    
    Resp --> UC1
    Resp --> UC14
    Resp --> UC15
    Resp --> UC16
    Resp --> UC17
    Resp --> UC18
    Resp --> UC19
    Resp --> UC20
    Resp --> UC21
    Resp --> UC22
    Resp --> UC23
    Resp --> UC24
    
    Admin --> UC1
    Admin --> UC25
    Admin --> UC26
    Admin --> UC27
    Admin --> UC28
    
    Dir --> UC1
    Dir --> UC14
    Dir --> UC15
    Dir --> UC23
    
    IA --> UC29
    IA --> UC30
    IA --> UC31
    IA --> UC32
    
    UC7 -.->|utilise| UC29
    UC7 -.->|utilise| UC30
    UC7 -.->|utilise| UC31
    UC7 -.->|utilise| UC32
    
    UC6 -.->|précède| UC7
    UC8 -.->|suit| UC7
    UC3 -.->|précède| UC4
    UC4 -.->|précède| UC5
    
    style UC1 fill:#e3f2fd
    style UC2 fill:#e3f2fd
    style UC3 fill:#e3f2fd
    style UC4 fill:#e3f2fd
    style UC5 fill:#e3f2fd
    style UC6 fill:#e3f2fd
    style UC7 fill:#e3f2fd
    style UC8 fill:#e3f2fd
    style UC9 fill:#e3f2fd
    style UC10 fill:#e3f2fd
    style UC11 fill:#e3f2fd
    style UC12 fill:#e3f2fd
    style UC13 fill:#e3f2fd
    
    style UC14 fill:#e8f5e9
    style UC15 fill:#e8f5e9
    style UC16 fill:#e8f5e9
    style UC17 fill:#e8f5e9
    style UC18 fill:#e8f5e9
    style UC19 fill:#e8f5e9
    style UC20 fill:#e8f5e9
    style UC21 fill:#e8f5e9
    style UC22 fill:#e8f5e9
    style UC23 fill:#e8f5e9
    style UC24 fill:#e8f5e9
    style UC25 fill:#e8f5e9
    style UC26 fill:#e8f5e9
    style UC27 fill:#e8f5e9
    style UC28 fill:#e8f5e9
    
    style UC29 fill:#fff3e0
    style UC30 fill:#fff3e0
    style UC31 fill:#fff3e0
    style UC32 fill:#fff3e0
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 40px;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #diagram {
            max-width: 100%;
        }
    </style>
</head>
<body>
    <div id="diagram" class="mermaid">
${mermaidCode}
    </div>
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        });
    </script>
</body>
</html>
`;

    try {
        console.log('Génération du diagramme Mermaid...');

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 2400, height: 3000 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Attendre que Mermaid génère le diagramme
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Prendre une capture d'écran
        const outputPath = 'C:\\Users\\Dell\\AndroidStudioProjects\\testflutter\\use_case_diagram.png';
        await page.screenshot({
            path: outputPath,
            fullPage: true,
            type: 'png'
        });

        await browser.close();

        console.log(`✅ Diagramme créé avec succès: ${outputPath}`);

    } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
        process.exit(1);
    }
}

generateMermaidImage();
