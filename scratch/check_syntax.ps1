$files = @(
    "src/game/components/BattleArena.jsx",
    "src/game/components/DiceRollerModal.jsx",
    "src/game/kontrola/KontrolaArena.jsx",
    "src/game/kontrola/KontrolaDiceRoller.jsx",
    "src/game/kontrola/KontrolaEngine.js",
    "src/game/kontrola/vfx/ArenaEnvironmentCanvas.jsx",
    "src/game/kontrola/vfx/FullScreenCinematics.jsx",
    "src/game/utils/gameEngine.js",
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
