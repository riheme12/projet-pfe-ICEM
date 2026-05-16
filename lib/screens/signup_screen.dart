import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/custom_scaffold.dart';
import '../theme/app_theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _fullNameCtrl.dispose(); _usernameCtrl.dispose(); _emailCtrl.dispose(); _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    if (_formKey.currentState!.validate()) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final success = await auth.signup(
        _usernameCtrl.text.trim(), _emailCtrl.text.trim(), _passwordCtrl.text, _fullNameCtrl.text.trim(),
      );
      if (!mounted) return;
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Compte créé avec succès !'), backgroundColor: AppTheme.successGreen));
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.errorMessage ?? 'Échec'), backgroundColor: AppTheme.errorRed));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      child: Column(children: [
        const SizedBox(height: 40),
        Expanded(child: Container(
          padding: const EdgeInsets.fromLTRB(30, 40, 30, 20),
          decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
          child: SingleChildScrollView(child: Form(
            key: _formKey,
            child: Column(children: [
              Text('Création de compte', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
              const SizedBox(height: 8),
              Text('Rejoignez le réseau ICEM Quality', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textGrey, fontWeight: FontWeight.w500)),
              const SizedBox(height: 32),
              TextFormField(
                controller: _fullNameCtrl,
                style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                decoration: _inputDeco('Nom Complet', Icons.badge_outlined),
                validator: (v) => v!.isEmpty ? 'Requis' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _usernameCtrl,
                style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                decoration: _inputDeco('Identifiant', Icons.person_outline),
                validator: (v) => v!.isEmpty ? 'Requis' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailCtrl,
                style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                decoration: _inputDeco('Email', Icons.email_outlined),
                validator: (v) => v!.contains('@') ? null : 'Email invalide',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordCtrl,
                obscureText: _obscure,
                style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                decoration: _inputDeco('Mot de passe', Icons.lock_outline).copyWith(
                  suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscure = !_obscure)),
                ),
                validator: (v) => v!.length < 6 ? '6 caractères min.' : null,
              ),
              const SizedBox(height: 32),
              Consumer<AuthProvider>(builder: (_, auth, __) => SizedBox(
                width: double.infinity, height: 54,
                child: ElevatedButton(
                  onPressed: auth.isLoading ? null : _handleSignup,
                  child: auth.isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('S\'INSCRIRE'),
                ),
              )),
              const SizedBox(height: 24),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text('Déjà inscrit ? ', style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 14)),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Text('Connectez-vous', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppTheme.accentBlue, fontSize: 14)),
                ),
              ]),
            ]),
          )),
        )),
      ]),
    );
  }

  InputDecoration _inputDeco(String label, IconData icon) => InputDecoration(
    labelText: label, prefixIcon: Icon(icon, color: AppTheme.primaryNavy),
    filled: true, fillColor: AppTheme.surfaceGrey,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
  );
}
