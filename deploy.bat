@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Orion 2 - Deploy para GitHub
echo ==========================================
echo.

echo [1/6] Limpando arquivos desnecessarios...
if exist debug.js del debug.js
if exist test_gemini.ts del test_gemini.ts
if exist test_keys.ts del test_keys.ts
if exist test_models.ts del test_models.ts
echo Arquivos de teste removidos.

echo.
echo [2/6] Gerando Build do Frontend (dist/)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha no build do frontend. O deploy foi cancelado.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/6] Gerando Build do Servidor (server-dist.js)...
call npm run build:server
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Falha no build do servidor. Continuando com o ficheiro anterior.
)

echo.
echo [4/6] Preparando arquivos para Git...
git rm --cached .env >nul 2>&1
git add .

echo.
set /p commit_msg="Digite a mensagem do commit (ou pressione Enter para padrao): "
if "!commit_msg!"=="" set commit_msg="Update: Deploy automatico Orion 2"

echo.
echo [5/6] Criando o Commit...
git commit -m "!commit_msg!"
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Nada novo para commitar ou erro no commit.
)

echo.
echo [6/6] Enviando para o GitHub (Push)...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Falha no push para 'main'. Tentando 'master'...
    git push origin master
)

echo.
echo ==========================================
echo    DEPLOY CONCLUIDO COM SUCESSO!
echo ==========================================
echo.
pause
