@echo off
echo ==========================================
echo    Orion 2 - Auto Build e Deploy
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
echo [2/4] Adicionando arquivos ao Git...
git add .

echo.
echo [3/4] Criando o Commit...
git commit -m "Build e correcoes de IA para deploy na Hostinger"

echo.
echo [4/4] Enviando para o GitHub (Push)...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Falha no push para 'main'. Tentando 'master'...
    git push origin master
)

echo.
echo ==========================================
echo    CONCLUIDO COM SUCESSO!
echo ==========================================
echo.
pause
