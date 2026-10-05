# =============================================================================
#  WADAAGE MOBILITY - PLAY STORE UPLOAD KEYSTORE GENERATOR
# =============================================================================
#  Creates the two upload keystores Google Play requires (one per app) and
#  writes keystore.properties next to each Android project so Gradle signs
#  release builds / AABs automatically.
#
#  RUN ONCE. THEN BACK UP the whole build_keys folder somewhere safe
#  (password manager / encrypted drive / cloud vault).
#
#  If you lose these files you can never publish an update to the same
#  Play Store listing again.
#
#  Usage:
#     .\generate_upload_keys.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$keyDir = Join-Path $root "build_keys"
$sheet = Join-Path $keyDir "KEYSTORE_CREDENTIALS_DO_NOT_COMMIT.txt"

function New-StrongPassword {
    param([int]$Length = 24)
    # Unambiguous character set (no 0/O/1/l/I) so it is easy to retype
    $chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%^*()-_=+"
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $out = ""
    for ($i = 0; $i -lt $Length; $i++) { $out += $chars[$bytes[$i] % $chars.Length] }
    return $out
}

if (-not $env:JAVA_HOME) {
    Write-Host "ERROR: JAVA_HOME is not set. Set it to your JDK 17 folder first." -ForegroundColor Red
    exit 1
}
$keytool = Join-Path $env:JAVA_HOME "bin\keytool.exe"
if (-not (Test-Path $keytool)) {
    Write-Host "ERROR: keytool.exe not found at $keytool" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $keyDir | Out-Null

$apps = @(
    @{ Key = "rider";  Project = "android-rider";  Alias = "wadaage-rider";  Cn = "Wadaage Taxi";   AppId = "com.wadaage.rider" },
    @{ Key = "driver"; Project = "android-driver"; Alias = "wadaage-driver"; Cn = "Wadaage Driver"; AppId = "com.wadaage.driver" }
)

# Credentials sheet is appended to as each keystore succeeds, so a failure
# half way through never loses an already-generated password.
if (-not (Test-Path $sheet)) {
    @(
        "WADAAGE MOBILITY - ANDROID UPLOAD KEYSTORE CREDENTIALS",
        "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "",
        "!!! KEEP THIS FILE PRIVATE AND BACK IT UP !!!",
        "Google Play uses this signing key to identify your app forever.",
        "If you lose it you cannot publish updates to the same listing.",
        "Never commit this file or the .keystore files to Git.",
        "",
        "Play Console > your app > Test and release > App integrity:",
        "  enable 'Play App Signing' so Google stores the real app signing key",
        "  and this keystore is only your UPLOAD key.",
        ""
    ) | Set-Content -Path $sheet -Encoding UTF8
}

$created = 0

foreach ($app in $apps) {
    $storeFile = Join-Path $keyDir "wadaage_$($app.Key)_upload.keystore"
    $propsFile = Join-Path $root "$($app.Project)\keystore.properties"

    if (Test-Path $storeFile) {
        Write-Host "SKIP: $storeFile already exists (not overwriting)." -ForegroundColor Yellow
        continue
    }

    $password = New-StrongPassword 24
    Write-Host ""
    Write-Host "Generating upload keystore for $($app.Cn) [$($app.AppId)] ..." -ForegroundColor Cyan

    $keytoolArgs = @(
        "-genkeypair", "-noprompt",
        "-keystore", $storeFile,
        "-alias", $app.Alias,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10950",
        "-storetype", "PKCS12",
        "-storepass", $password,
        "-keypass", $password,
        "-dname", "CN=$($app.Cn), OU=Mobile, O=Wadaage Mobility, L=Hargeisa, ST=Maroodi Jeex, C=SO"
    )

    # Use .NET Process so keytool's informational stderr never looks like a
    # PowerShell terminating error, and so we can read the real exit code.
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $keytool
    $psi.Arguments = ($keytoolArgs | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join " "
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    $exitCode = $proc.ExitCode

    if ($exitCode -ne 0 -or -not (Test-Path $storeFile)) {
        Write-Host "ERROR: keystore creation failed for $($app.Key) (keytool exit $exitCode)" -ForegroundColor Red
        Write-Host $stdout -ForegroundColor DarkGray
        Write-Host $stderr -ForegroundColor DarkGray
        exit 1
    }

    # Gradle reads these values to sign release builds / AABs.
    # NOTE: only the secrets live here. The keystore PATH is resolved inside
    # build.gradle, because Windows backslashes inside a .properties file are
    # treated as escape sequences (\U, \b, \f ...) and would corrupt the path.
    @(
        "storePassword=$password"
        "keyAlias=$($app.Alias)"
        "keyPassword=$password"
    ) | Set-Content -Path $propsFile -Encoding ASCII

    # Append the credentials immediately so nothing is ever lost
    @(
        "--------------------------------------------------------------------"
        "App              : $($app.Cn)"
        "Application ID   : $($app.AppId)"
        "Keystore file    : $storeFile"
        "Key alias        : $($app.Alias)"
        "Store password   : $password"
        "Key password     : $password"
        ""
    ) | Add-Content -Path $sheet -Encoding UTF8

    Write-Host "  keystore : $storeFile" -ForegroundColor Green
    Write-Host "  alias    : $($app.Alias)" -ForegroundColor Green
    Write-Host "  props    : $propsFile" -ForegroundColor Green
    $created++
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "  UPLOAD KEYSTORES READY ($created created)" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host " Credentials sheet: $sheet" -ForegroundColor Yellow
Write-Host ""
Write-Host " NEXT STEPS" -ForegroundColor Cyan
Write-Host " 1. Back up the build_keys folder somewhere safe RIGHT NOW." -ForegroundColor White
Write-Host " 2. Print the signing fingerprints you need for Google Maps / Firebase:" -ForegroundColor White
foreach ($app in $apps) {
    $storeFile = Join-Path $keyDir "wadaage_$($app.Key)_upload.keystore"
    if (Test-Path $storeFile) {
        Write-Host "      & `"$keytool`" -list -v -keystore `"$storeFile`" -alias $($app.Alias)" -ForegroundColor DarkGray
    }
}
Write-Host ""
