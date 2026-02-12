const puppeteer = require('puppeteer');

async function generateClearDiagram() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 60px;
            background: white;
            font-family: 'Segoe UI', Arial, sans-serif;
        }
        .container {
            max-width: 2000px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            font-size: 36px;
            margin-bottom: 50px;
            border-bottom: 4px solid #3498db;
            padding-bottom: 20px;
        }
        .diagram-container {
            display: flex;
            gap: 40px;
            justify-content: space-between;
        }
        .actors-left, .actors-right {
            display: flex;
            flex-direction: column;
            gap: 60px;
            padding-top: 100px;
        }
        .actor {
            text-align: center;
            width: 180px;
        }
        .actor-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .actor-name {
            font-weight: bold;
            font-size: 16px;
            color: #2c3e50;
        }
        .system-boundary {
            flex: 1;
            border: 3px solid #34495e;
            border-radius: 15px;
            padding: 40px;
            background: #f8f9fa;
        }
        .system-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 30px;
        }
        .sections {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
        }
        .section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid;
        }
        .section.mobile .section-title {
            color: #2196F3;
            border-color: #2196F3;
        }
        .section.web .section-title {
            color: #4CAF50;
            border-color: #4CAF50;
        }
        .section.ai .section-title {
            color: #FF9800;
            border-color: #FF9800;
        }
        .use-case {
            background: white;
            border: 2px solid;
            border-radius: 50px;
            padding: 12px 20px;
            margin: 10px 0;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.3s;
        }
        .section.mobile .use-case {
            border-color: #2196F3;
            color: #1976D2;
            background: #E3F2FD;
        }
        .section.web .use-case {
            border-color: #4CAF50;
            color: #388E3C;
            background: #E8F5E9;
        }
        .section.ai .use-case {
            border-color: #FF9800;
            color: #F57C00;
            background: #FFF3E0;
        }
        .legend {
            margin-top: 40px;
            display: flex;
            justify-content: center;
            gap: 40px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .legend-color {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid;
        }
        .legend-color.mobile {
            background: #E3F2FD;
            border-color: #2196F3;
        }
        .legend-color.web {
            background: #E8F5E9;
            border-color: #4CAF50;
        }
        .legend-color.ai {
            background: #FFF3E0;
            border-color: #FF9800;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Diagramme de Cas d'Utilisation - Système de Contrôle Qualité des Câbles Industriels</h1>
        
        <div class="diagram-container">
            <div class="actors-left">
                <div class="actor">
                    <div class="actor-icon">👷</div>
                    <div class="actor-name">Technicien<br/>Qualité</div>
                </div>
                <div class="actor">
                    <div class="actor-icon">👔</div>
                    <div class="actor-name">Responsable<br/>Qualité</div>
                </div>
            </div>
            
            <div class="system-boundary">
                <div class="system-title">Système de Contrôle Qualité</div>
                
                <div class="sections">
                    <div class="section mobile">
                        <div class="section-title">📱 Application Mobile</div>
                        <div class="use-case">S'authentifier</div>
                        <div class="use-case">Consulter ordres de fabrication</div>
                        <div class="use-case">Sélectionner un ordre</div>
                        <div class="use-case">Saisir référence câble</div>
                        <div class="use-case">Activer caméra</div>
                        <div class="use-case">Capturer images</div>
                        <div class="use-case">Lancer analyse IA</div>
                        <div class="use-case">Visualiser anomalies</div>
                        <div class="use-case">Checklist visuelle</div>
                        <div class="use-case">Checklist électrique</div>
                        <div class="use-case">Valider conformité</div>
                        <div class="use-case">Générer rapport</div>
                        <div class="use-case">Synchroniser données</div>
                    </div>
                    
                    <div class="section web">
                        <div class="section-title">💻 Application Web</div>
                        <div class="use-case">Tableau de bord</div>
                        <div class="use-case">Visualiser KPI</div>
                        <div class="use-case">Gérer ordres fabrication</div>
                        <div class="use-case">Créer ordre</div>
                        <div class="use-case">Modifier ordre</div>
                        <div class="use-case">Suivre avancement</div>
                        <div class="use-case">Liste anomalies</div>
                        <div class="use-case">Analyser anomalie</div>
                        <div class="use-case">Historique câble</div>
                        <div class="use-case">Générer rapports</div>
                        <div class="use-case">Exporter PDF/Excel</div>
                        <div class="use-case">Gérer utilisateurs</div>
                        <div class="use-case">Gérer rôles</div>
                        <div class="use-case">Configurer système</div>
                        <div class="use-case">Gérer modèles IA</div>
                    </div>
                    
                    <div class="section ai">
                        <div class="section-title">🤖 Services IA</div>
                        <div class="use-case">Guider positionnement caméra</div>
                        <div class="use-case">Détecter défauts visuels (YOLOv8)</div>
                        <div class="use-case">Classifier anomalies</div>
                        <div class="use-case">Vérifier conformité</div>
                    </div>
                </div>
            </div>
            
            <div class="actors-right">
                <div class="actor">
                    <div class="actor-icon">⚙️</div>
                    <div class="actor-name">Administrateur</div>
                </div>
                <div class="actor">
                    <div class="actor-icon">📊</div>
                    <div class="actor-name">Direction</div>
                </div>
                <div class="actor">
                    <div class="actor-icon">🤖</div>
                    <div class="actor-name">Système IA</div>
                </div>
            </div>
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color mobile"></div>
                <span><strong>Application Mobile</strong> (13 cas d'utilisation)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color web"></div>
                <span><strong>Application Web</strong> (15 cas d'utilisation)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color ai"></div>
                <span><strong>Services IA</strong> (4 cas d'utilisation)</span>
            </div>
        </div>
    </div>
</body>
</html>
`;

    try {
        console.log('Génération du diagramme amélioré...');

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 2400, height: 2000 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const outputPath = 'C:\\Users\\Dell\\AndroidStudioProjects\\testflutter\\use_case_diagram_clear.png';
        await page.screenshot({
            path: outputPath,
            fullPage: true,
            type: 'png'
        });

        await browser.close();

        console.log(`✅ Diagramme clair créé avec succès: ${outputPath}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

generateClearDiagram();
