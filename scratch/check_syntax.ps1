$files = @(
    "src/components/CharacterUnlockModal.jsx",
    "src/components/ProfileSettingsModal.jsx",
    "src/components/StoreModal.jsx",
    "src/game/components/BattleArena.jsx",
    "src/game/components/ReviveOfferModal.jsx",
    "src/game/components/RelationshipSelectModal.jsx",
    "src/game/components/EmpireMandateBanner.jsx",
    "src/game/components/MasterCommandModal.jsx",
    "src/game/components/CardActionModal.jsx",
    "src/game/components/DiceRollerModal.jsx",
    "src/game/components/GameSetup.jsx",
    "src/game/components/ReserveEnergyModal.jsx",
    "src/game/data/cards.js",
    "src/game/data/characters.js",
    "src/game/data/rulesKnowledge.js",
    "src/game/kontrola/KontrolaArena.jsx",
    "src/game/kontrola/KontrolaDiceRoller.jsx",
    "src/game/kontrola/KontrolaEngine.js",
    "src/game/kontrola/vfx/ArenaEnvironmentCanvas.jsx",
    "src/game/kontrola/vfx/FullScreenCinematics.jsx",
    "src/game/utils/gameEngine.js",
    "src/pages/GamePage.jsx",
    "src/services/characterLicenseService.js",
    "src/styles/card-effects.css"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $content = [System.IO.File]::ReadAllText((Resolve-Path $f))
        $p = ($content.ToCharArray() -match '\(').Count - ($content.ToCharArray() -match '\)').Count
        $b = ($content.ToCharArray() -match '\[').Count - ($content.ToCharArray() -match '\]').Count
        $c = ($content.ToCharArray() -match '\{').Count - ($content.ToCharArray() -match '\}').Count
        Write-Host "$f => Parens: $p, Brackets: $b, Braces: $c"
    } else {
        Write-Host "File NOT found: $f"
    }
}
