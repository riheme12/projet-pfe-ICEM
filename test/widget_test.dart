import 'package:flutter_test/flutter_test.dart';
import 'package:projeticem/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ICEMQualityApp());

    // Verify that the app launches
    expect(find.text('ICEM Quality Control'), findsOneWidget);
  });
}
