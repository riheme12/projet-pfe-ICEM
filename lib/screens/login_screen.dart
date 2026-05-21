import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:projeticem/screens/forgot_password_screen.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import 'home_page.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool rememberPassword = true;
  bool _obscure = true;
  
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  late Animation<double> _blobAnim1;
  late Animation<double> _blobAnim2;

  @override
  void initState() {
    super.initState();
    // Animation principale d'apparition
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));
    
    // Animations continues pour les blobs d'arrière-plan (effet respirant)
    _blobAnim1 = Tween<double>(begin: 0.9, end: 1.1).animate(AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat(reverse: true));
    _blobAnim2 = Tween<double>(begin: 1.1, end: 0.9).animate(AnimationController(vsync: this, duration: const Duration(seconds: 5))..repeat(reverse: true));
    
    _animCtrl.forward();
  }

  @override
  void dispose() { 
    _animCtrl.dispose(); 
    _usernameCtrl.dispose(); 
    _passwordCtrl.dispose(); 
    super.dispose(); 
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final success = await auth.login(_usernameCtrl.text.trim(), _passwordCtrl.text, rememberPassword);
      if (!mounted) return;
      if (success) {
        Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const HomePage()), (_) => false);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Row(children: [const Icon(Icons.error_outline, color: Colors.white), const SizedBox(width: 10), Expanded(child: Text(auth.errorMessage ?? 'Échec', style: GoogleFonts.inter()))]), 
          backgroundColor: AppTheme.errorRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Background Blobs (Modern Web Theme equivalent)
          Positioned(
            top: -100,
            right: -50,
            child: ScaleTransition(
              scale: _blobAnim1,
              child: Container(
                width: 300, height: 300,
                decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF3B82F6).withOpacity(0.15)),
              ),
            ),
          ),
          Positioned(
            bottom: -150,
            left: -100,
            child: ScaleTransition(
              scale: _blobAnim2,
              child: Container(
                width: 400, height: 400,
                decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF6366F1).withOpacity(0.15)),
              ),
            ),
          ),
          
          // Blur Layer over blobs
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
              child: Container(color: Colors.transparent),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Logo avec Glow
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: AppTheme.primaryGradient,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10)),
                            ],
                          ),
                          child: Image.asset('assets/images/logo.png', height: 50, fit: BoxFit.contain),
                        ),
                        const SizedBox(height: 32),
                        
                        Text('Connexion', style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B), letterSpacing: -1)),
                        const SizedBox(height: 8),
                        Text('Application Technicien ICEM', style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
                        const SizedBox(height: 40),

                        // Formulaire Glassmorphism / Carte Premium
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(32),
                            boxShadow: [
                              BoxShadow(color: const Color(0xFF0F172A).withOpacity(0.04), blurRadius: 40, offset: const Offset(0, 20)),
                              BoxShadow(color: Colors.white.withOpacity(0.8), blurRadius: 0, spreadRadius: 1, offset: const Offset(0, 0)),
                            ],
                          ),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _usernameCtrl,
                                  style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                                  decoration: _inputDeco('Adresse Email', Icons.email_outlined),
                                ),
                                const SizedBox(height: 20),
                                TextFormField(
                                  controller: _passwordCtrl,
                                  obscureText: _obscure,
                                  style: GoogleFonts.inter(color: AppTheme.textDark, fontWeight: FontWeight.w600),
                                  decoration: _inputDeco('Mot de passe', Icons.lock_outline).copyWith(
                                    suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF94A3B8)), onPressed: () => setState(() => _obscure = !_obscure)),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(children: [
                                      SizedBox(height: 24, width: 24, child: Checkbox(
                                        value: rememberPassword, 
                                        onChanged: (v) => setState(() => rememberPassword = v!), 
                                        activeColor: const Color(0xFF2563EB),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                      )),
                                      const SizedBox(width: 8),
                                      Text('Mémoriser', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
                                    ]),
                                    GestureDetector(
                                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                                      child: Text('Oublié ?', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: const Color(0xFF2563EB), fontSize: 13)),
                                    ),
                                  ]
                                ),
                                const SizedBox(height: 32),
                                
                                // Bouton Animé
                                Consumer<AuthProvider>(builder: (_, auth, __) => SizedBox(
                                  width: double.infinity, height: 56,
                                  child: ElevatedButton(
                                    onPressed: auth.isLoading ? null : _handleLogin,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF2563EB),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                      elevation: 0,
                                    ),
                                    child: auth.isLoading
                                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                                        : Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text('SE CONNECTER', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 1.0)),
                                              const SizedBox(width: 8),
                                              const Icon(Icons.arrow_forward_rounded, size: 20)
                                            ],
                                          ),
                                  ),
                                )),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDeco(String label, IconData icon) => InputDecoration(
    labelText: label, 
    labelStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
    prefixIcon: Icon(icon, color: const Color(0xFF94A3B8)),
    filled: true, fillColor: const Color(0xFFF8FAFC), 
    contentPadding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2)),
  );
}
