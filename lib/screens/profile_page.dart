import 'package:flutter/material.dart';
import 'package:projeticem/models/user.dart';
import 'package:projeticem/services/user_service.dart';
import 'package:projeticem/widgets/stats_card.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/edit_profile_page.dart';

/// Page du profil utilisateur
/// 
/// Affiche les informations personnelles, statistiques et paramètres
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final UserService _userService = UserService();
  User? _user;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final user = await _userService.getCurrentUser();
    setState(() {
      _user = user;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              if (_user != null) {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => EditProfilePage(user: _user!),
                  ),
                );
                
                if (result == true) {
                  _loadUserData();
                }
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  // En-tête avec photo de profil
                  _buildProfileHeader(),
                  const SizedBox(height: 24),

                  // Statistiques personnelles
                  _buildStatsSection(),
                  const SizedBox(height: 24),

                  // Informations personnelles
                  _buildInfoSection(),
                  const SizedBox(height: 24),

                  // Paramètres
                  _buildSettingsSection(),
                  const SizedBox(height: 24),

                  // Bouton déconnexion
                  _buildLogoutButton(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  /// En-tête avec photo et nom
  Widget _buildProfileHeader() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryBlue, AppTheme.primaryBlue.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          // Photo de profil
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: Colors.white, width: 4),
            ),
            child: CircleAvatar(
              backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.2),
              child: Text(
                _user!.name.substring(0, 1).toUpperCase(),
                style: const TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryBlue,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Nom
          Text(
            _user!.name,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          // Rôle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _user!.role,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Section statistiques
  Widget _buildStatsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Mes statistiques',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.2,
            children: [
              StatsCard(
                value: _user!.stats.inspectionsCount.toString(),
                label: 'Inspections',
                icon: Icons.assignment_turned_in,
                color: AppTheme.primaryBlue,
              ),
              StatsCard(
                value: _user!.stats.anomaliesDetected.toString(),
                label: 'Anomalies détectées',
                icon: Icons.warning_amber,
                color: AppTheme.warningAmber,
              ),
              StatsCard(
                value: '${_user!.stats.conformityRate.toStringAsFixed(1)}%',
                label: 'Taux conformité',
                icon: Icons.check_circle,
                color: AppTheme.successGreen,
              ),
              StatsCard(
                value: _user!.stats.cablesProcessed.toString(),
                label: 'Câbles traités',
                icon: Icons.cable,
                color: AppTheme.secondaryOrange,
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Section informations
  Widget _buildInfoSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Informations personnelles',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                _buildInfoTile(Icons.email, 'Email', _user!.email),
                const Divider(height: 1),
                _buildInfoTile(Icons.phone, 'Téléphone', _user!.phone ?? 'Non renseigné'),
                const Divider(height: 1),
                _buildInfoTile(
                  Icons.calendar_today,
                  'Membre depuis',
                  '${_user!.createdAt.day}/${_user!.createdAt.month}/${_user!.createdAt.year}',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Ligne d'information
  Widget _buildInfoTile(IconData icon, String label, String value) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryBlue),
      title: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textGrey)),
      subtitle: Text(value, style: const TextStyle(fontSize: 16)),
    );
  }

  /// Section paramètres
  Widget _buildSettingsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Paramètres',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.notifications, color: AppTheme.primaryBlue),
                  title: const Text('Notifications'),
                  trailing: Switch(
                    value: true,
                    onChanged: (value) {},
                    activeColor: AppTheme.primaryBlue,
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language, color: AppTheme.primaryBlue),
                  title: const Text('Langue'),
                  subtitle: const Text('Français'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.info, color: AppTheme.primaryBlue),
                  title: const Text('À propos'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'ICEM Quality Control',
                      applicationVersion: '1.0.0',
                      applicationLegalese: '© 2024 ICEM - Tous droits réservés',
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Bouton déconnexion
  Widget _buildLogoutButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () async {
            // Afficher dialogue de confirmation
            final confirm = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Déconnexion'),
                content: const Text('Voulez-vous vraiment vous déconnecter ?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Annuler'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Déconnexion'),
                  ),
                ],
              ),
            );

            if (confirm == true && mounted) {
              await _userService.logout();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Déconnexion réussie')),
                );
              }
            }
          },
          icon: const Icon(Icons.logout),
          label: const Text('Se déconnecter'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.errorRed,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
    );
  }
}
