import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/widgets/order_card.dart';
import 'package:projeticem/widgets/search_bar_widget.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/order_detail_page.dart';

/// Page liste des ordres de fabrication — Design Unifié
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
  void initState() { super.initState(); _loadOrders(); }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    final orders = await _ordersService.getAllOrders();
    setState(() { _allOrders = orders; _filteredOrders = orders; _isLoading = false; });
  }

  void _applyFilters() {
    setState(() {
      _filteredOrders = _allOrders.where((order) {
        final matchesStatus = _selectedFilter == 'Tous' || order.status.toLowerCase() == _selectedFilter.toLowerCase();
        final matchesSearch = _searchQuery.isEmpty ||
            order.reference.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            order.gipros.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            order.numeroOF.toLowerCase().contains(_searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      }).toList();
    });
  }

  void _onSearchChanged(String q) { _searchQuery = q; _applyFilters(); }
  void _onFilterSelected(String f) { _selectedFilter = f; _applyFilters(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 150,
            pinned: true,
            backgroundColor: AppTheme.primaryNavy,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF312E81), Color(0xFF6366F1)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                ),
                child: SafeArea(child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 50),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.assignment_rounded, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Ordres de Fabrication', style: GoogleFonts.inter(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                        Text('${_allOrders.length} ordres actifs', style: GoogleFonts.inter(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w600)),
                      ]),
                    ]),
                  ]),
                )),
              ),
            ),
          ),
        ],
        body: Column(children: [
          // Search
          Container(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SearchBarWidget(hintText: 'Rechercher un ordre...', onChanged: _onSearchChanged),
          ),
          // Filter chips
          _buildFilterChips(),
          // Orders list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.accentBlue))
                : _filteredOrders.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadOrders,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                          itemCount: _filteredOrders.length,
                          itemBuilder: (_, i) => OrderCard(
                            order: _filteredOrders[i],
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailPage(order: _filteredOrders[i]))).then((_) => _loadOrders()),
                          ),
                        ),
                      ),
          ),
        ]),
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = ['Tous', 'En cours', 'Terminé', 'En attente'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(children: filters.map((f) {
        final sel = _selectedFilter == f;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => _onFilterSelected(f),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                gradient: sel ? const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]) : null,
                color: sel ? null : Colors.white,
                borderRadius: BorderRadius.circular(25),
                border: sel ? null : Border.all(color: AppTheme.borderGris),
                boxShadow: sel ? [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))] : null,
              ),
              child: Text(f, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: sel ? Colors.white : AppTheme.textGrey)),
            ),
          ),
        );
      }).toList()),
    );
  }

  Widget _buildEmptyState() => Center(child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(color: const Color(0xFF6366F1).withOpacity(0.08), shape: BoxShape.circle),
        child: const Icon(Icons.inbox_outlined, size: 48, color: Color(0xFF6366F1)),
      ),
      const SizedBox(height: 16),
      Text('Aucun ordre trouvé', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
      const SizedBox(height: 4),
      Text('Essayez de modifier vos filtres', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textGrey)),
    ],
  ));
}
