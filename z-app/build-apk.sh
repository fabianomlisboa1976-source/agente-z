#!/bin/bash

# Script para gerar o APK do Agente Z
# Use: ./build-apk.sh [opção]
#
# Opções:
#   eas     - Usa o EAS Build (serviço cloud, requer conta Expo)
#   local   - Tenta build local (requer Android SDK)
#   help    - Mostra esta ajuda

set -e

PROJECT_DIR="/home/z/my-project/z-app"
cd "$PROJECT_DIR"

echo "╔════════════════════════════════════════╗"
echo "║     Agente Z - Gerador de APK         ║"
echo "╚════════════════════════════════════════╝"
echo ""

case "$1" in
    eas)
        echo "🚀 Iniciando build com EAS..."
        echo ""
        echo "⚠️  Você precisa estar logado no Expo."
        echo "   Se não estiver, execute: npx eas login"
        echo ""
        npx eas build --platform android --profile preview
        ;;
    local)
        echo "🔨 Iniciando build local..."
        echo ""

        # Verificar ANDROID_HOME
        if [ -z "$ANDROID_HOME" ]; then
            echo "❌ Erro: ANDROID_HOME não está definido!"
            echo ""
            echo "Configure o Android SDK:"
            echo "  export ANDROID_HOME=/caminho/para/android-sdk"
            echo "  export PATH=\$PATH:\$ANDROID_HOME/emulator"
            echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
            exit 1
        fi

        echo "✅ ANDROID_HOME: $ANDROID_HOME"
        echo ""

        # Prebuild
        echo "📦 Gerando projeto Android..."
        npx expo prebuild --platform android --clean

        # Build
        echo "🔨 Compilando APK..."
        cd android
        ./gradlew assembleRelease

        # Copiar APK
        APK_PATH="app/build/outputs/apk/release/app-release.apk"
        if [ -f "$APK_PATH" ]; then
            cp "$APK_PATH" "../agente-z.apk"
            echo ""
            echo "✅ APK gerado com sucesso!"
            echo "📄 Local: $PROJECT_DIR/agente-z.apk"
        else
            echo "❌ Erro ao gerar APK"
            exit 1
        fi
        ;;
    help|--help|-h)
        echo "Uso: ./build-apk.sh [opção]"
        echo ""
        echo "Opções:"
        echo "  eas     Usa o EAS Build (serviço cloud do Expo)"
        echo "          Requer: conta Expo gratuita"
        echo ""
        echo "  local   Build local no computador"
        echo "          Requer: Android SDK configurado"
        echo ""
        echo "  help    Mostra esta ajuda"
        echo ""
        echo "Exemplos:"
        echo "  ./build-apk.sh eas"
        echo "  ./build-apk.sh local"
        ;;
    *)
        echo "Por favor, escolha uma opção:"
        echo ""
        echo "  1) EAS Build (recomendado - serviço cloud gratuito)"
        echo "  2) Build Local (requer Android SDK)"
        echo "  3) Ver instruções completas"
        echo ""
        read -p "Digite a opção [1-3]: " choice

        case $choice in
            1)
                $0 eas
                ;;
            2)
                $0 local
                ;;
            3)
                cat README.md
                ;;
            *)
                echo "Opção inválida"
                exit 1
                ;;
        esac
        ;;
esac
