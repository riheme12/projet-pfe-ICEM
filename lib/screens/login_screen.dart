import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'home_page.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _rememberMe = true;
  bool _obscure = true;

  // Premium Animations
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _cardSlideAnim;
  late Animation<double> _logoScaleAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _fadeAnim = CurvedAnimation(
      parent: _animCtrl,
      curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
    );

    _cardSlideAnim = Tween<Offset>(
      begin: const Offset(0.0, 0.12),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animCtrl,
      curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic),
    ));

    _logoScaleAnim = Tween<double>(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(
        parent: _animCtrl,
        curve: const Interval(0.0, 0.7, curve: Curves.elasticOut),
      ),
    );

    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.login(
      _emailCtrl.text.trim(),
      _passwordCtrl.text,
      _rememberMe,
    );
    if (!mounted) return;
    if (success) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const HomePage()),
        (_) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  auth.errorMessage ?? 'Echec de connexion',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final heroHeight = screenHeight * 0.40;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // ── Beautiful decorative background spots ──
          Positioned(
            top: screenHeight * 0.45,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF3B82F6).withOpacity(0.04),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            right: -100,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF6366F1).withOpacity(0.03),
              ),
            ),
          ),

          // ── Premium Hero Header (Curved) ──
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: heroHeight + 20,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(40),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    'assets/images/bg1.png',
                    fit: BoxFit.cover,
                  ),
                  // Modern Dark/Blue Gradient overlay
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0xF20F172A), // Slate-900 (95%)
                          Color(0xE61E293B), // Slate-800 (90%)
                          Color(0xCC2563EB), // Blue-600 (80%)
                        ],
                      ),
                    ),
                  ),
                  // Glowing glassmorphic background blur rings
                  Positioned(
                    top: -80,
                    right: -60,
                    child: Container(
                      width: 220,
                      height: 220,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF60A5FA).withOpacity(0.12),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -30,
                    left: -40,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF3B82F6).withOpacity(0.08),
                      ),
                    ),
                  ),

                  // Centered Glowing Logo contents
                  SafeArea(
                    child: Center(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Blue Glow behind logo
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF3B82F6).withOpacity(0.5),
                                  blurRadius: 45,
                                  spreadRadius: 8,
                                ),
                              ],
                            ),
                          ),
                          // Scale Transition for Logo without card background
                          ScaleTransition(
                            scale: _logoScaleAnim,
                            child: Image.asset(
                              'assets/images/logo.png',
                              width: 105,
                              height: 105,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Scrollable Form Section (Overlapping) ──
          Positioned(
            top: heroHeight - 16,
            left: 0,
            right: 0,
            bottom: 0,
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                  // Form Card wrapped in Slide + Fade transitions
                  SlideTransition(
                    position: _cardSlideAnim,
                    child: FadeTransition(
                      opacity: _fadeAnim,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(28),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0F172A).withOpacity(0.07),
                                blurRadius: 40,
                                offset: const Offset(0, 16),
                              ),
                              BoxShadow(
                                color: const Color(0xFF3B82F6).withOpacity(0.03),
                                blurRadius: 64,
                                offset: const Offset(0, 32),
                              ),
                            ],
                            border: Border.all(
                              color: const Color(0xFFE2E8F0).withOpacity(0.8),
                              width: 1.2,
                            ),
                          ),
                          child: Column(
                            children: [
                              // Card Content Body
                              Padding(
                                padding: const EdgeInsets.all(26),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Title with glowing blue circle
                                    Row(
                                      children: [
                                        Container(
                                          width: 44,
                                          height: 44,
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [
                                                Color(0xFF2563EB),
                                                Color(0xFF3B82F6),
                                              ],
                                            ),
                                            borderRadius: BorderRadius.circular(14),
                                            boxShadow: [
                                              BoxShadow(
                                                color: const Color(0xFF2563EB).withOpacity(0.2),
                                                blurRadius: 10,
                                                offset: const Offset(0, 4),
                                              ),
                                            ],
                                          ),
                                          child: const Icon(
                                            Icons.lock_person_rounded,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                        ),
                                        const SizedBox(width: 14),
                                        const Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Connexion',
                                              style: TextStyle(
                                                fontSize: 22,
                                                fontWeight: FontWeight.w900,
                                                color: Color(0xFF0F172A),
                                                letterSpacing: -0.5,
                                              ),
                                            ),
                                            SizedBox(height: 2),
                                            Text(
                                              'Accès sécurisé de l\'opérateur',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: Color(0xFF94A3B8),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 28),

                                    // Login Form
                                    Form(
                                      key: _formKey,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // Email Input
                                          _buildLabel('EMAIL PROFESSIONNEL'),
                                          const SizedBox(height: 8),
                                          TextFormField(
                                            controller: _emailCtrl,
                                            keyboardType: TextInputType.emailAddress,
                                            style: const TextStyle(
                                              color: Color(0xFF1E293B),
                                              fontWeight: FontWeight.w600,
                                              fontSize: 15,
                                            ),
                                            decoration: _inputDecoration(
                                              hint: 'nom@icem.tn',
                                              icon: Icons.mail_outline_rounded,
                                            ),
                                            validator: (v) => (v == null || v.isEmpty)
                                                ? 'Champ requis'
                                                : null,
                                          ),
                                          const SizedBox(height: 20),

                                          _buildLabel('MOT DE PASSE'),
                                          const SizedBox(height: 8),
                                          TextFormField(
                                            controller: _passwordCtrl,
                                            obscureText: _obscure,
                                            style: const TextStyle(
                                              color: Color(0xFF1E293B),
                                              fontWeight: FontWeight.w600,
                                              fontSize: 15,
                                            ),
                                            decoration: _inputDecoration(
                                              hint: 'Saisir votre mot de passe',
                                              icon: Icons.lock_outline_rounded,
                                              suffix: IconButton(
                                                icon: Icon(
                                                  _obscure
                                                      ? Icons.visibility_off_outlined
                                                      : Icons.visibility_outlined,
                                                  color: const Color(0xFF94A3B8),
                                                  size: 20,
                                                ),
                                                onPressed: () => setState(
                                                  () => _obscure = !_obscure,
                                                ),
                                              ),
                                            ),
                                            validator: (v) => (v == null || v.isEmpty)
                                                ? 'Champ requis'
                                                : null,
                                          ),
                                          const SizedBox(height: 18),

                                          // Custom Checkbox
                                          GestureDetector(
                                            onTap: () => setState(
                                              () => _rememberMe = !_rememberMe,
                                            ),
                                            child: MouseRegion(
                                              cursor: SystemMouseCursors.click,
                                              child: Row(
                                                children: [
                                                  AnimatedContainer(
                                                    duration: const Duration(milliseconds: 250),
                                                    width: 22,
                                                    height: 22,
                                                    decoration: BoxDecoration(
                                                      gradient: _rememberMe
                                                          ? const LinearGradient(
                                                              colors: [
                                                                Color(0xFF2563EB),
                                                                Color(0xFF3B82F6),
                                                              ],
                                                            )
                                                          : null,
                                                      color: _rememberMe
                                                          ? null
                                                          : Colors.transparent,
                                                      borderRadius: BorderRadius.circular(7),
                                                      border: _rememberMe
                                                          ? null
                                                          : Border.all(
                                                              color: const Color(0xFFCBD5E1),
                                                              width: 2,
                                                            ),
                                                    ),
                                                    child: _rememberMe
                                                        ? const Icon(
                                                            Icons.check,
                                                            size: 15,
                                                            color: Colors.white,
                                                          )
                                                        : null,
                                                  ),
                                                  const SizedBox(width: 10),
                                                  const Text(
                                                    'Se souvenir de moi',
                                                    style: TextStyle(
                                                      color: Color(0xFF64748B),
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 28),

                                          // Premium Login Button
                                          Consumer<AuthProvider>(
                                            builder: (_, auth, __) => SizedBox(
                                              width: double.infinity,
                                              height: 56,
                                              child: DecoratedBox(
                                                decoration: BoxDecoration(
                                                  gradient: const LinearGradient(
                                                    colors: [
                                                      Color(0xFF1D4ED8),
                                                      Color(0xFF2563EB),
                                                      Color(0xFF3B82F6),
                                                    ],
                                                  ),
                                                  borderRadius: BorderRadius.circular(16),
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: const Color(0xFF2563EB).withOpacity(0.3),
                                                      blurRadius: 16,
                                                      offset: const Offset(0, 6),
                                                    ),
                                                  ],
                                                ),
                                                child: ElevatedButton(
                                                  onPressed: auth.isLoading
                                                      ? null
                                                      : _handleLogin,
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: Colors.transparent,
                                                    shadowColor: Colors.transparent,
                                                    foregroundColor: Colors.white,
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius: BorderRadius.circular(16),
                                                    ),
                                                    elevation: 0,
                                                  ),
                                                  child: auth.isLoading
                                                      ? const SizedBox(
                                                          width: 22,
                                                          height: 22,
                                                          child: CircularProgressIndicator(
                                                            color: Colors.white,
                                                            strokeWidth: 2.5,
                                                          ),
                                                        )
                                                      : const Row(
                                                          mainAxisAlignment: MainAxisAlignment.center,
                                                          children: [
                                                            Text(
                                                              "SE CONNECTER",
                                                              style: TextStyle(
                                                                fontWeight: FontWeight.w900,
                                                                fontSize: 14,
                                                                letterSpacing: 1.5,
                                                              ),
                                                            ),
                                                            SizedBox(width: 8),
                                                            Icon(
                                                              Icons.arrow_forward_rounded,
                                                              size: 20,
                                                            ),
                                                          ],
                                                        ),
                                                ),
                                              ),
                                            ),
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

                  const SizedBox(height: 32),
                  // Footer
                  _buildFooter(),
                  const SizedBox(height: 36),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        Container(
          width: 40,
          height: 3.5,
          decoration: BoxDecoration(
            color: const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 14),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.verified_outlined, size: 14, color: Color(0xFF3B82F6)),
            const SizedBox(width: 6),
            Text(
              'PLATEFORME CERTIFIÉE ICEM  v1.2.0',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF94A3B8),
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'EXCELLENCE & PRÉCISION EN QUALITÉ',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w800,
            color: Color(0xFFCBD5E1),
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 2),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: Color(0xFF94A3B8),
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
    required IconData icon,
    Widget? suffix,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        color: Color(0xFFCBD5E1),
        fontWeight: FontWeight.w500,
        fontSize: 14,
      ),
      prefixIcon: Padding(
        padding: const EdgeInsets.only(left: 14, right: 10),
        child: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
      ),
      suffixIcon: suffix,
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 2),
      ),
    );
  }
}
