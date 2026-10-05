# =============================================================================
#  WADAAGE MOBILITY - PLAY STORE RELEASE BUILDER (Android AAB + APK)
# =============================================================================
#  Produces signed release artifacts for BOTH apps:
#
#    build_output/Wadaage_Rider_Release.apk     (sideload / tester APK)
#    build_output/Wadaage_Rider_Release.aab     (GOOGLE PLAY upload file)
#    build_output/Wadaage_Driver_Release.apk
#    build_output/Wadaage_Driver_Release.aab    (GOOGLE PLAY upload file)
#
#  Requires:
#    - node_modules installed            (npm install --ignore-scripts)
#    - build_keys/ keystores generated   (.\generate_upload_keys.ps1)
#
#  Usage:
#     .\build_release.ps1              # both apps
#     .\build_release.ps1 -Target rider
#     .\build_release.ps1 -Target driver
# =============================================================================

[CmdletBinding()]
param(
    [ValidateSet("rider", "driver", "both")]
    [string]$Target = "both",

    [switch]$SkipWeb,   # reuse the existing dist/ bundle (native-only changes)
    [switch]$SkipClean  # incremental Gradle build
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $root "build_output"
$androidDir = Join-Path $root "android"      # the only complete Capacitor Android project
$workTmp = Join-Path $root ".buildtmp"

function Step($msg) { Write-Host "[BUILD] " -NoNewline -ForegroundColor Yellow; Write-Host $msg -ForegroundColor White }
function Ok($msg)   { Write-Host "   OK  " -NoNewline -ForegroundColor Green;  Write-Host $msg -ForegroundColor Gray }

# --- Environment ------------------------------------------------------------
# Capacitor 7 compiles against Java 21, so a JDK 21 must be used (not JDK 17).
# javac -version writes to stdout (java -version writes to stderr, which PS 5.1
# would treat as a fatal NativeCommandError).
function Get-JdkMajor {
    param([string]$JdkDir)
    $javac = Join-Path $JdkDir "bin\javac.exe"
    if (-not (Test-Path $javac)) { return 0 }
    $out = & $javac -version 2>&1 | Out-String
    if ($out -match 'javac\s+(\d+)') { return [int]$Matches[1] }
    return 0
}

function Resolve-Jdk21 {
    if ($env:JAVA_HOME -and (Get-JdkMajor $env:JAVA_HOME) -ge 21) { return $env:JAVA_HOME }
    $candidates = @(
        "C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot",
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\Microsoft\jdk-21.0.0.35-hotspot"
    )
    foreach ($c in $candidates) {
        if ((Get-JdkMajor $c) -ge 21) { return $c }
    }
    # Last resort: any Adoptium jdk-21* folder
    Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'jdk-21*' } | ForEach-Object {
            if ((Get-JdkMajor $_.FullName) -ge 21) { return $_.FullName }
        }
    return $null
}

$jdk21 = Resolve-Jdk21
if (-not $jdk21) {
    Write-Host "ERROR: JDK 21 not found. Capacitor 7 requires Java 21 to compile." -ForegroundColor Red
    Write-Host "Install Temurin JDK 21 or Android Studio, then re-run." -ForegroundColor Yellow
    exit 1
}
$env:JAVA_HOME = $jdk21
Write-Host "Using JAVA_HOME = $jdk21 (Java $(Get-JdkMajor $jdk21))" -ForegroundColor Gray

