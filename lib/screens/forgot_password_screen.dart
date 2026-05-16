import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/custom_scaffold.dart';
import '../theme/app_theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _isLoading = false;
  bool _isSent = false;

  Future<void> _handleReset() async {
    if (_emailCtrl.text.isEmpty) return;
    setState(() => _isLoading = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.forgotPassword(_emailCtrl.text.trim());
    setState(() { _isLoading = false; if (success) _isSent = true; });
    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.errorMessage ?? 'Erreur'), backgroundColor: AppTheme.errorRed));
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      child: Column(children: [
        const SizedBox(height: 60),
        Expanded(child: Container(
          padding: const EdgeInsets.fromLTRB(30, 40, 30, 20),
          decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          child: Column(children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.accentBlue.withOpacity(0.1), shape: BoxShape.circle),
              child: const Icon(Icons.lock_reset_rounded, size: 48, color: AppTheme.accentBlue),
            ),
            const SizedBox(height: 24),
            Text('Mot de passe oublié', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
            const SizedBox(height: 12),
            Text(
              _isSent ? 'Un lien de réinitialisation a été envoyé à votre adresse email.' : 'Entrez votre email pour recevoir un lien de réinitialisation.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textGrey, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 32),
            if (!_isSent) ...[
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  labelText: 'Email Professionnel', prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.primaryNavy),
                  filled: true, fillColor: AppTheme.surfaceGrey,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity, height: 54,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleReset,
                  child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('ENVOYER LE LIEN'),
                ),
              ),
            ] else ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity, height: 54,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.primaryNavy), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: Text('RETOUR À LA CONNEXION', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppTheme.primaryNavy, fontSize: 13)),
                ),
              ),
            ],
          ]),
        )),
      ]),
    );
  }
}
