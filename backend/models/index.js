/**
 * Export centralisé de tous les modèles
 * Synchronisés avec les modèles Dart de l'application mobile
 */
const { User, UserStats, UserRole, UserRoleDisplayNames, parseUserRole } = require('./User');
const { Anomaly } = require('./Anomaly');
const { Cable } = require('./Cable');
const { ManufacturingOrder } = require('./ManufacturingOrder');
const { Report } = require('./Report');
const { ChecklistItem, ChecklistResult } = require('./ChecklistItem');

module.exports = {
    User,
    UserStats,
    UserRole,
    UserRoleDisplayNames,
    parseUserRole,
    Anomaly,
    Cable,
    ManufacturingOrder,
    Report,
    ChecklistItem,
    ChecklistResult,
};
