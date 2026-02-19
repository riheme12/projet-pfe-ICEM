import 'package:flutter/material.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/widgets/order_card.dart';
import 'package:projeticem/widgets/search_bar_widget.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/order_detail_page.dart';

/// Page liste des ordres de fabrication
/// 
/// Affiche tous les ordres avec recherche et filtres
class OrdersListPage extends StatefulWidget {
  const OrdersListPage({super.key});

  @override
  State<OrdersListPage> createState() => _OrdersListPageState();
}

class _OrdersListPageState extends State<OrdersListPage> {
  final OrdersService _ordersService = OrdersService();
  List<manufacturingOrder> _allOrders = [];
  List<manufacturingOrder> _filteredOrders = [];
  bool _isLoading = true;
  String _selectedFilter = 'Tous';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    final orders = await _ordersService.getAllOrders();
    setState(() {
      _allOrders = orders;
      _filteredOrders = orders;
      _isLoading = false;
    });
  }

  void _applyFilters() {
    setState(() {
      _filteredOrders = _allOrders.where((order) {
        // Filtre par statut
        final matchesStatus = _selectedFilter == 'Tous' || 
            order.status.toLowerCase() == _selectedFilter.toLowerCase();
        
        // Filtre par recherche
        final matchesSearch = _searchQuery.isEmpty ||
            order.reference.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            order.Gipros.toLowerCase().contains(_searchQuery.toLowerCase());
        
        return matchesStatus && matchesSearch;
      }).toList();
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
    _applyFilters();
  }

  void _onFilterSelected(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
    _applyFilters();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ordres de fabrication'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: Column(
        children: [
          // Barre de recherche
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SearchBarWidget(
              hintText: 'Rechercher un ordre...',
              onChanged: _onSearchChanged,
            ),
          ),

          // Filtres
          _buildFilterChips(),

          // Liste des ordres
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredOrders.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadOrders,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _filteredOrders.length,
                          itemBuilder: (context, index) {
                            final order = _filteredOrders[index];
                            return OrderCard(
                              order: order,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => OrderDetailPage(order: order),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  /// Filtres rapides
  Widget _buildFilterChips() {
    final filters = ['Tous', 'En cours', 'Terminé', 'En attente'];
    
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = _selectedFilter == filter;
          
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(filter),
              selected: isSelected,
              onSelected: (selected) => _onFilterSelected(filter),
              backgroundColor: AppTheme.backgroundLight,
              selectedColor: AppTheme.primaryBlue,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppTheme.textDark,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          );
        },
      ),
    );
  }

  /// État vide
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inbox_outlined,
            size: 80,
            color: AppTheme.textLight,
          ),
          const SizedBox(height: 16),
          Text(
            'Aucun ordre trouvé',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppTheme.textGrey,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Essayez de modifier vos filtres',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textLight,
                ),
          ),
        ],
      ),
    );
  }
}
