@echo off
powershell -Command "$bytes = New-Object byte[] 32; $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); $key = [System.Convert]::ToBase64String($bytes); Write-Host $key; $rng.Dispose()"
