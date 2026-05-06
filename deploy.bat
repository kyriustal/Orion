@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Orion 2 - Deploy para GitHub
echo ==========================================
echo.

echo [1/5] Limpando arquivos desnecessarios...
if exist debug.js del debug.js
if exist test_gemini.ts del test_gemini.ts
if exist test_keys.ts del test_keys.ts
if exist test_models.ts del test_models.ts
echo Arquivos de teste removidos.

echo.
echo [2/5] Gerando a Build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha no build. O deploy foi cancelado.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/5] Preparando arquivos para Git...
git rm --cached .env >nul 2>&1
git add .

echo.
set /p commit_msg="Digite a mensagem do commit (ou pressione Enter para padrao): "
if "!commit_msg!"=="" set commit_msg="Update: Deploy automatico Orion 2"

echo.
echo [4/5] Criando o Commit...
git commit -m "!commit_msg!"
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Nada novo para commitar ou erro no commit.
)

echo.
echo [5/5] Enviando para o GitHub (Push)...
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
