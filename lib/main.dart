import 'package:flutter/material.dart';
<<<<<<< Updated upstream
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
  
=======
import 'package:firebase_core/firebase_core.dart';
import 'package:projeticem/firebase_options.dart';
import 'package:projeticem/screens/welcome_screen.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

>>>>>>> Stashed changes
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..initialize()),
      ],
      child: const ICEMQualityApp(),
    ),
  );
}

<<<<<<< Updated upstream
/// Widget principal de l'application
=======
>>>>>>> Stashed changes
class ICEMQualityApp extends StatelessWidget {
  const ICEMQualityApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ICEM Quality Control',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
<<<<<<< Updated upstream
      // Page d'accueil dynamique selon l'état d'authentification
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isAuthenticated) {
            return const HomePage();
          }
          return const HomeScreen();
        },
      ),
=======
      home: const WelcomeScreen(),
>>>>>>> Stashed changes
    );
  }
}

