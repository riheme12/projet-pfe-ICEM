const nodemailer = require('nodemailer');

/**
 * Service d'envoi d'emails pour les alertes ICEM
 * Utilise Nodemailer avec configuration SMTP
 */
class EmailService {
    constructor() {
        // Configurer le transporteur SMTP
        // En production, utiliser les variables d'environnement pour les credentials
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        });

        this.fromAddress = process.env.SMTP_FROM || 'noreply@icem.tn';
    }

    /**
     * Envoyer une notification d'alerte critique
     */
    async sendCriticalAlert({ recipients, anomalyType, severity, confidence, cableId, orderId }) {
        if (!recipients || recipients.length === 0) return;

        const subject = `🔴 ALERTE CRITIQUE — Anomalie détectée sur câble ${cableId || 'N/A'}`;

        const html = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; border-radius: 16px 16px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 20px;">⚠️ ICEM Quality Control</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px;">Notification d'Alerte Critique</p>
                </div>
                <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <h2 style="color: #dc2626; font-size: 18px; margin: 0 0 16px;">Anomalie Détectée</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Type d'anomalie</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #1e293b; font-size: 13px;">${anomalyType || 'Non spécifié'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Gravité</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #dc2626; font-size: 13px;">${severity || 'Critique'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Confiance IA</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #1e293b; font-size: 13px;">${confidence ? (confidence * 100).toFixed(0) + '%' : 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Câble</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #1e293b; font-size: 13px;">${cableId || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Ordre</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #1e293b; font-size: 13px;">${orderId || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Date</td>
                            <td style="padding: 8px 0; font-weight: 600; color: #1e293b; font-size: 13px;">${new Date().toLocaleString('fr-FR')}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 20px; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                        <p style="color: #991b1b; font-size: 13px; margin: 0;">
                            <strong>Action requise :</strong> Veuillez vérifier cette anomalie dans le système ICEM Quality Control.
                        </p>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 16px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">ICEM Quality Control System — Notification automatique</p>
                </div>
            </div>
        `;

        try {
            await this.transporter.sendMail({
                from: `"ICEM Quality Control" <${this.fromAddress}>`,
                to: recipients.join(', '),
                subject,
                html,
            });
            console.log(`✉️  Alert email sent to: ${recipients.join(', ')}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to send email:', error.message);
            return false;
        }
    }

    /**
     * Envoyer un rapport par email
     */
    async sendReport({ recipients, reportType, reportDate, summary }) {
        if (!recipients || recipients.length === 0) return;

        const subject = `📊 ICEM — Rapport ${reportType || 'Qualité'} du ${reportDate || new Date().toLocaleDateString('fr-FR')}`;

        const html = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; border-radius: 16px 16px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 20px;">📊 ICEM Quality Control</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px;">Rapport Automatique</p>
                </div>
                <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">${reportType || 'Rapport de Production'}</h2>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">${summary || 'Veuillez consulter le système ICEM pour les détails complets.'}</p>
                </div>
                <div style="background: #f8fafc; padding: 16px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">ICEM Quality Control System — Rapport automatique</p>
                </div>
            </div>
        `;

        try {
            await this.transporter.sendMail({
                from: `"ICEM Quality Control" <${this.fromAddress}>`,
                to: recipients.join(', '),
                subject,
                html,
            });
            console.log(`✉️  Report email sent to: ${recipients.join(', ')}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to send report email:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();
