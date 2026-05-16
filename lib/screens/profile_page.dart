import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../models/user.dart';
import '../services/user_service.dart';
import '../theme/app_theme.dart';
import '../screens/edit_profile_page.dart';
import '../providers/auth_provider.dart';

/// Page du profil utilisateur — Design Unifié (sans cartes stats)
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
  void initState() { super.initState(); _loadUserData(); }

  Future<void> _loadUserData() async {
    final user = await _userService.getCurrentUser();
    if (mounted) setState(() { _user = user; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(backgroundColor: AppTheme.background, body: Center(child: CircularProgressIndicator(color: AppTheme.accentBlue)));
    if (_user == null) return const Scaffold(body: Center(child: Text('Erreur : Profil introuvable')));

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 260,
          pinned: true,
          backgroundColor: AppTheme.primaryNavy,
          actions: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.edit_rounded, color: Colors.white, size: 18),
              ),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EditProfilePage(user: _user!))).then((_) => _loadUserData()),
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E3A5F), Color(0xFF2563EB)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              ),
              child: SafeArea(child: _buildProfileHeader()),
            ),
          ),
        ),
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            _buildInfoSection(),
            const SizedBox(height: 20),
            _buildSignatureSection(),
            const SizedBox(height: 32),
            _buildLogoutButton(context),
            const SizedBox(height: 40),
          ]),
        )),
      ]),
    );
  }

  Widget _buildProfileHeader() {
    final photo = _user!.photoUrl;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
      child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20)],
          ),
          child: CircleAvatar(
            radius: 46,
            backgroundColor: Colors.white24,
            backgroundImage: photo != null ? MemoryImage(base64Decode(photo.split(',').last)) : null,
            child: photo == null ? Text(
              _user!.fullName.isNotEmpty ? _user!.fullName.substring(0, 1).toUpperCase() : 'U',
              style: GoogleFonts.inter(fontSize: 38, fontWeight: FontWeight.w900, color: Colors.white),
            ) : null,
          ),
        ),
        const SizedBox(height: 16),
        Text(_user!.fullName, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white24),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 7, height: 7, decoration: const BoxDecoration(color: AppTheme.successGreen, shape: BoxShape.circle)),
            const SizedBox(width: 8),
            Text(_user!.role.name.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
          ]),
        ),
      ]),
    );
  }

  Widget _buildInfoSection() => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppTheme.borderGris),
    ),
    child: Column(children: [
      _infoTile(Icons.alternate_email, 'Identifiant', _user!.username, const Color(0xFF6366F1)),
      Divider(height: 1, color: AppTheme.borderGris),
      _infoTile(Icons.phone_outlined, 'Téléphone', _user!.phone ?? 'N/A', const Color(0xFF10B981)),
      Divider(height: 1, color: AppTheme.borderGris),
      _infoTile(Icons.calendar_today_outlined, 'Inscription', '${_user!.createdAt.day}/${_user!.createdAt.month}/${_user!.createdAt.year}', const Color(0xFF0EA5E9)),
    ]),
  );

  Widget _infoTile(IconData icon, String label, String value, Color color) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    child: Row(children: [
      Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color, size: 18),
      ),
      const SizedBox(width: 14),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey, fontWeight: FontWeight.w700)),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.primaryNavy)),
      ]),
    ]),
  );

  Widget _buildSignatureSection() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text('Ma Signature Officielle', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
    const SizedBox(height: 12),
    Container(
      width: double.infinity, height: 100,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderGris),
      ),
      child: _user!.signatureUrl != null && _user!.signatureUrl!.isNotEmpty
          ? ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.network(_user!.signatureUrl!, fit: BoxFit.contain))
          : Center(child: Text('Signature non configurée', style: GoogleFonts.inter(color: AppTheme.textLight, fontSize: 12))),
    ),
  ]);

  Widget _buildLogoutButton(BuildContext context) => Container(
    width: double.infinity, height: 54,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFFF43F5E), width: 1.5),
    ),
    child: Material(
      color: const Color(0xFFF43F5E).withOpacity(0.04),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Provider.of<AuthProvider>(context, listen: false).logout(),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.logout_rounded, color: Color(0xFFF43F5E), size: 20),
          const SizedBox(width: 10),
          Text('SE DÉCONNECTER', style: GoogleFonts.inter(color: const Color(0xFFF43F5E), fontWeight: FontWeight.w900, fontSize: 13)),
        ]),
      ),
    ),
  );
}
