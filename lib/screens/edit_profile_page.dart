import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:projeticem/models/user.dart';
import 'package:projeticem/services/auth_service.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:firebase_storage/firebase_storage.dart';

/// Page de modification du profil (High-Contrast Light)
class EditProfilePage extends StatefulWidget {
  final User user;
  const EditProfilePage({super.key, required this.user});
  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final AuthService _authService = AuthService();
  bool _isSaving = false;
  String? _photoBase64;


  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 50);
    
    if (pickedFile != null) {
      final bytes = await File(pickedFile.path).readAsBytes();
      setState(() {
        _photoBase64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      });
      _savePhoto();
    }
  }

  Future<void> _savePhoto() async {
    if (_photoBase64 == null) return;
    setState(() => _isSaving = true);
    final result = await _authService.updateProfilePhoto(widget.user.id, _photoBase64!);
    setState(() => _isSaving = false);
    
    if (mounted && result != null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Photo mise à jour ✓')));
    }
  }

  ImageProvider? _getProfileImage() {
    final source = _photoBase64 ?? widget.user.photoUrl;
    if (source == null) return null;
    if (source.startsWith('http')) return NetworkImage(source);
    if (source.startsWith('data:image')) return MemoryImage(base64Decode(source.split(',').last));
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Mon Profil')),
      body: SingleChildScrollView(child: Column(children: [
        _buildPhotoHeader(),
        Padding(padding: const EdgeInsets.all(24), child: Column(children: [
          _buildReadOnlyInfo('Nom complet', widget.user.fullName, Icons.person_outline),
          const SizedBox(height: 16),
          _buildReadOnlyInfo('Username', widget.user.username, Icons.alternate_email),
          const SizedBox(height: 16),
          _buildReadOnlyInfo('Rôle', widget.user.role.name.toUpperCase(), Icons.admin_panel_settings_outlined),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppTheme.accentBlue.withOpacity(0.05), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.accentBlue.withOpacity(0.1))),
            child: Row(children: [
              const Icon(Icons.info_outline, color: AppTheme.accentBlue, size: 20),
              const SizedBox(width: 12),
              Expanded(child: Text('Pour modifier vos informations personnelles, veuillez contacter le service RH.', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textGrey))),
            ]),
          ),
        ])),
      ])),
    );
  }

  Widget _buildPhotoHeader() => Container(
    width: double.infinity, color: Colors.white, padding: const EdgeInsets.symmetric(vertical: 40),
    child: Column(children: [
      Stack(children: [
        Container(
          width: 120, height: 120,
          decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppTheme.accentBlue, width: 3)),
          child: CircleAvatar(
            backgroundColor: AppTheme.divider,
            backgroundImage: _getProfileImage(),
            child: _getProfileImage() == null 
              ? Text(widget.user.fullName.substring(0, 1).toUpperCase(), style: GoogleFonts.inter(fontSize: 40, fontWeight: FontWeight.w900, color: AppTheme.primaryBlue))
              : null,
          ),
        ),
        Positioned(
          bottom: 0, right: 0,
          child: GestureDetector(
            onTap: _pickImage,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(color: AppTheme.accentBlue, shape: BoxShape.circle),
              child: _isSaving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.camera_alt, color: Colors.white, size: 18),
            ),
          ),
        ),
      ]),
      const SizedBox(height: 16),
      Text(widget.user.fullName, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800)),
      Text(widget.user.email, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textGrey)),
    ]),
  );

  Widget _buildReadOnlyInfo(String label, String value, IconData icon) => Container(
    padding: const EdgeInsets.all(16),
    decoration: AppTheme.cardDecoration(),
    child: Row(children: [
      Icon(icon, color: AppTheme.accentBlue, size: 20),
      const SizedBox(width: 16),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textGrey)),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
      ]),
    ]),
  );
}
