import 'package:flutter/material.dart';
<<<<<<< Updated upstream
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/screens/home_page.dart';
import 'package:projeticem/screens/login_screen.dart';
import 'package:projeticem/widgets/custom_scaffold.dart';
import 'package:provider/provider.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/models/user.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen>
    with SingleTickerProviderStateMixin {
  final _formSignupKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  UserRole _selectedRole = UserRole.operator;
  bool agreePersonalData = true;
  bool _obscurePassword = true;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOut),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    _usernameController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    if (_formSignupKey.currentState!.validate() && agreePersonalData) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      final success = await authProvider.signup(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        fullName: _fullNameController.text.trim(),
        username: _usernameController.text.trim(),
        role: _selectedRole,
        phone: _phoneController.text.trim().isEmpty
            ? null
            : _phoneController.text.trim(),
      );

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Compte créé avec succès! Bienvenue.'),
            backgroundColor: const Color(0xFF00C853),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (e) => const HomePage()),
          (route) => false,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.errorMessage ?? 'L\'inscription a échoué'),
            backgroundColor: const Color(0xFFFF1744),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } else if (!agreePersonalData) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Veuillez accepter le traitement des données'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    bool obscure = false,
    Widget? suffixIcon,
  }) {
    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      obscureText: obscure,
      style: GoogleFonts.inter(fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: const Color(0xFF4A90D9), size: 22),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE8ECF0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE8ECF0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF4A90D9), width: 2),
        ),
      ),
    );
  }
=======

import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_scaffold.dart';
import '../models/user.dart';
import 'login_screen.dart';


 class SignupScreen extends StatefulWidget{

   const SignupScreen({super.key});
   @override
  State<SignupScreen>  createState()=> _SignupScreenState();
  }
  class _SignupScreenState extends State<SignupScreen>{
    final _formSignupKey = GlobalKey<FormState>();
    final _fullNameController = TextEditingController();
    final _emailController = TextEditingController();
    final _passwordController = TextEditingController();
    UserRole _selectedRole = UserRole.operator;
    bool agreePersonalData = true;

    @override
    void dispose() {
      _fullNameController.dispose();
      _emailController.dispose();
      _passwordController.dispose();
      super.dispose();
    }

    Future<void> _handleSignup() async {
      if (_formSignupKey.currentState!.validate() && agreePersonalData) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        
        final success = await authProvider.signup(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          fullName: _fullNameController.text.trim(),
          role: _selectedRole,
        );

        if (!mounted) return;

        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account created successfully! Please sign in.'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (e) => const LoginScreen()),

          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(authProvider.errorMessage ?? 'Signup failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } else if (!agreePersonalData) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please agree to the processing of personal data'),
          ),
        );
      }
    }
