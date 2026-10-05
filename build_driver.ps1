<# Quick script to build Driver APK in PowerShell #>
$PSScript = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$PSScript\build_apks.ps1" -Target driver
