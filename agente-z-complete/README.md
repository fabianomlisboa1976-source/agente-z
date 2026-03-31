# 🤖 Agente Z - Assistente Autônomo com Memória Persistente

![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![API](https://img.shields.io/badge/API-26%2B-brightgreen?style=for-the-badge)

Um aplicativo Android nativo com sistema multi-agente autônomo, memória persistente e programação via conversa.

## ✨ Funcionalidades

### 🧠 Sistema Multi-Agente
- **Coordenador**: Orquestra todos os agentes e toma decisões
- **Planejador**: Cria planos e organiza tarefas
- **Pesquisador**: Busca e analisa informações
- **Executor**: Executa tarefas práticas
- **Auditor**: Verifica qualidade e consistência
- **Memória**: Gerencia contexto e histórico
- **Comunicação**: Gerencia interações

### 💬 Programação via Conversa
Crie e gerencie agentes usando linguagem natural:
- "Crie um agente chamado Tradutor que traduza textos para inglês"
- "Listar agentes"
- "Crie uma tarefa urgente: Revisar documento"
- "Agende reunião para amanhã às 10h"

### 🔄 Execução 24/7
- Foreground Service que mantém o agente ativo
- Reinício automático após reinicialização
- Processamento de tarefas em background
- Notificações inteligentes

### 📊 Auditoria Completa
- Log de todas as ações
- Auditoria cruzada entre agentes
- Histórico de decisões
- Rastreamento de tokens

## 🚀 Instalação

### Download do APK
1. Acesse a página de [Releases](../../releases)
2. Baixe o APK mais recente
3. Instale no seu dispositivo Android

### Compilar do Código
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/agente-z.git
cd agente-z

# Compile o APK
./gradlew assembleDebug

# O APK estará em:
# app/build/outputs/apk/debug/app-debug.apk
```

## ⚙️ Configuração

### API Key
O Agente Z requer uma API Key para funcionar. Opções gratuitas:

1. **Groq (Recomendado)**: https://console.groq.com/keys
2. **OpenRouter**: https://openrouter.ai
3. **Cloudflare Workers AI**: https://developers.cloudflare.com/workers-ai/

### Configuração no App
1. Abra o app
2. Acesse **Configurações** (ícone de engrenagem)
3. Selecione o **Provedor de API**
4. Cole sua **API Key**
5. Selecione o **Modelo** desejado

## 📱 Uso

### Chat Principal
Converse naturalmente com o agente:
```
Você: Quais são as tarefas de hoje?
Agente: Verificando suas tarefas...
```

### Comandos de Programação
```
Você: Crie um agente chamado Assistente de Código que ajude com programação
Agente: ✅ Agente Assistente de Código criado com sucesso!

Você: Liste todos os agentes
Agente: 📋 Agentes Disponíveis:
       🎯 Coordenador ✅ Ativo
       📝 Planejador ✅ Ativo
       🤖 Assistente de Código ✅ Ativo
```

### Gerenciamento de Tarefas
```
Você: Crie uma tarefa urgente: Entregar relatório
Agente: ✅ Tarefa criada com sucesso!
       Prioridade: URGENT
       Status: Pendente

Você: Agende reunião com equipe para sexta às 14h
Agente: ✅ Agendamento confirmado!
       📅 Reunião com equipe
       🕐 05/04/2025 14:00
```

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│                  UI Layer                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │  Chat   │ │ Agents  │ │  Settings   │   │
│  └─────────┘ └─────────┘ └─────────────┘   │
└─────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────┐
│               Business Layer                 │
│  ┌─────────────────────────────────────┐   │
│  │       Agent Orchestrator            │   │
│  │  ┌─────────┐ ┌──────────────────┐   │   │
│  │  │ Agent   │ │ Conversation     │   │   │
│  │  │ Manager │ │ Programmer       │   │   │
│  │  └─────────┘ └──────────────────┘   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────┐
│                Data Layer                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │  Room   │ │   LLM   │ │   Audit     │   │
│  │   DB    │ │  Client │ │   Logger    │   │
│  └─────────┘ └─────────┘ └─────────────┘   │
└─────────────────────────────────────────────┘
```

## 🔧 Tecnologias

- **Kotlin** - Linguagem principal
- **Room** - Banco de dados local
- **Retrofit** - Cliente HTTP
- **Coroutines** - Programação assíncrona
- **WorkManager** - Tarefas agendadas
- **DataStore** - Preferências
- **Material Design 3** - UI

## 📋 Requisitos

- Android 8.0 (API 26) ou superior
- Conexão com internet
- API Key válida

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- Groq pela API gratuita de alta performance
- Comunidade Kotlin pelas bibliotecas excelentes
- Todos os contribuidores

---

**Agente Z** - Seu assistente inteligente com memória persistente
