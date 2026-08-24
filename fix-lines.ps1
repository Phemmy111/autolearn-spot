$filePath = "C:\Users\ACER\Desktop\autolearn-spot\lib\alex\artifact-generation\workflow-manager-v2.ts"
$lines = Get-Content $filePath -Encoding UTF8

# Find and remove the duplicate lines after line 494
$newLines = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    # Skip lines 496-515 (0-indexed 495-514) that are duplicates
    if ($i -ge 495 -and $i -le 514) {
        continue
    }
    $newLines += $line
}

$newLines | Set-Content $filePath -Encoding UTF8
Write-Host "Removed duplicate lines 496-515"
