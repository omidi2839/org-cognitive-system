$ErrorActionPreference = "Stop"
$files = @(
  "api/document-bank-0958.js",
  "api/document-bank.js",
  "api/test-reset.js",
  "api/topic-suggestions-0958.js",
  "api/topic-suggestions.js"
)
foreach ($f in $files) {
  if (Test-Path $f) {
    Remove-Item $f -Force
    Write-Host "Deleted $f"
  }
}
Write-Host "Recovery 0.9.5.8.5 source cleanup completed."
