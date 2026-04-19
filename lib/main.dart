import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:projeticem/firebase_options.dart';
import 'package:projeticem/screens/home_screen.dart';
import 'package:projeticem/screens/home_page.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/providers/auth_provider.dart';

/// Fonction main() : point de départ de l'application
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialisation de Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..initialize()),
      ],
      child: const ICEMQualityApp(),
    ),
  );
}

/// Widget principal de l'application
class ICEMQualityApp extends StatelessWidget {
  const ICEMQualityApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ICEM Quality Control',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      // Page d'accueil dynamique selon l'état d'authentification
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isAuthenticated) {
            return const HomePage();
          }
          return const HomeScreen();
        },
      ),
    );
  }
}

