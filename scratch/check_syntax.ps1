$files = @(
  "src/App.jsx",
  "src/game/kontrola/KontrolaArena.jsx",
  "src/game/kontrola/KontrolaEngine.js",
  "src/game/kontrola/KontrolaDiceRoller.jsx",
  "src/game/kontrola/KontrolaTournamentHub.jsx",
  "src/game/kontrola/vfx/cardVFXRegistry.js",
  "src/game/kontrola/vfx/CardVFXWrapper.jsx",
  "src/services/characterLicenseService.js",
  "src/components/QRScannerModal.jsx",
  "src/components/CharacterUnlockModal.jsx",
  "src/components/AdminCharacterManager.jsx",
  "src/game/components/GameSetup.jsx",
  "src/game/components/CardActionModal.jsx",
  "src/game/components/PlayerCard.jsx",
  "src/game/utils/audio.js",
  "src/pages/GamePage.jsx",
  "src/pages/admin/AdminPage.jsx"
)

foreach ($f in $files) {
  if (Test-Path $f) {
    $content = Get-Content $f -Raw
    $opens = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $closes = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $diff = $opens - $closes
    if ($diff -eq 0) {
      Write-Host "$f : OK (All brackets balanced: $opens)" -ForegroundColor Green
    } else {
      Write-Host "$f : ERROR! Opens=$opens, Closes=$closes, Diff=$diff" -ForegroundColor Red
    }
  } else {
    Write-Host "File not found: $f" -ForegroundColor Yellow
  }
}
