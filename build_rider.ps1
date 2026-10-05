<# Quick script to build Rider APK in PowerShell #>
$PSScript = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$PSScript\build_apks.ps1" -Target rider
