import 'package:flutter/material.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/anomaly_detail_page.dart';

/// Page qui liste toutes les anomalies détectées
class AnomaliesListPage extends StatefulWidget {
  const AnomaliesListPage({super.key});

  @override
  State<AnomaliesListPage> createState() => _AnomaliesListPageState();
}

class _AnomaliesListPageState extends State<AnomaliesListPage> {
  final ReportsService _reportsService = ReportsService();
  List<Anomaly> _anomalies = [];
  bool _isLoading = true;
  String _selectedSeverity = 'Tous';
  String _selectedType = 'Tous';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadAnomalies();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim().toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAnomalies() async {
    setState(() => _isLoading = true);
    final anomalies = await _reportsService.getRecentAnomalies(limit: 50);
    setState(() {
      _anomalies = anomalies;
      _isLoading = false;
    });
  }

  List<Anomaly> get _filteredAnomalies {
    return _anomalies.where((a) {
      final matchesSeverity = _selectedSeverity == 'Tous' || a.severity == _selectedSeverity;
      final matchesType = _selectedType == 'Tous' || a.type == _selectedType;
      final matchesSearch = _searchQuery.isEmpty || a.cableId.toLowerCase().contains(_searchQuery);
      return matchesSeverity && matchesType && matchesSearch;
    }).toList();
  }

  List<String> get _availableTypes {
    final types = _anomalies.map((a) => a.type).toSet().toList();
    types.sort();
    return ['Tous', ...types];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestion des Anomalies'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnomalies,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilterSection(),
          _buildTypeFilterSection(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredAnomalies.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filteredAnomalies.length,
                        itemBuilder: (context, index) {
                          final anomaly = _filteredAnomalies[index];
                          return _buildAnomalyCard(anomaly);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Rechercher par code câble...',
          prefixIcon: const Icon(Icons.search_rounded),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded),
                  onPressed: () {
                    _searchController.clear();
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
        ),
      ),
    );
  }

  Widget _buildFilterSection() {
    final severities = ['Tous', 'Mineur', 'Majeur', 'Critique'];
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: severities.length,
        itemBuilder: (context, index) {
          final severity = severities[index];
          final isSelected = _selectedSeverity == severity;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(severity),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) setState(() => _selectedSeverity = severity);
              },
              selectedColor: AppTheme.primaryBlue,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppTheme.textDark,
                fontSize: 12,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTypeFilterSection() {
    final types = _availableTypes;
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: types.length,
        itemBuilder: (context, index) {
          final type = types[index];
          final isSelected = _selectedType == type;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(type),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) setState(() => _selectedType = type);
              },
              selectedColor: AppTheme.secondaryOrange,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppTheme.textDark,
                fontSize: 12,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAnomalyCard(Anomaly anomaly) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AnomalyDetailPage(anomaly: anomaly),
            ),
          ).then((_) => _loadAnomalies());
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _getSeverityColor(anomaly.severity).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.report_problem_rounded,
                  color: _getSeverityColor(anomaly.severity),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      anomaly.type,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Câble: ${anomaly.cableId}',
                      style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Zone: ${anomaly.location ?? "Inconnue"}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textGrey),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Détecté le ${anomaly.detectedAt.day}/${anomaly.detectedAt.month}/${anomaly.detectedAt.year} à ${anomaly.detectedAt.hour}h${anomaly.detectedAt.minute.toString().padLeft(2, '0')}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textLight),
                    ),
                  ],
                ),
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  StatusBadge(status: anomaly.severity, isSmall: true),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${(anomaly.confidence * 100).toStringAsFixed(0)}% IA',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity) {
      case 'Critique': return AppTheme.errorRed;
      case 'Majeur': return AppTheme.secondaryOrange;
      case 'Mineur': return AppTheme.warningAmber;
      default: return AppTheme.textGrey;
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle_outline, size: 64, color: AppTheme.successGreen),
          const SizedBox(height: 16),
          const Text('Aucune anomalie à traiter !', style: TextStyle(fontSize: 18, color: AppTheme.textGrey)),
        ],
      ),
    );
  }
}
