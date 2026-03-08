param([string]$TargetFile)

if (-not $TargetFile -or -not (Test-Path $TargetFile)) { exit 0 }

$content = Get-Content -Path $TargetFile -Raw
if ($content -match '@SuppressWarnings') { exit 0 }

$old = [char]9 + 'public void finalize ()'
$new = [char]9 + '@SuppressWarnings("removal")' + [char]13 + [char]10 + [char]9 + 'public void finalize ()'
$content = $content.Replace($old, $new)
Set-Content -Path $TargetFile -Value $content -NoNewline
