@echo off
:: ═══════════════════════════════════════════════════════════════
:: Zonek Gov Data Pipeline — Run from ANYWHERE in Windows
:: Double-click OR run from any terminal
:: ═══════════════════════════════════════════════════════════════
setlocal

:: Always resolve to Zonek_gov directory regardless of where you are
set "ZONEK_GOV=%~dp0Zonek_gov"

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     ZONEK GOV DATA PIPELINE               ║
echo  ║     Smart run — skips fresh data          ║
echo  ╚═══════════════════════════════════════════╝
echo.

if "%1"=="--force" (
  echo  Running FORCE mode - re-fetching all data...
  node "%ZONEK_GOV%\src\pipeline.js" --force
) else if "%1"=="--daemon" (
  echo  Starting 24/7 daemon mode...
  node "%ZONEK_GOV%\src\pipeline.js" --daemon
) else if "%1"=="" (
  echo  Running smart mode - only fetches stale data...
  node "%ZONEK_GOV%\src\pipeline.js"
) else (
  node "%ZONEK_GOV%\src\pipeline.js" %*
)

echo.
echo  Pipeline finished. Press any key to exit.
pause >nul
endlocal
