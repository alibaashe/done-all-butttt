<#
================================================================================
  WADAAGE MOBILITY - 1-CLICK POWERSHELL APK BUILD SCRIPT (BOTH APKS)
  Builds:
    1. Wadaage Rider (Passenger) APK -> build_output/Wadaage_Rider_Debug.apk
    2. Wadaage Driver Partner APK    -> build_output/Wadaage_Driver_Debug.apk
================================================================================
  Usage in Windows PowerShell:
    .\build_both_apks.ps1
================================================================================
#>

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$PSScriptRoot\build_apks.ps1" -Target both
