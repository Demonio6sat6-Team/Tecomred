$out = "C:\Users\Sat\Desktop\mysql-server.7z"
$part = "$out.part"
$url = "https://github.com/Bearsampp/module-mysql/releases/download/2025.11.23/bearsampp-mysql-8.0.44-2025.11.23.7z"
for ($i = 1; $i -le 30; $i++) {
  Write-Output "Attempt $i at $(Get-Date -Format HH:mm:ss)"
  & "C:\Windows\System32\curl.exe" -L -C - --retry 10 --retry-delay 2 --connect-timeout 20 --speed-time 30 --speed-limit 10000 -o $part $url 2>&1 | Select-Object -Last 2
  $s = (Get-Item $part -ErrorAction SilentlyContinue).Length
  Write-Output "Size now: $s"
  if ($s -ge 116521666) { Move-Item $part $out -Force; Write-Output "DOWNLOAD COMPLETE"; break }
  Start-Sleep 2
}