if (-not $env:ANDROID_HOME -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
New-Item -ItemType Directory -Force -Path $workTmp, $outDir | Out-Null
# Keep temp inside the project so esbuild / Gradle agree on one temp location
$env:TMP = $workTmp; $env:TEMP = $workTmp

# local.properties tells Gradle where the SDK lives
Set-Content -Path (Join-Path $androidDir "local.properties") `
    -Value ("sdk.dir=" + ($env:ANDROID_HOME -replace '\\', '\\')) -Encoding ASCII

$gradlew = Join-Path $androidDir "gradlew.bat"

function Invoke-Gradle {
    param([string[]]$Tasks)
    Push-Location $androidDir
    try {
        & $gradlew @Tasks --no-daemon
        if ($LASTEXITCODE -ne 0) { throw "Gradle failed with exit code $LASTEXITCODE" }
    } finally { Pop-Location }
}

function Publish-Artifact {
    param([string]$Source, [string]$Name)
    if (-not (Test-Path $Source)) { throw "Expected artifact missing: $Source" }
    $dest = Join-Path $outDir $Name
    Copy-Item $Source $dest -Force
    $mb = [math]::Round((Get-Item $dest).Length / 1MB, 2)
    Ok ("{0}  ({1} MB)" -f $Name, $mb)
}

function Build-App {
    param(
        [string]$Key,          # rider | driver
        [string]$ConfigFile,   # capacitor-<key>.config.json
        [string]$SourceProject,# android-rider | android-driver
        [string]$AppLabel
    )

    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "  BUILDING $AppLabel" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Cyan

    # 1. Web bundle (VITE_APP_MODE decides rider vs driver entry)
    if (-not $script:SkipWeb) {
        Step "Compiling web bundle for $Key ..."
        $env:VITE_APP_MODE = $Key
        Push-Location $root
        try {
            & npm run "build:$Key"
            if ($LASTEXITCODE -ne 0) { throw "Vite build failed for $Key" }
        } finally { Pop-Location }
        Ok "web bundle built"
    } else {
        Ok "reusing existing web bundle (-SkipWeb)"
    }

    # 2. Capacitor config for this flavour
    Step "Applying $ConfigFile ..."
    Copy-Item (Join-Path $root $ConfigFile) (Join-Path $root "capacitor.config.json") -Force
    Ok "capacitor.config.json set to $(($ConfigFile -replace 'capacitor-','' -replace '.config.json',''))"

    # 3. Sync web assets + plugins into the Android project
    Step "Capacitor sync android ..."
    Push-Location $root
    try {
        & node "$root\node_modules\@capacitor\cli\bin\capacitor" sync android
        if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }
    } finally { Pop-Location }
    Ok "android project synced"

    # 4. Overlay this flavour's native config (appId, label, permissions, signing)
    Step "Applying $Key native configuration ..."
    Copy-Item (Join-Path $root "$SourceProject\app\build.gradle")       (Join-Path $androidDir "app\build.gradle") -Force
    Copy-Item (Join-Path $root "$SourceProject\app\src\main\AndroidManifest.xml") (Join-Path $androidDir "app\src\main\AndroidManifest.xml") -Force
    Copy-Item (Join-Path $root "$SourceProject\app\src\main\res\values\strings.xml") (Join-Path $androidDir "app\src\main\res\values\strings.xml") -Force
    if (Test-Path (Join-Path $root "$SourceProject\keystore.properties")) {
        Copy-Item (Join-Path $root "$SourceProject\keystore.properties") (Join-Path $androidDir "keystore.properties") -Force
    } else {
        throw "Missing keystore.properties for $Key - run .\generate_upload_keys.ps1 first"
    }
    # MainActivity (and any extra native classes) live in the flavour's own package folder.
    # Recurse so a flavour can ship several Java files, and clear the other flavour's
    # package first so a stale class can never leak into this build.
    $pkgDir = Join-Path $androidDir "app\src\main\java\com\wadaage\$Key"
    $otherPkg = Join-Path $androidDir "app\src\main\java\com\wadaage\$(if ($Key -eq 'rider') {'driver'} else {'rider'})"
    Remove-Item $otherPkg -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $pkgDir | Out-Null
    Get-ChildItem (Join-Path $root "$SourceProject\app\src\main\java") -Recurse -File -Filter *.java | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $pkgDir $_.Name) -Force
    }

    # Sanity-check the final manifest: the driver app must declare its foreground
    # service, and neither app may reference the other flavour's classes.
    $finalManifest = Join-Path $androidDir "app\src\main\AndroidManifest.xml"
    $manifestText = Get-Content $finalManifest -Raw
    $javaFiles = Get-ChildItem $pkgDir -File | ForEach-Object { $_.BaseName }
    if ($Key -eq 'driver') {
        if ($manifestText -notmatch 'LiveLocationService') {
            throw "Driver manifest is missing the LiveLocationService declaration - the taximeter would pause when the screen locks."
        }
        if (($javaFiles -notcontains 'LiveLocationService') -or ($javaFiles -notcontains 'LiveLocationPlugin')) {
            throw "Driver native sources missing (need LiveLocationService.java and LiveLocationPlugin.java)."
        }
    } else {
        if ($manifestText -match 'LiveLocationService') {
            throw "Rider manifest must not declare the driver-only LiveLocationService."
        }
    }
    Ok ("native config + signing applied ({0} java file(s): {1})" -f $javaFiles.Count, ($javaFiles -join ', '))

    # 5. Gradle: debug APK, release APK, and the Play Store AAB
    Step "Gradle assembleDebug + assembleRelease + bundleRelease ..."
    $gradleTasks = @()
    if (-not $script:SkipClean) { $gradleTasks += "clean" }
    $gradleTasks += @("assembleDebug", "assembleRelease", "bundleRelease")
    Invoke-Gradle $gradleTasks
    Ok "gradle finished"

    # 6. Publish artifacts
    Step "Publishing $Key artifacts ..."
    $title = if ($Key -eq "rider") { "Rider" } else { "Driver" }
    Publish-Artifact (Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk")            ("Wadaage_{0}_Debug.apk" -f $title)
    Publish-Artifact (Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk")        ("Wadaage_{0}_Release.apk" -f $title)
    Publish-Artifact (Join-Path $androidDir "app\build\outputs\bundle\release\app-release.aab")     ("Wadaage_{0}_Release.aab" -f $title)
}

# --- Run --------------------------------------------------------------------
if ($Target -eq "rider" -or $Target -eq "both") {
    Build-App -Key "rider" -ConfigFile "capacitor-rider.config.json" `
              -SourceProject "android-rider" -AppLabel "WADAAGE TAXI (Rider / Passenger)"
}
if ($Target -eq "driver" -or $Target -eq "both") {
    Build-App -Key "driver" -ConfigFile "capacitor-driver.config.json" `
              -SourceProject "android-driver" -AppLabel "WADAAGE DRIVER (Driver Partner)"
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "  RELEASE BUILD COMPLETE" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Get-ChildItem $outDir -File | Sort-Object Name | ForEach-Object {
    Write-Host ("  {0,-34} {1,8} MB" -f $_.Name, [math]::Round($_.Length / 1MB, 2)) -ForegroundColor White
}
Write-Host ""
Write-Host "  Google Play upload file  -> the .aab" -ForegroundColor Yellow
Write-Host "  Direct install / testers -> the Release .apk" -ForegroundColor Yellow
Write-Host ""
