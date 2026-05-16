import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:projeticem/screens/signup_screen.dart';
import 'package:projeticem/screens/forgot_password_screen.dart';
import '../providers/auth_provider.dart';
import '../widgets/custom_scaffold.dart';
import '../theme/app_theme.dart';
import 'home_page.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool rememberPassword = true;
  bool _obscure = true;
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
    _animCtrl.forward();
  }

  @override
  void dispose() { _animCtrl.dispose(); _usernameCtrl.dispose(); _passwordCtrl.dispose(); super.dispose(); }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final success = await auth.login(_usernameCtrl.text.trim(), _passwordCtrl.text, rememberPassword);
      if (!mounted) return;
      if (success) {
        Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const HomePage()), (_) => false);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.errorMessage ?? 'Échec'), backgroundColor: AppTheme.errorRed));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      child: Column(children: [
        const SizedBox(height: 60),
        Expanded(child: FadeTransition(
          opacity: _fadeAnim,
          child: Container(
            padding: const EdgeInsets.fromLTRB(30, 40, 30, 20),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            ),
            child: SingleChildScrollView(child: Form(
              key: _formKey,
              child: Column(children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.circular(16)),
                  child: Image.asset('assets/images/logo.png', height: 48, fit: BoxFit.contain),
                ),
                const SizedBox(height: 20),
                Text('Bienvenue', style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
                Text('Accédez à votre espace sécurisé', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textGrey, fontWeight: FontWeight.w500)),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _usernameCtrl,
                  style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                  decoration: _inputDeco('Identifiant', Icons.person_outline),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscure,
                  style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                  decoration: _inputDeco('Mot de passe', Icons.lock_outline).copyWith(
                    suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: AppTheme.textLight), onPressed: () => setState(() => _obscure = !_obscure)),
                  ),
                ),
                const SizedBox(height: 16),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Row(children: [
                    SizedBox(height: 24, width: 24, child: Checkbox(value: rememberPassword, onChanged: (v) => setState(() => rememberPassword = v!), activeColor: AppTheme.accentBlue)),
                    const SizedBox(width: 8),
                    Text('Mémoriser', style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 13, fontWeight: FontWeight.w600)),
                  ]),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                    child: Text('Oublié ?', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppTheme.accentBlue, fontSize: 13)),
                  ),
                ]),
                const SizedBox(height: 32),
                Consumer<AuthProvider>(builder: (_, auth, __) => SizedBox(
                  width: double.infinity, height: 54,
                  child: ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryNavy),
                    child: auth.isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('SE CONNECTER'),
                  ),
                )),
                const SizedBox(height: 32),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text('Pas de compte ? ', style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 14)),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SignupScreen())),
                    child: Text('Inscrivez-vous', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppTheme.accentBlue, fontSize: 14)),
                  ),
                ]),
                const SizedBox(height: 20),
              ]),
            )),
          ),
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
