import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Barre de recherche — Dark Premium
class SearchBarWidget extends StatefulWidget {
  final String hintText;
  final ValueChanged<String> onChanged;
  final TextEditingController? controller;

  const SearchBarWidget({super.key, required this.hintText, required this.onChanged, this.controller});
  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  late TextEditingController _controller;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _controller.addListener(_onTextChanged);
  }

  @override
  void dispose() { if (widget.controller == null) _controller.dispose(); super.dispose(); }

  void _onTextChanged() { setState(() => _hasText = _controller.text.isNotEmpty); widget.onChanged(_controller.text); }
  void _clearText() { _controller.clear(); widget.onChanged(''); }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: TextField(
        controller: _controller,
        style: GoogleFonts.inter(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: widget.hintText,
          hintStyle: GoogleFonts.inter(color: AppTheme.textLight, fontSize: 14),
          prefixIcon: Icon(Icons.search, color: AppTheme.accentCyan),
          suffixIcon: _hasText ? IconButton(icon: Icon(Icons.clear, color: AppTheme.textGrey), onPressed: _clearText) : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}