>>>>>>> Stashed changes

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
<<<<<<< Updated upstream
      child: Column(
        children: [
          const Expanded(flex: 1, child: SizedBox(height: 10)),
          Expanded(
            flex: 8,
            child: FadeTransition(
              opacity: _fadeAnim,
              child: SlideTransition(
                position: _slideAnim,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(28.0, 36.0, 28.0, 20.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(40.0),
                      topRight: Radius.circular(40.0),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 20,
                        offset: const Offset(0, -5),
                      ),
                    ],
                  ),
                  child: SingleChildScrollView(
                    child: Form(
                      key: _formSignupKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Logo ICEM
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF1E3A5F), Color(0xFF4A90D9)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF1E3A5F).withValues(alpha: 0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Image.asset(
                              'assets/images/logo.png',
                              height: 52,
                              fit: BoxFit.contain,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Créer un compte',
                            style: GoogleFonts.inter(
                              fontSize: 26.0,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF1A2138),
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0F4F8),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.factory_outlined, size: 13, color: Color(0xFF4A90D9)),
                                const SizedBox(width: 5),
                                Text(
                                  'Rejoignez l\'équipe ICEM',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF6B7280),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 28),

                          // Username
                          _buildField(
                            controller: _usernameController,
                            label: 'Nom d\'utilisateur',
                            hint: 'ex: ahmed_ba',
                            icon: Icons.alternate_email,
                            validator: (v) => v == null || v.isEmpty
                                ? 'Veuillez entrer un nom d\'utilisateur'
                                : null,
                          ),
                          const SizedBox(height: 16),

                          // Full name
                          _buildField(
                            controller: _fullNameController,
                            label: 'Nom complet',
                            hint: 'ex: Ahmed Ben Ali',
                            icon: Icons.badge_outlined,
                            validator: (v) => v == null || v.isEmpty
                                ? 'Veuillez entrer votre nom complet'
                                : null,
                          ),
                          const SizedBox(height: 16),

                          // Email
                          _buildField(
                            controller: _emailController,
                            label: 'Email',
                            hint: 'votre@email.com',
                            icon: Icons.email_outlined,
                            keyboardType: TextInputType.emailAddress,
                            validator: (v) => v == null || v.isEmpty
                                ? 'Veuillez entrer votre email'
                                : null,
                          ),
                          const SizedBox(height: 16),

                          // Phone (optional)
                          _buildField(
                            controller: _phoneController,
                            label: 'Téléphone (optionnel)',
                            hint: '+216 20 123 456',
                            icon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                          ),
                          const SizedBox(height: 16),

                          // Password
                          _buildField(
                            controller: _passwordController,
                            label: 'Mot de passe',
                            hint: '••••••••',
                            icon: Icons.lock_outline,
                            obscure: _obscurePassword,
                            validator: (v) => v == null || v.isEmpty
                                ? 'Veuillez entrer un mot de passe'
                                : (v.length < 6
                                    ? 'Minimum 6 caractères'
                                    : null),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                color: const Color(0xFF9CA3AF),
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Role dropdown
                          DropdownButtonFormField<UserRole>(
                            value: _selectedRole,
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              color: const Color(0xFF1A2138),
                            ),
                            decoration: InputDecoration(
                              labelText: 'Rôle',
                              prefixIcon: const Icon(Icons.work_outline,
                                  color: Color(0xFF4A90D9), size: 22),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: const BorderSide(
                                    color: Color(0xFFE8ECF0)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                                borderSide: const BorderSide(
                                    color: Color(0xFFE8ECF0)),
                              ),
                            ),
                            items: UserRole.values.map((UserRole role) {
                              return DropdownMenuItem<UserRole>(
                                value: role,
                                child: Text(role.name),
                              );
                            }).toList(),
                            onChanged: (UserRole? newValue) {
                              setState(() {
                                _selectedRole = newValue!;
                              });
                            },
                          ),
                          const SizedBox(height: 20),

                          // Agreement checkbox
                          Row(
                            children: [
                              SizedBox(
                                height: 24,
                                width: 24,
                                child: Checkbox(
                                  value: agreePersonalData,
                                  onChanged: (bool? value) {
                                    setState(() {
                                      agreePersonalData = value!;
                                    });
                                  },
                                  activeColor: const Color(0xFF1E3A5F),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'J\'accepte le traitement des ',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF6B7280),
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                'données',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF1E3A5F),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Signup button with gradient
                          Consumer<AuthProvider>(
                            builder: (context, authProvider, child) {
                              return SizedBox(
                                width: double.infinity,
                                height: 54,
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    gradient: authProvider.isLoading
                                        ? null
                                        : const LinearGradient(
                                            colors: [
                                              Color(0xFF1E3A5F),
                                              Color(0xFF4A90D9)
                                            ],
                                          ),
                                    color: authProvider.isLoading
                                        ? const Color(0xFFBBDEFB)
                                        : null,
                                    borderRadius: BorderRadius.circular(14),
                                    boxShadow: authProvider.isLoading
                                        ? null
                                        : [
                                            BoxShadow(
                                              color: const Color(0xFF1E3A5F)
                                                  .withValues(alpha: 0.3),
                                              blurRadius: 12,
                                              offset: const Offset(0, 4),
                                            ),
                                          ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: authProvider.isLoading
                                        ? null
                                        : _handleSignup,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(14),
                                      ),
                                    ),
                                    child: authProvider.isLoading
                                        ? const SizedBox(
                                            height: 22,
                                            width: 22,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.5,
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                      Colors.white),
                                            ),
                                          )
                                        : Text(
                                            'Créer mon compte',
                                            style: GoogleFonts.inter(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white,
                                            ),
                                          ),
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 24),

                          // Already have account
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Déjà un compte? ',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF6B7280),
                                  fontSize: 14,
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (e) => const LoginScreen(),
                                    ),
                                  );
                                },
                                child: Text(
                                  'Se connecter',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF1E3A5F),
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20.0),
                        ],
                      ),
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
=======
    child: Column(
    children: [
    const Expanded(
    flex: 1,
    child: SizedBox(
    height: 10,
    ),
    ),
    Expanded(
    flex: 7,
    child: Container(
    padding: const EdgeInsets.fromLTRB(25.0, 50.0, 25.0, 20.0),
    decoration: const BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.only(
    topLeft: Radius.circular(40.0),
    topRight: Radius.circular(40.0),
    ),
    ),
    child: SingleChildScrollView(
    // get started form
    child: Form(
    key: _formSignupKey,
    child: Column(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
    // get started text
    Text(
    'Get Started',
    style: TextStyle(
    fontSize: 30.0,
    fontWeight: FontWeight.w900,
    color: AppTheme.primaryBlue,

    ),
    ),
    const SizedBox(
    height: 40.0,
    ),
    // full name
    TextFormField(
    controller: _fullNameController,
    validator: (value) {
    if (value == null || value.isEmpty) {
    return 'Please enter Full name';
    }
    return null;
    },
    decoration: InputDecoration(
    label: const Text('Full Name'),
    hintText: 'Enter Full Name',
    hintStyle: const TextStyle(
    color: Colors.black26,
    ),
    border: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    ),
    ),
    const SizedBox(
    height: 25.0,
    ),
    // email
    TextFormField(
    controller: _emailController,
    validator: (value) {
    if (value == null || value.isEmpty) {
    return 'Please enter Email';
    }
    return null;
    },
    decoration: InputDecoration(
    label: const Text('Email'),
    hintText: 'Enter Email',
    hintStyle: const TextStyle(
    color: Colors.black26,
    ),
    border: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    ),
    ),
    const SizedBox(
    height: 25.0,
    ),
    // password
    TextFormField(
    controller: _passwordController,
    obscureText: true,
    obscuringCharacter: '*',
    validator: (value) {
    if (value == null || value.isEmpty) {
    return 'Please enter Password';
    }
    return null;
    },
    decoration: InputDecoration(
    label: const Text('Password'),
    hintText: 'Enter Password',
    hintStyle: const TextStyle(
    color: Colors.black26,
    ),
    border: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(
    color: Colors.black12, // Default border color
    ),
    borderRadius: BorderRadius.circular(10),
    ),
    ),
    ),
    const SizedBox(
    height: 25.0,
    ),
    // Role Selection
    DropdownButtonFormField<UserRole>(
      value: _selectedRole,
      decoration: InputDecoration(
        label: const Text('Role'),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      items: UserRole.values.map((UserRole role) {
        return DropdownMenuItem<UserRole>(
          value: role,
          child: Text(role.name),
        );
      }).toList(),
      onChanged: (UserRole? newValue) {
        setState(() {
          _selectedRole = newValue!;
        });
      },
    ),
    const SizedBox(
    height: 25.0,
    ),
    // i agree to the processing
    Row(
    children: [
    Checkbox(
    value: agreePersonalData,
    onChanged: (bool? value) {
    setState(() {
    agreePersonalData = value!;
    });
    },
    activeColor: AppTheme.primaryBlue,

    ),
    const Text(
    'I agree to the processing of ',
    style: TextStyle(
    color: Colors.black45,
    ),
    ),
    Text(
    'Personal data',
    style: TextStyle(
    fontWeight: FontWeight.bold,
    color: AppTheme.primaryBlue,

    ),
    ),
    ],
    ),
    const SizedBox(
    height: 25.0,
    ),
    // signup button
    Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: authProvider.isLoading ? null : _handleSignup,
            child: authProvider.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Sign up'),
          ),
        );
      },
    ),
    const SizedBox(
    height: 30.0,
    ),
    // sign up divider
    Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
    Expanded(
    child: Divider(
    thickness: 0.7,
    color: Colors.grey.withValues(alpha: 0.5),
    ),
    ),
    const Padding(
    padding: EdgeInsets.symmetric(
    vertical: 0,
    horizontal: 10,
    ),
    child: Text(
    'Sign up with',
    style: TextStyle(
    color: Colors.black45,
    ),
    ),
    ),
    Expanded(
    child: Divider(
    thickness: 0.7,
    color: Colors.grey.withValues(alpha: 0.5),
    ),
    ),
    ],
    ),
    const SizedBox(
    height: 30.0,
    ),
    // sign up social media logo
    const SizedBox(
    height: 25.0,
    ),
    // already have an account
    Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
    const Text(
    'Already have an account? ',
    style: TextStyle(
    color: Colors.black45,
    ),
    ),
    GestureDetector(
    onTap: () {
    Navigator.push(
    context,
    MaterialPageRoute(
    builder: (e) => const LoginScreen(),

    ),
    );
    },
    child: Text(
    'Sign in',
    style: TextStyle(
    fontWeight: FontWeight.bold,
    color: AppTheme.primaryBlue,

    ),
    ),
    ),
    ],
    ),
    const SizedBox(
    height: 20.0,
    ),
    ],
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

>>>>>>> Stashed changes
