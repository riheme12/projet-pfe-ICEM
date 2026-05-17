import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

class ImgBBService {
  // TODO: Remplacer par la clé API ImgBB de l'utilisateur
  static const String _imgBBKey = 'cc5f5821379a3c9ad1eaa066381662d0'; 

  static Future<String?> uploadImage(File imageFile) async {
    try {
      if (_imgBBKey.isEmpty || _imgBBKey == 'VOTRE_CLE_API_IMGBB_ICI') {
        print("ATTENTION: Clé API ImgBB non configurée.");
        return null;
      }

      List<int> imageBytes = await imageFile.readAsBytes();
      String base64Image = base64Encode(imageBytes);

      var uri = Uri.parse('https://api.imgbb.com/1/upload');
      var request = http.MultipartRequest('POST', uri)
        ..fields['key'] = _imgBBKey
        ..fields['image'] = base64Image;

      var response = await request.send();

      if (response.statusCode == 200) {
        var responseData = await response.stream.bytesToString();
        var jsonResponse = jsonDecode(responseData);
        return jsonResponse['data']['url']; 
      } else {
        print("Erreur ImgBB : Code ${response.statusCode}");
        return null;
      }
    } catch (e) {
      print("Erreur lors de l'envoi de l'image ImgBB : $e");
      return null;
    }
  }
}
