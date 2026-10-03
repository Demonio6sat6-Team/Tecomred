$urls = @(
  "https://github.com/Bearsampp/module-mysql/releases/download/2025.11.23/bearsampp-mysql-8.0.44-2025.11.23.7z"
)
$out = "$env:USERPROFILE\Desktop\mysql-server.7z"
foreach ($u in $urls) {
  try {
    Write-Output "Downloading: $u"
    Invoke-WebRequest -Uri $u -OutFile "$out.part" -UseBasicParsing -TimeoutSec 1800 -MaximumRedirection 5
    $size = (Get-Item "$out.part").Length
    if ($size -gt 80MB) { Move-Item "$out.part" $out -Force; Write-Output "SUCCESS size=$size"; break }
    else { Write-Output "Too small ($size), trying next" }
  } catch {
    Write-Output "FAIL: $u -- $($_.Exception.Message)"
  }
}
