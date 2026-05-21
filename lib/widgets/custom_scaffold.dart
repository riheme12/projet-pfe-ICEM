import 'package:flutter/material.dart';

class CustomScaffold extends StatelessWidget {
  const CustomScaffold({super.key, this.child});
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Light gradient background matching the web theme
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF), Color(0xFFF1F5F9)], // slate-50, blue-50, slate-100
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          // Subtle geometric pattern overlay
          Positioned.fill(
            child: Opacity(
              opacity: 0.04,
              child: Image.asset('assets/images/bg1.png', fit: BoxFit.cover),
            ),
          ),
          SafeArea(child: child!),
        ],
      ),
    );
  }
}
