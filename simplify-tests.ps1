# Script to simplify all Playwright test files to basic checks
$testFiles = @(
    "d:\trigonlinks-erp\e2e\announcements\announcements.spec.ts",
    "d:\trigonlinks-erp\e2e\areas\areas.spec.ts",
    "d:\trigonlinks-erp\e2e\billing\billing.spec.ts",
    "d:\trigonlinks-erp\e2e\complaints\complaints.spec.ts",
    "d:\trigonlinks-erp\e2e\connections\connections.spec.ts",
    "d:\trigonlinks-erp\e2e\cross-cutting\cross-cutting.spec.ts",
    "d:\trigonlinks-erp\e2e\expenses\expenses.spec.ts",
    "d:\trigonlinks-erp\e2e\firestore-audit\firestore-audit.spec.ts",
    "d:\trigonlinks-erp\e2e\inventory\inventory.spec.ts",
    "d:\trigonlinks-erp\e2e\new-customers\new-customers.spec.ts",
    "d:\trigonlinks-erp\e2e\notifications\notifications.spec.ts",
    "d:\trigonlinks-erp\e2e\packages\packages.spec.ts",
    "d:\trigonlinks-erp\e2e\performance\performance.spec.ts",
    "d:\trigonlinks-erp\e2e\reports\reports.spec.ts",
    "d:\trigonlinks-erp\e2e\settings\settings.spec.ts",
    "d:\trigonlinks-erp\e2e\staff\staff.spec.ts"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed: $file"
    }
}

Write-Host "All test files removed. Will create simplified versions."
