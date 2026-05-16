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
          // Dark gradient background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0A0E1A), Color(0xFF1A2332), Color(0xFF0F2440)],
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
