@echo off
REM Frontend Test Runner Script for Windows
REM Usage: run-tests.bat [option]

echo ==================================
echo Frontend Test Suite Runner
echo ==================================

REM Check if node_modules exists
if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    call npm install
)

REM Parse command line arguments
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=all

if "%COMMAND%"=="all" goto all
if "%COMMAND%"=="watch" goto watch
if "%COMMAND%"=="run" goto run
if "%COMMAND%"=="ci" goto run
if "%COMMAND%"=="coverage" goto coverage
if "%COMMAND%"=="cov" goto coverage
if "%COMMAND%"=="ui" goto ui
if "%COMMAND%"=="components" goto components
if "%COMMAND%"=="pages" goto pages
if "%COMMAND%"=="integration" goto integration
if "%COMMAND%"=="patient" goto patient
if "%COMMAND%"=="doctor" goto doctor
if "%COMMAND%"=="auth" goto auth
if "%COMMAND%"=="help" goto help
if "%COMMAND%"=="-h" goto help
if "%COMMAND%"=="--help" goto help

echo Unknown command: %COMMAND%
echo Run 'run-tests.bat help' for usage information
exit /b 1

:all
echo Running all tests...
call npm test
goto end

:watch
echo Running tests in watch mode...
call npm test
goto end

:run
echo Running tests once (CI mode)...
call npm run test:run
goto end

:coverage
echo Running tests with coverage...
call npm run test:coverage
echo Opening coverage report...
start coverage\index.html
goto end

:ui
echo Starting Vitest UI...
call npm run test:ui
goto end

:components
echo Running component tests...
call npm test -- __tests__/components/
goto end

:pages
echo Running page tests...
call npm test -- __tests__/pages/
goto end

:integration
echo Running integration tests...
call npm test -- __tests__/integration/
goto end

:patient
echo Running patient-related tests...
call npm test -- patient
goto end

:doctor
echo Running doctor-related tests...
call npm test -- doctor
goto end

:auth
echo Running authentication tests...
call npm test -- -t "auth"
goto end

:help
echo Usage: run-tests.bat [option]
echo.
echo Options:
echo   all, (default)    - Run all tests in watch mode
echo   watch            - Run tests in watch mode
echo   run, ci          - Run tests once (for CI)
echo   coverage, cov    - Run with coverage report
echo   ui               - Start Vitest UI
echo   components       - Run component tests only
echo   pages            - Run page tests only
echo   integration      - Run integration tests only
echo   patient          - Run patient-related tests
echo   doctor           - Run doctor-related tests
echo   auth             - Run authentication tests
echo   help             - Show this help message
echo.
echo Examples:
echo   run-tests.bat
echo   run-tests.bat coverage
echo   run-tests.bat patient
goto end

:end
echo ==================================
echo Done!
