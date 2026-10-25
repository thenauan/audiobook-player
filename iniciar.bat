@echo off
chcp 65001 >nul
title Audiobook Player
color 0B

:: Garante que o terminal execute no diretório do projeto
cd /d "%~dp0"

echo ===================================================
echo.
echo          AUDIOBOOK PLAYER - INICIALIZADOR
echo.
echo ===================================================
echo.

:: 1. Verifica se o Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] O Node.js não foi encontrado no sistema!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Instala dependências apenas se a pasta node_modules não existir
if not exist "node_modules\" (
    echo [1/2] Instalando dependências (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo [ERRO] Falha ao instalar as dependências do npm.
        echo.
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependências verificadas.
)

echo.
echo [2/2] Iniciando o servidor e abrindo o navegador...
echo.
echo O navegador será aberto automaticamente na porta do Vite.
echo Pressione CTRL+C para encerrar o aplicativo.
echo ===================================================
echo.

:: Inicia o Vite e abre o navegador automaticamente
call npm run dev -- --open

if %errorlevel% neq 0 (
    echo.
    echo O servidor foi encerrado ou encontrou um erro.
)

pause
