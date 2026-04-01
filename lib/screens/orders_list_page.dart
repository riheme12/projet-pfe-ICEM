import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/widgets/order_card.dart';
import 'package:projeticem/widgets/search_bar_widget.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/order_detail_page.dart';

/// Page liste des ordres de fabrication
class OrdersListPage extends StatefulWidget {
  const OrdersListPage({super.key});

  @override
  State<OrdersListPage> createState() => _OrdersListPageState();
}

class _OrdersListPageState extends State<OrdersListPage> {
  final OrdersService _ordersService = OrdersService();
  List<ManufacturingOrder> _allOrders = [];
  List<ManufacturingOrder> _filteredOrders = [];
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
        final matchesStatus = _selectedFilter == 'Tous' ||
            order.status.toLowerCase() == _selectedFilter.toLowerCase();
        final matchesSearch = _searchQuery.isEmpty ||
            order.reference
                .toLowerCase()
                .contains(_searchQuery.toLowerCase()) ||
            order.Gipros.toLowerCase().contains(_searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      }).toList();
    });
  }

  void _onSearchChanged(String query) {
    setState(() => _searchQuery = query);
    _applyFilters();
  }

  void _onFilterSelected(String filter) {
    setState(() => _selectedFilter = filter);
    _applyFilters();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      // ✅ Fixed: explicit blue AppBar so title is visible
      appBar: AppBar(
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Ordres de fabrication',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search + filter area
          Container(
            color: AppTheme.primaryBlue,
            padding:
                const EdgeInsets.only(left: 16, right: 16, bottom: 16),
            child: SearchBarWidget(
              hintText: 'Rechercher un ordre...',
              onChanged: _onSearchChanged,
            ),
          ),

          // Filter chips row
          Container(
            color: Colors.white,
            child: Column(
              children: [
                _buildFilterChips(),
                const Divider(height: 1),
              ],
            ),
          ),

          // Order list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.primaryBlue,
                    ),
                  )
                : _filteredOrders.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadOrders,
                        color: AppTheme.primaryBlue,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                          itemCount: _filteredOrders.length,
                          itemBuilder: (context, index) {
                            final order = _filteredOrders[index];
                            return OrderCard(
                              order: order,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        OrderDetailPage(order: order),
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

  Widget _buildFilterChips() {
    final filters = ['Tous', 'En cours', 'Terminé', 'En attente'];

    return SizedBox(
      height: 52,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = _selectedFilter == filter;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              child: FilterChip(
                label: Text(
                  filter,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: isSelected ? Colors.white : AppTheme.textDark,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
                ),
                selected: isSelected,
                onSelected: (selected) => _onFilterSelected(filter),
                backgroundColor: AppTheme.backgroundLight,
                selectedColor: AppTheme.primaryBlue,
                checkmarkColor: Colors.white,
                side: BorderSide(
                  color: isSelected
                      ? AppTheme.primaryBlue
                      : AppTheme.dividerGrey,
                ),
                showCheckmark: false,
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.accentBlue.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.inbox_outlined,
              size: 56,
              color: AppTheme.accentBlue.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Aucun ordre trouvé',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Essayez de modifier vos filtres de recherche',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppTheme.textGrey,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () {
              setState(() {
                _selectedFilter = 'Tous';
                _searchQuery = '';
              });
              _applyFilters();
            },
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Réinitialiser les filtres'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primaryBlue,
              side: const BorderSide(color: AppTheme.primaryBlue),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
