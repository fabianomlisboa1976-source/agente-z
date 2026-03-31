# 🚀 Guia para Gerar o APK do Agente Z

## Situação Atual

O código-fonte do aplicativo Android está pronto! O projeto foi criado usando **React Native com Expo** e está configurado para se conectar à API de memória que criamos.

---

## 📱 Opções para Gerar o APK

### ✅ Opção 1: EAS Build (RECOMENDADO)

**Serviço cloud gratuito do Expo - Não precisa instalar Android SDK!**

#### Passos:

1. **Crie uma conta gratuita** no [Expo](https://expo.dev/signup)

2. **Baixe o projeto** `z-app-source.zip` e extraia

3. **Abra o terminal** na pasta extraída e execute:

```bash
# Instale as dependências
npm install

# Instale o EAS CLI (se não tiver)
npm install -g eas-cli

# Faça login na sua conta Expo
eas login

# Gere o APK
eas build --platform android --profile preview
```

4. **Aguarde o build** (leva cerca de 5-10 minutos)

5. **Baixe o APK** no link que aparecerá

---

### 🔧 Opção 2: Build Local

**Requer Android SDK instalado no computador**

#### Pré-requisitos:
- Java JDK 17+
- Android SDK (via Android Studio)
- Variáveis de ambiente configuradas

#### Passos:

```bash
# Entre na pasta do projeto
cd z-app

# Instale as dependências
npm install

# Gere o projeto Android
npx expo prebuild --platform android

# Compile o APK
cd android
./gradlew assembleRelease

# O APK estará em:
# android/app/build/outputs/apk/release/app-release.apk
```

---

### 📲 Opção 3: Testar com Expo Go (Desenvolvimento)

**Para testar rapidamente sem gerar APK**

1. Instale o app **Expo Go** na Play Store

2. Execute:
```bash
cd z-app
npm install
npx expo start
```

3. Escaneie o QR code com o Expo Go

---

## ⚙️ Configuração da API

Antes de gerar o APK, configure a URL do servidor no arquivo `App.tsx`:

```typescript
// Linha 35 - Escolha a URL correta:

// Para Emulador Android:
const API_BASE_URL = 'http://10.0.2.2:3000';

// Para Dispositivo Físico (use o IP do seu computador):
// const API_BASE_URL = 'http://192.168.1.XXX:3000';

// Para iOS Simulator:
// const API_BASE_URL = 'http://localhost:3000';
```

---

## 📁 Estrutura do Projeto

```
z-app/
├── App.tsx           # Código principal do app
├── app.json          # Configurações do Expo
├── eas.json          # Configurações de build
├── assets/
│   └── icon.png      # Ícone do app
├── package.json      # Dependências
└── android/          # Projeto nativo (gerado)
```

---

## ✨ Funcionalidades do App

- 💬 **Chat inteligente** com o agente Z
- 🧠 **Memória persistente** - o agente lembra de tudo!
- 📋 **Gerenciamento de tarefas** integrado
- 🌙 **Tema escuro** elegante
- 🔐 **Armazenamento seguro** do ID do usuário

---

## ❓ Problemas Comuns

### "ANDROID_HOME não definido"
Você precisa instalar o Android SDK. Use a **Opção 1 (EAS Build)** para evitar isso.

### "Erro de conexão com a API"
1. Verifique se o servidor Next.js está rodando (`npm run dev`)
2. Confirme se a URL em `App.tsx` está correta
3. Se usar dispositivo físico, use o IP do computador na rede

### "Build demorando muito"
O EAS Build leva 5-15 minutos. Se demorar mais, verifique sua conexão.

---

## 📞 Precisa de Ajuda?

Se tiver problemas, verifique:
1. [Documentação do Expo](https://docs.expo.dev)
2. [EAS Build Docs](https://docs.expo.dev/build/introduction/)
3. [React Native Docs](https://reactnative.dev)

---

**O servidor de memória está rodando em:** `http://localhost:3000`

**Status da API:** Verifique com `curl http://localhost:3000/api/health`
