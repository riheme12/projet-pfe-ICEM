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
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut),
    );
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic),
    );

    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    _pulseCtrl.dispose();
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
          content: Row(children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 10),
            Expanded(child: Text(auth.errorMessage ?? 'Echec de connexion', style: GoogleFonts.inter())),
          ]),
          backgroundColor: AppTheme.errorRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // -- Hero Background Section --
          SizedBox(
            height: screenHeight * 0.38,
            width: double.infinity,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Background image
                Image.asset(
                  'assets/images/bg1.png',
                  fit: BoxFit.cover,
                ),
                // Gradient overlay matching web: from-[#1e1b4b]/80 via-[#1e1b4b]/70 to-[#2563eb]/30
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xCC1E1B4B), // #1e1b4b at 80%
                        Color(0xB31E1B4B), // #1e1b4b at 70%
                        Color(0x4D2563EB), // #2563eb at 30%
                      ],
                    ),
                  ),
                ),
                // Content on hero
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Logo + brand
                        Row(
                          children: [
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: Colors.white.withOpacity(0.4)),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF3B82F6).withOpacity(0.25),
                                    blurRadius: 20,
                                    offset: const Offset(0, 6),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(18),
                                child: Padding(
                                  padding: const EdgeInsets.all(10),
                                  child: Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'ICEM',
                                  style: GoogleFonts.inter(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -1,
                                  ),
                                ),
                                Text(
                                  'QUALITY CONTROL',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: const Color(0xFF93C5FD),
                                    letterSpacing: 4,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Spacer(),
                        // Badge certified
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withOpacity(0.1)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              AnimatedBuilder(
                                animation: _pulseCtrl,
                                builder: (_, __) => Container(
                                  width: 7,
                                  height: 7,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Color.lerp(
                                      const Color(0xFF60A5FA).withOpacity(0.4),
                                      const Color(0xFF60A5FA),
                                      _pulseAnim.value,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SYSTEME CERTIFIE IA',
                                style: GoogleFonts.inter(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  letterSpacing: 2,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Hero title
                        Text(
                          'Controle',
                          style: GoogleFonts.inter(
                            fontSize: 38,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 0.95,
                            letterSpacing: -2,
                          ),
                        ),
                        Text(
                          'Intelligent.',
                          style: GoogleFonts.inter(
                            fontSize: 38,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF60A5FA),
                            height: 0.95,
                            letterSpacing: -2,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Expertise en controle qualite et tracabilite industrielle.',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withOpacity(0.85),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // -- Form Section --
          Positioned(
            top: screenHeight * 0.34,
            left: 0,
            right: 0,
            bottom: 0,
            child: FadeTransition(
              opacity: _fadeAnim,
              child: SlideTransition(
                position: _slideAnim,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F172A).withOpacity(0.06),
                          blurRadius: 40,
                          offset: const Offset(0, 20),
                        ),
                      ],
                      border: Border.all(color: const Color(0xFFEFF6FF), width: 1),
                    ),
                    child: Column(
                      children: [
                        // Top gradient bar (web parity)
                        Container(
                          height: 3,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF3B82F6), Color(0xFF6366F1)],
                            ),
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(32),
                              topRight: Radius.circular(32),
                            ),
                          ),
                        ),

                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Section label
                              Row(
                                children: [
                                  const Icon(Icons.bolt, size: 16, color: Color(0xFF2563EB)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'APPLICATION TECHNICIEN ICEM',
                                    style: GoogleFonts.inter(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      color: const Color(0xFF2563EB),
                                      letterSpacing: 2,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // Title
                              Text(
                                'Connexion',
                                style: GoogleFonts.inter(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF1E1B4B),
                                  letterSpacing: -1.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Authentification securisee au portail ICEM.',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                              const SizedBox(height: 28),

                              // Form
                              Form(
                                key: _formKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Email label
                                    Padding(
                                      padding: const EdgeInsets.only(left: 4, bottom: 8),
                                      child: Text(
                                        'EMAIL PROFESSIONNEL',
                                        style: GoogleFonts.inter(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w900,
                                          color: const Color(0xFF94A3B8),
                                          letterSpacing: 2,
                                        ),
                                      ),
                                    ),
                                    TextFormField(
                                      controller: _usernameCtrl,
                                      keyboardType: TextInputType.emailAddress,
                                      style: GoogleFonts.inter(
                                        color: const Color(0xFF1E1B4B),
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                      ),
                                      decoration: InputDecoration(
                                        hintText: 'nom@icem.tn',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFCBD5E1),
                                          fontWeight: FontWeight.w500,
                                        ),
                                        prefixIcon: const Padding(
                                          padding: EdgeInsets.only(left: 16, right: 12),
                                          child: Icon(Icons.email_outlined, color: Color(0xFF94A3B8), size: 22),
                                        ),
                                        filled: true,
                                        fillColor: const Color(0xFFF8FAFC),
                                        contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(20),
                                          borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 2),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(20),
                                          borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 2),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(20),
                                          borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2),
                                        ),
                                      ),
                                      validator: (v) => (v == null || v.isEmpty) ? 'Champ requis' : null,
                                    ),
                                    const SizedBox(height: 20),

                                    // Password label + forgot
                                    Padding(
                                      padding: const EdgeInsets.only(left: 4, bottom: 8, right: 4),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'MOT DE PASSE',
                                            style: GoogleFonts.inter(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w900,
                                              color: const Color(0xFF94A3B8),
                                              letterSpacing: 2,
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () => Navigator.push(
                                              context,
                                              MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                                            ),
                                            child: Text(
                                              'Oublie ?',
                                              style: GoogleFonts.inter(
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF2563EB),
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    TextFormField(
                                      controller: _passwordCtrl,
                                      obscureText: _obscure,
                                      style: GoogleFonts.inter(
                                        color: const Color(0xFF1E1B4B),
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                      ),
                                      decoration: InputDecoration(
                                        hintText: 'Votre mot de passe',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFCBD5E1),
                                          fontWeight: FontWeight.w500,
                                        ),
                                        prefixIcon: const Padding(
                                          padding: EdgeInsets.only(left: 16, right: 12),
                                          child: Icon(Icons.lock_outline, color: Color(0xFF94A3B8), size: 22),
                                        ),
                                        suffixIcon: Padding(
                                          padding: const EdgeInsets.only(right: 8),
                                          child: IconButton(
                                            icon: Icon(
                                              _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                              color: const Color(0xFF94A3B8),
                                              size: 22,
                                            ),
                                            onPressed: () => setState(() => _obscure = !_obscure),
                                          ),
                                        ),
                                        filled: true,
                                        fillColor: const Color(0xFFF8FAFC),
                                        contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
                                        border: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(20),
                                          borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 2),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(20),
                                          borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 2),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(20),
                                          borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2),
                                        ),
                                      ),
                                      validator: (v) => (v == null || v.isEmpty) ? 'Champ requis' : null,
                                    ),
                                    const SizedBox(height: 16),

                                    // Remember checkbox
                                    Row(
                                      children: [
                                        SizedBox(
                                          height: 22,
                                          width: 22,
                                          child: Checkbox(
                                            value: rememberPassword,
                                            onChanged: (v) => setState(() => rememberPassword = v!),
                                            activeColor: const Color(0xFF2563EB),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Memoriser la session',
                                          style: GoogleFonts.inter(
                                            color: const Color(0xFF64748B),
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 28),

                                    // Login button
                                    Consumer<AuthProvider>(
                                      builder: (_, auth, __) => SizedBox(
                                        width: double.infinity,
                                        height: 56,
                                        child: ElevatedButton(
                                          onPressed: auth.isLoading ? null : _handleLogin,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF2563EB),
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(20),
                                            ),
                                            elevation: 0,
                                            shadowColor: const Color(0xFF2563EB).withOpacity(0.3),
                                          ),
                                          child: auth.isLoading
                                              ? const SizedBox(
                                                  width: 24,
                                                  height: 24,
                                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                                                )
                                              : Row(
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    Text(
                                                      "S'AUTHENTIFIER",
                                                      style: GoogleFonts.inter(
                                                        fontWeight: FontWeight.w900,
                                                        fontSize: 14,
                                                        letterSpacing: 2,
                                                      ),
                                                    ),
                                                    const SizedBox(width: 10),
                                                    const Icon(Icons.bolt, size: 20),
                                                  ],
                                                ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 28),
                              // Footer
                              Center(
                                child: Column(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 3,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFE2E8F0),
                                        borderRadius: BorderRadius.circular(2),
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.language, size: 12, color: Color(0xFFCBD5E1)),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Plateforme Certifiee ICEM  V1.2.0',
                                          style: GoogleFonts.inter(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFFCBD5E1),
                                            letterSpacing: 1.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.verified_user_outlined, size: 12, color: Color(0xFF60A5FA)),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Excellence & Precision',
                                          style: GoogleFonts.inter(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF94A3B8),
                                            letterSpacing: 1,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
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
}
