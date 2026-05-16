import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/screens/signup_screen.dart';
import 'package:projeticem/theme/app_theme.dart';
import '../widgets/custom_scaffold.dart';
import 'login_screen.dart';

/// Écran d'accueil — Dark Premium
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(children: [
          const Spacer(flex: 2),
          // Logo & Title
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: AppTheme.accentCyan.withOpacity(0.05), shape: BoxShape.circle),
            child: Image.asset('assets/images/logo.png', height: 100, fit: BoxFit.contain),
          ),
          const SizedBox(height: 40),
          Text('ICEM', style: GoogleFonts.inter(fontSize: 48, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 4)),
          Text('QUALITY CONTROL', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.accentCyan, letterSpacing: 6)),
          const SizedBox(height: 24),
          Text(
            'Système intelligent de surveillance et d\'inspection de câblage industriel.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 15, color: AppTheme.textGrey, height: 1.6),
          ),
          const Spacer(flex: 3),
          // Action Buttons
          SizedBox(width: double.infinity, height: 56, child: ElevatedButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentBlue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
            child: Text('SE CONNECTER', style: GoogleFonts.inter(fontWeight: FontWeight.w800, letterSpacing: 1.2, color: Colors.white)),
          )),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, height: 56, child: OutlinedButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SignupScreen())),
            style: OutlinedButton.styleFrom(side: BorderSide(color: AppTheme.darkBorder, width: 2), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
            child: Text('CRÉER UN COMPTE', style: GoogleFonts.inter(fontWeight: FontWeight.w800, letterSpacing: 1.2, color: Colors.white)),
          )),
          const SizedBox(height: 40),
        ]),
      ),
    );
  }
}
