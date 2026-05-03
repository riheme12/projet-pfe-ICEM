import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_theme.dart';

class InspectionDetailsPage extends StatelessWidget {
  final Map<String, dynamic> inspection;

  const InspectionDetailsPage({super.key, required this.inspection});

  @override
  Widget build(BuildContext context) {
    final bool isConform = inspection['statut_global'] == 'CONFORME';
    final List<dynamic> checklist = inspection['checklist'] ?? [];

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Inspection #${inspection['numeroSerie']}', 
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 18)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isConform ? Colors.green[600] : Colors.red[600],
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    isConform ? Icons.check_circle_outline : Icons.error_outline,
                    color: Colors.white,
                    size: 64,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isConform ? 'CÂBLE CONFORME' : 'CÂBLE NON CONFORME',
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Inspection terminée le ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
                    style: GoogleFonts.poppins(color: Colors.white70),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Info Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('Informations Générales'),
                  _buildInfoCard([
                    _buildInfoRow('N° de Série', inspection['numeroSerie'] ?? 'N/A'),
                    _buildInfoRow('Technicien', inspection['technicienNom'] ?? 'Sana M.'),
                    _buildInfoRow('Durée', '${inspection['dureeInspection'] ?? 0} sec'),
                  ]),

                  const SizedBox(height: 32),
                  _buildSectionTitle('Points de Contrôle IA'),
                  
                  // Checklist List
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: checklist.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final item = checklist[index];
                      return _buildChecklistItem(context, item);
                    },
                  ),
                  
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title,
        style: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.blueGrey[900],
        ),
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.poppins(color: Colors.grey[600])),
          Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
        ],
      ),
    );
  }

  Widget _buildChecklistItem(BuildContext context, Map<String, dynamic> item) {
    final bool hasDefect = item['statut'] == 'defaut';
    final double confidence = (item['scoreIA'] ?? 0.0) * 100;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: hasDefect ? Colors.red[100]! : Colors.green[100]!),
      ),
      child: Column(
        children: [
          // Image de l'anomalie (Utilisation de imageUrl ou photoUrl)
          if (item['imageUrl'] != null || item['photoUrl'] != null)
            GestureDetector(
              onTap: () => _showFullScreenImage(context, item['imageUrl'] ?? item['photoUrl']),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: CachedNetworkImage(
                  imageUrl: item['imageUrl'] ?? item['photoUrl'],
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(color: Colors.grey[200], child: const Center(child: CircularProgressIndicator())),
                  errorWidget: (context, url, error) => const Icon(Icons.broken_image),
                ),
              ),
            ),
          
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: hasDefect ? Colors.red[50] : Colors.green[50],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    hasDefect ? Icons.close : Icons.check,
                    color: hasDefect ? Colors.red : Colors.green,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['type'] ?? item['composant'] ?? 'Câble / Composant',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        hasDefect ? (item['codeDefaut'] ?? item['defaut'] ?? 'Défaut détecté') : 'Conforme',
                        style: GoogleFonts.poppins(
                          color: hasDefect ? Colors.red[700] : Colors.green[700],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Confiance',
                      style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey),
                    ),
                    Text(
                      '${confidence.toStringAsFixed(1)}%',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.blue),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showFullScreenImage(BuildContext context, String url) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (context) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, iconTheme: const IconThemeData(color: Colors.white)),
        body: Center(
          child: InteractiveViewer(
            child: CachedNetworkImage(imageUrl: url),
          ),
        ),
      ),
    ));
  }
}
