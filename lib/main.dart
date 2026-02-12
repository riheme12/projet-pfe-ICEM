import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:testflutter/screens/home_screen.dart';
import 'package:testflutter/screens/login_screen.dart';
import 'package:testflutter/theme/theme.dart';
import 'package:testflutter/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider()..initialize(),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Cable Inspection',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF416FDF)),
        ),
        home: const homescreen(),
      ),
    );
  }
}
