$bytes = [System.IO.File]::ReadAllBytes('C:\Users\ACER\.gemini\antigravity\brain\1b0e8246-ba3d-482a-b94a-2acb4383259b\.user_uploaded\media__1785190912360.pdf')
$rawText = [System.Text.Encoding]::ASCII.GetString($bytes)
$readable = [regex]::Matches($rawText, '[\x20-\x7E]{8,}')
foreach ($match in $readable) {
    Write-Output $match.Value
}
