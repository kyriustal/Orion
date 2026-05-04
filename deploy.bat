@echo off
echo ==========================================
echo    Orion 2 - Auto Build e Deploy (v2)
echo ==========================================
echo.

echo [1/4] Gerando a Build (npm run build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha no build. Verifique os erros acima.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Garantindo seguranca (Ignorando .env)...
git rm --cached .env >nul 2>&1
git add .

echo.
echo [3/4] Criando o Commit...
git commit -m "Deploy Orion 2 - Peak Functionality Restoration"
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Sem alteracoes para commitar ou erro no commit.
)

echo.
echo [4/4] Enviando para o GitHub (Push)...
echo Tentando enviar para a branch 'main'...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Falha no push para 'main'. Tentando 'master'...
    git push origin master
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERRO CRITICO] O GitHub bloqueou o envio ou voce nao esta autenticado.
        echo DICA: Se o erro for "Secret detected", voce precisa remover chaves do .env ou do historico.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo.
echo ==========================================
echo    CONCLUIDO COM SUCESSO!
echo ==========================================
echo.
pause

