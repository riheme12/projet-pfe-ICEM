import 'package:flutter/material.dart';

class customscaffold extends StatelessWidget{
  const customscaffold({super.key,this.child});
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
      ),
      extendBodyBehindAppBar: true,
      body:Stack(
      children: [
      Image.asset('assets/images/bg1.png',
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
    ),
    SafeArea(child: child!,
    )


    ],
    ),
    );
  }

}