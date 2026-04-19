import 'package:flutter/material.dart';

class CustomScaffold extends StatelessWidget {
  const CustomScaffold({super.key, this.child});
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Background image
          Image.asset(
            'assets/images/bg1.png',
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          ),
          // Rich gradient overlay: dark top → medium mid → light bottom for card contrast
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  const Color(0xFF1E3A5F).withValues(alpha: 0.88),
                  const Color(0xFF1E3A5F).withValues(alpha: 0.55),
                  const Color(0xFF1E3A5F).withValues(alpha: 0.15),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.25, 0.55, 0.75],
              ),
            ),
          ),
          SafeArea(child: child!),
        ],
      ),
    );
  }
}
