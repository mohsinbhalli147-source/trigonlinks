import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:trigonlinks_customer_app/main.dart';

void main() {
  testWidgets('App boots to login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const TrigonLinksApp());
    await tester.pump(const Duration(seconds: 1));
    expect(find.textContaining('TrigonLinks'), findsWidgets);
    expect(find.text('Login'), findsOneWidget);
  });
}
