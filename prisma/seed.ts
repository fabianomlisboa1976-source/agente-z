import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // 1. Criar usuário de exemplo
  const user = await prisma.user.upsert({
    where: { email: 'usuario@z-app.com' },
    update: {},
    create: {
      email: 'usuario@z-app.com',
      name: 'Usuário Z',
      preferences: {
        theme: 'dark',
        language: 'pt-BR',
        notifications: true,
      },
    },
  });
  console.log('✅ Usuário criado:', user.email);

  // 2. Criar memórias iniciais do usuário
  const memories = await Promise.all([
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PREFERENCE',
        key: 'language',
        content: 'O usuário prefere comunicar-se em português do Brasil',
        importance: 8,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'FACT',
        key: 'profession',
        content: 'O usuário é desenvolvedor de software e trabalha com tecnologia',
        importance: 7,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'PREFERENCE',
        key: 'code_style',
        content: 'O usuário prefere código limpo e bem documentado, usa TypeScript e React',
        importance: 6,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'GOAL',
        content: 'O usuário está trabalhando em um aplicativo móvel chamado Z que é um assistente de IA poderoso',
        importance: 9,
      },
    }),
    prisma.memory.create({
      data: {
        userId: user.id,
        type: 'SCHEDULE',
        key: 'work_hours',
        content: 'O usuário trabalha geralmente das 9h às 18h em dias úteis',
        importance: 5,
      },
    }),
  ]);
  console.log(`✅ ${memories.length} memórias criadas`);

  // 3. Criar tarefas de exemplo
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Implementar sistema de memória do agente Z',
        description: 'Criar banco de dados e APIs para o agente lembrar de conversas e preferências do usuário',
        status: 'COMPLETED',
        priority: 'HIGH',
        category: 'desenvolvimento',
        tags: 'backend,database,api',
        completedAt: new Date(),
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Criar interface do chat no APK',
        description: 'Desenvolver a UI/UX do chat com bubbles de mensagem e input',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        category: 'desenvolvimento',
        tags: 'android,ui,chat',
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Integrar API de memória no APK',
        description: 'Conectar o aplicativo Android com os endpoints de memória criados',
        status: 'PENDING',
        priority: 'MEDIUM',
        category: 'desenvolvimento',
        tags: 'android,api,integration',
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Testar fluxo completo de chat',
        description: 'Realizar testes de integração entre o APK e o backend',
        status: 'PENDING',
        priority: 'MEDIUM',
        category: 'teste',
        tags: 'testing,qa',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    }),
  ]);
  console.log(`✅ ${tasks.length} tarefas criadas`);

  // 4. Criar conversa de exemplo
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'Primeira conversa com o Z',
      summary: 'Conversa inicial sobre o desenvolvimento do aplicativo Z e suas funcionalidades',
    },
  });
  console.log('✅ Conversa criada');

  // 5. Criar mensagens na conversa
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: 'Olá Z! Sou o desenvolvedor do seu app. Preciso que você me ajude a criar um sistema de memória persistente.',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: `Olá! É um prazer conhecê-lo! Vou ajudar você a criar um sistema de memória persistente.

Para isso, vou precisar de algumas informações:

1. **Tipo de armazenamento**: Você prefere um banco de dados local (SQLite) ou remoto (PostgreSQL, MongoDB)?
2. **Escopo da memória**: Quais informações você quer que eu lembre?
   - Conversas anteriores
   - Preferências do usuário
   - Tarefas e lembretes
   - Contexto de trabalho atual
3. **Integração**: Como o APK vai acessar esses dados? Via API REST ou diretamente?

Com base nisso, posso te ajudar a estruturar o banco de dados e as APIs necessárias!`,
        model: 'z-ai',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: 'Quero SQLite local e via API REST. Preciso que você lembre de tudo: conversas, preferências, tarefas e contexto.',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: `Perfeito! Vou criar uma estrutura completa para você:

## Estrutura do Banco de Dados SQLite

### Tabelas Principais:
1. **users** - Dados do usuário e preferências
2. **conversations** - Histórico de conversas
3. **messages** - Mensagens individuais
4. **tasks** - Tarefas e lembretes
5. **memories** - Memórias contextuais do agente
6. **knowledge** - Base de conhecimento personalizada

### API REST Endpoints:

\`\`\`
GET    /api/users          - Listar usuários
POST   /api/users          - Criar usuário
GET    /api/conversations  - Listar conversas
POST   /api/conversations  - Criar conversa
GET    /api/messages       - Listar mensagens
POST   /api/messages       - Criar mensagem
GET    /api/tasks          - Listar tarefas
POST   /api/tasks          - Criar tarefa
GET    /api/memory         - Buscar memórias
POST   /api/memory         - Salvar memória
POST   /api/chat           - Chat com o agente
GET    /api/search         - Buscar em tudo
\`\`\`

Vou implementar isso agora! Posso começar?`,
        model: 'z-ai',
      },
    }),
  ]);
  console.log(`✅ ${messages.length} mensagens criadas`);

  // 6. Criar configurações do sistema
  const settings = [
    { key: 'app_name', value: 'Z Agent', type: 'string' },
    { key: 'version', value: '1.0.0', type: 'string' },
    { key: 'max_memory_items', value: '1000', type: 'number' },
    { key: 'context_window', value: '50', type: 'number' },
    { key: 'default_model', value: 'z-ai', type: 'string' },
  ];
  
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Configurações do sistema criadas');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Usuários: 1`);
  console.log(`   - Memórias: ${memories.length}`);
  console.log(`   - Tarefas: ${tasks.length}`);
  console.log(`   - Conversas: 1`);
  console.log(`   - Mensagens: ${messages.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
