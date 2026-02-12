import 'package:flutter/material.dart';
import 'package:projeticem/models/checklist_item.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Page des checklists post-inspection
class ChecklistPage extends StatefulWidget {
  const ChecklistPage({super.key});

  @override
  State<ChecklistPage> createState() => _ChecklistPageState();
}

class _ChecklistPageState extends State<ChecklistPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  final List<ChecklistItem> _visualItems = [
    ChecklistItem(label: 'État de la gaine extérieure'),
    ChecklistItem(label: 'Qualité des marquages'),
    ChecklistItem(label: 'Aspect général du câble'),
    ChecklistItem(label: 'Absence de déformations'),
    ChecklistItem(label: 'Propreté'),
  ];

  final List<ChecklistItem> _electricalItems = [
    ChecklistItem(label: 'Continuité électrique'),
    ChecklistItem(label: 'Isolation'),
    ChecklistItem(label: 'Résistance'),
    ChecklistItem(label: 'Tests fonctionnels'),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool get _isComplete {
    bool visualComplete = _visualItems.every((item) => item.result != ChecklistResult.pending);
    bool electricalComplete = _electricalItems.every((item) => item.result != ChecklistResult.pending);
    return visualComplete && electricalComplete;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checklists de Contrôle'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Visuelle', icon: Icon(Icons.visibility)),
            Tab(text: 'Électrique', icon: Icon(Icons.flash_on)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildChecklistList(_visualItems),
          _buildChecklistList(_electricalItems),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildChecklistList(List<ChecklistItem> items) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (context, index) => const Divider(),
      itemBuilder: (context, index) {
        final item = items[index];
        return _buildChecklistItem(item);
      },
    );
  }

  Widget _buildChecklistItem(ChecklistItem item) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.label,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildResultButton(item, ChecklistResult.ok, 'OK', Colors.green),
              const SizedBox(width: 8),
              _buildResultButton(item, ChecklistResult.nok, 'NOK', Colors.red),
              const SizedBox(width: 8),
              _buildResultButton(item, ChecklistResult.na, 'N/A', Colors.grey),
            ],
          ),
          if (item.result == ChecklistResult.nok) ...[
            const SizedBox(height: 12),
            TextField(
              decoration: const InputDecoration(
                hintText: 'Ajouter une observation...',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (val) => item.comment = val,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildResultButton(ChecklistItem item, ChecklistResult result, String label, Color color) {
    bool isSelected = item.result == result;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            item.result = result;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? color : Colors.transparent,
            border: Border.all(color: isSelected ? color : Colors.grey.shade400),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: ElevatedButton(
          onPressed: _isComplete ? _submitChecklist : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            disabledBackgroundColor: Colors.grey.shade300,
          ),
          child: const Text('Valider le contrôle', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }

  void _submitChecklist() {
    // Calculer le statut global
    bool everythingOk = _visualItems.every((i) => i.result == ChecklistResult.ok || i.result == ChecklistResult.na) &&
                        _electricalItems.every((i) => i.result == ChecklistResult.ok || i.result == ChecklistResult.na);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Contrôle Terminé'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              everythingOk ? Icons.check_circle : Icons.warning,
              color: everythingOk ? Colors.green : Colors.orange,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              everythingOk 
                ? 'Le câble est conforme aux tests physiques et électriques.' 
                : 'Des non-conformités ont été relevées lors des tests manuels.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Return to inspection/detail
            },
            child: const Text('Fermer'),
          ),
          if (everythingOk)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Return to inspection/detail
                // Simuler la génération de rapport
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Rapport final généré avec succès !')),
                );
              },
              child: const Text('Générer le rapport final'),
            ),
        ],
      ),
    );
  }
}
