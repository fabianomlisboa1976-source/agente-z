#!/bin/bash

# Script para compilar o APK do Agente Autônomo

echo "======================================"
echo "  BUILD DO AGENTE AUTÔNOMO APK"
echo "======================================"
echo ""

# Verificar se o Android SDK está configurado
if [ -z "$ANDROID_SDK_ROOT" ] && [ -z "$ANDROID_HOME" ]; then
    echo "AVISO: ANDROID_SDK_ROOT ou ANDROID_HOME não configurado"
    echo "Tentando usar caminho padrão..."
    export ANDROID_SDK_ROOT=/opt/android-sdk
    export ANDROID_HOME=/opt/android-sdk
fi

# Verificar Java
if ! command -v java &> /dev/null; then
    echo "ERRO: Java não encontrado. Instale o JDK 17 ou superior."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
echo "Java version: $JAVA_VERSION"

# Dar permissão ao gradlew
chmod +x ./gradlew 2>/dev/null || true

echo ""
echo "Limpando build anterior..."
./gradlew clean

echo ""
echo "Compilando projeto..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "  BUILD CONCLUÍDO COM SUCESSO!"
    echo "======================================"
    echo ""
    echo "APK gerado em:"
    echo "  app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "Para instalar no dispositivo:"
    echo "  adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
else
    echo ""
    echo "======================================"
    echo "  ERRO NA COMPILAÇÃO!"
    echo "======================================"
    echo ""
    echo "Verifique os erros acima."
    exit 1
fi
