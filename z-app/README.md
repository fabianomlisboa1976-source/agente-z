# Agente Z - Aplicativo Android

Aplicativo de chat com memória persistente para Android.

## 🚀 Gerar APK

### Opção 1: EAS Build (Recomendado - Serviço Cloud Gratuito)

1. Crie uma conta gratuita no [Expo](https://expo.dev/signup)

2. Instale o EAS CLI (já instalado neste projeto)

3. Faça login:
```bash
npx eas login
```

4. Gere o APK:
```bash
npx eas build --platform android --profile preview
```

5. Baixe o APK gerado no link fornecido

### Opção 2: Build Local (Requer Android SDK)

**Pré-requisitos:**
- Java JDK 17+
- Android SDK instalado
- Variável ANDROID_HOME configurada

**Passos:**

1. Instale as dependências:
```bash
npm install
```

2. Gere o projeto Android:
```bash
npx expo prebuild --platform android
```

3. Compile o APK:
```bash
cd android
./gradlew assembleRelease
```

4. O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

### Opção 3: Usar o Expo Go (Para Testes)

1. Instale o app [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) no seu Android

2. Execute:
```bash
npx expo start
```

3. Escaneie o QR code com o Expo Go

## 📱 Configuração

A URL da API está configurada em `App.tsx`. Altere conforme necessário:

```typescript
// Android Emulator
const API_BASE_URL = 'http://10.0.2.2:3000';

// iOS Simulator
// const API_BASE_URL = 'http://localhost:3000';

// Dispositivo Físico (use o IP do seu computador)
// const API_BASE_URL = 'http://192.168.1.100:3000';
```

## 🔧 Estrutura do Projeto

```
z-app/
├── App.tsx          # Código principal do aplicativo
├── app.json         # Configurações do Expo
├── eas.json         # Configurações de build
├── assets/          # Ícones e imagens
└── android/         # Projeto Android nativo (gerado)
```

## ✨ Funcionalidades

- 💬 Chat com agente Z que tem memória persistente
- 🧠 Memória automática de conversas e preferências
- 📋 Gerenciamento de tarefas
- 🌙 Tema escuro elegante
- 🔐 Armazenamento seguro do ID do usuário

## 📦 Dependências

- React Native 0.83
- Expo 55
- React Navigation
- Expo Secure Store
