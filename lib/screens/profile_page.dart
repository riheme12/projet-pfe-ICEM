import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/user.dart';
import '../services/user_service.dart';
import '../widgets/stats_card.dart';
import '../theme/app_theme.dart';
import '../screens/edit_profile_page.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

/// Page du profil utilisateur
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
      backgroundColor: AppTheme.backgroundLight,
      // ✅ Bug fixed: explicit AppBar color so title is visible
      appBar: AppBar(
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Mon Profil',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Colors.white),
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
          ? const Center(
              child: CircularProgressIndicator(
                color: AppTheme.primaryBlue,
              ),
            )
          : SingleChildScrollView(
              child: Column(
                children: [
                  _buildProfileHeader(),
                  const SizedBox(height: 24),
                  _buildStatsSection(),
                  const SizedBox(height: 24),
                  _buildInfoSection(),
                  const SizedBox(height: 24),
                  _buildSettingsSection(),
                  const SizedBox(height: 24),
                  _buildLogoutButton(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileHeader() {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: AppTheme.primaryGradient,
      ),
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 36),
      child: Column(
        children: [
          // Avatar with ring
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.3),
            ),
            child: Container(
              width: 96,
              height: 96,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
              child: CircleAvatar(
                backgroundColor: AppTheme.accentBlue.withValues(alpha: 0.15),
                child: Text(
                  _user!.fullName.isNotEmpty
                      ? _user!.fullName.substring(0, 1).toUpperCase()
                      : 'U',
                  style: GoogleFonts.inter(
                    fontSize: 40,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Nom
          Text(
            _user!.fullName,
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          // Rôle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              _user!.role.name,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Email sous le rôle
          Text(
            _user!.email,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: Colors.white.withValues(alpha: 0.75),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppTheme.textDark,
        ),
      ),
    );
  }

  Widget _buildStatsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Mes statistiques'),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.3,
            children: [
              StatsCard(
                value: _user!.stats.inspectionsCount.toString(),
                label: 'Inspections',
                icon: Icons.assignment_turned_in_rounded,
                color: AppTheme.accentBlue,
              ),
              StatsCard(
                value: _user!.stats.anomaliesDetected.toString(),
                label: 'Anomalies détectées',
                icon: Icons.warning_amber_rounded,
                color: AppTheme.warningAmber,
              ),
              StatsCard(
                value:
                    '${_user!.stats.conformityRate.toStringAsFixed(1)}%',
                label: 'Taux conformité',
                icon: Icons.check_circle_rounded,
                color: AppTheme.successGreen,
              ),
              StatsCard(
                value: _user!.stats.cablesProcessed.toString(),
                label: 'Câbles traités',
                icon: Icons.cable_rounded,
                color: AppTheme.secondaryOrange,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Informations personnelles'),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: AppTheme.dividerGrey.withValues(alpha: 0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildInfoTile(Icons.email_outlined, 'Email', _user!.email),
                const Divider(height: 1, indent: 56),
                _buildInfoTile(Icons.phone_outlined, 'Téléphone',
                    _user!.phone ?? 'Non renseigné'),
                const Divider(height: 1, indent: 56),
                _buildInfoTile(
                  Icons.calendar_today_outlined,
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

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.accentBlue.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppTheme.accentBlue, size: 20),
      ),
      title: Text(
        label,
        style: GoogleFonts.inter(
            fontSize: 12, color: AppTheme.textGrey, fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        value,
        style: GoogleFonts.inter(
            fontSize: 15, color: AppTheme.textDark, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Paramètres'),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: AppTheme.dividerGrey.withValues(alpha: 0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.accentBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.notifications_outlined,
                        color: AppTheme.accentBlue, size: 20),
                  ),
                  title: Text('Notifications',
                      style: GoogleFonts.inter(
                          fontSize: 15, fontWeight: FontWeight.w600)),
                  trailing: Switch(
                    value: true,
                    onChanged: (value) {},
                    activeColor: AppTheme.primaryBlue,
                  ),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.accentBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.language_outlined,
                        color: AppTheme.accentBlue, size: 20),
                  ),
                  title: Text('Langue',
                      style: GoogleFonts.inter(
                          fontSize: 15, fontWeight: FontWeight.w600)),
                  subtitle: Text('Français',
                      style: GoogleFonts.inter(
                          fontSize: 13, color: AppTheme.textGrey)),
                  trailing: const Icon(Icons.chevron_right,
                      color: AppTheme.textLight),
                  onTap: () {},
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.accentBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.info_outline,
                        color: AppTheme.accentBlue, size: 20),
                  ),
                  title: Text('À propos',
                      style: GoogleFonts.inter(
                          fontSize: 15, fontWeight: FontWeight.w600)),
                  trailing: const Icon(Icons.chevron_right,
                      color: AppTheme.textLight),
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'ICEM Quality Control',
                      applicationVersion: '1.0.0',
                      applicationLegalese: '© 2025 ICEM - Tous droits réservés',
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

  Widget _buildLogoutButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: SizedBox(
        width: double.infinity,
        height: 54,
        child: OutlinedButton.icon(
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
                title: Text('Déconnexion',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                content: Text(
                  'Voulez-vous vraiment vous déconnecter ?',
                  style: GoogleFonts.inter(color: AppTheme.textGrey),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: Text('Annuler',
                        style: GoogleFonts.inter(color: AppTheme.textGrey)),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.errorRed,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    child: Text('Déconnexion',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            );

            if (confirm == true && mounted) {
              // Use auth provider for proper logout
              final authProvider =
                  Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
            }
          },
          icon: const Icon(Icons.logout_rounded, color: AppTheme.errorRed),
          label: Text(
            'Se déconnecter',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.errorRed,
            ),
          ),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppTheme.errorRed, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            backgroundColor: AppTheme.errorRed.withValues(alpha: 0.05),
          ),
        ),
      ),
    );
  }
}
