
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'

    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBgtxAYFi2nPvLfyqXemw5R9kjflvnjWyg',
    appId: '1:82085295710:web:38ad6ffd7fa7b7545666cf',
    messagingSenderId: '82085295710',
    projectId: 'testflutter-de1f5',
    authDomain: 'testflutter-de1f5.firebaseapp.com',
    storageBucket: 'testflutter-de1f5.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAwea5ILXUsM43-WrP84danlN9krmgVehg',
    appId: '1:82085295710:android:d3500c8b620673ab5666cf',
    messagingSenderId: '82085295710',
    projectId: 'testflutter-de1f5',
    storageBucket: 'testflutter-de1f5.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBm8rVUDls6CUVtXzecmC-nkHY6KEiJJXQ',
    appId: '1:82085295710:ios:71757434409d59cf5666cf',
    messagingSenderId: '82085295710',
    projectId: 'testflutter-de1f5',
    storageBucket: 'testflutter-de1f5.firebasestorage.app',
    iosClientId: '82085295710-6sc6oj0fd05uefhfckkj9mgoeessklkv.apps.googleusercontent.com',
    iosBundleId: 'com.example.testflutter',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyBm8rVUDls6CUVtXzecmC-nkHY6KEiJJXQ',
    appId: '1:82085295710:ios:71757434409d59cf5666cf',
    messagingSenderId: '82085295710',
    projectId: 'testflutter-de1f5',
    storageBucket: 'testflutter-de1f5.firebasestorage.app',
    iosClientId: '82085295710-6sc6oj0fd05uefhfckkj9mgoeessklkv.apps.googleusercontent.com',
    iosBundleId: 'com.example.testflutter',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyBgtxAYFi2nPvLfyqXemw5R9kjflvnjWyg',
    appId: '1:82085295710:web:67904dc150883f5e5666cf',
    messagingSenderId: '82085295710',
    projectId: 'testflutter-de1f5',
    authDomain: 'testflutter-de1f5.firebaseapp.com',
    storageBucket: 'testflutter-de1f5.firebasestorage.app',
  );
}
