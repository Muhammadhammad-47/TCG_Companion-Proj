$shell = New-Object -COMObject Shell.Application
$folder = $shell.Namespace("C:\--UnityProjects--\TCG_Companion-Proj\public\SFX")
$results = @()
foreach ($item in $folder.Items()) {
  $duration = $folder.GetDetailsOf($item, 27)
  $bitrate = $folder.GetDetailsOf($item, 28)
  $results += [PSCustomObject]@{
    Name = $item.Name
    Duration = $duration
    Bitrate = $bitrate
    Size = $item.Size
  }
}
$results | Format-Table -AutoSize

