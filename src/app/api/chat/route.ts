import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, ChatInput, ChatResponse, MemoryResponse, TaskResponse } from '@/lib/types';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/chat - Endpoint principal de chat com o agente Z
export async function POST(request: NextRequest) {
  try {
    const body: ChatInput = await request.json();
    
    if (!body.userId || !body.message) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId e message são obrigatórios',
      }, { status: 400 });
    }
    
    // 1. Buscar ou criar conversa
    let conversation;
    if (body.conversationId) {
      conversation = await db.conversation.findUnique({
        where: { id: body.conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50, // Últimas 50 mensagens para contexto
          },
        },
      });
      
      if (!conversation) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Conversa não encontrada',
        }, { status: 404 });
      }
    } else {
      conversation = await db.conversation.create({
        data: {
          userId: body.userId,
          title: body.message.slice(0, 50) + (body.message.length > 50 ? '...' : ''),
        },
        include: {
          messages: true,
        },
      });
    }
    
    // 2. Salvar mensagem do usuário
    const userMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: body.message,
      },
    });
    
    // 3. Buscar memórias relevantes do usuário
    let relevantMemories: MemoryResponse[] = [];
    let relevantTasks: TaskResponse[] = [];
    
    if (body.includeMemory !== false) {
      // Buscar memórias mais importantes e recentes
      const memories = await db.memory.findMany({
        where: { userId: body.userId },
        orderBy: [
          { importance: 'desc' },
          { lastAccessAt: 'desc' },
        ],
        take: 20,
      });
      
      // Filtrar memórias relevantes baseado na mensagem
      const messageWords = body.message.toLowerCase().split(/\s+/);
      relevantMemories = memories.filter(m => {
        const content = m.content.toLowerCase();
        return messageWords.some(word => word.length > 3 && content.includes(word));
      }).slice(0, 10);
      
      // Buscar tarefas pendentes
      relevantTasks = await db.task.findMany({
        where: {
          userId: body.userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        take: 10,
      });
    }
    
    // 4. Construir contexto para o AI
    const systemPrompt = buildSystemPrompt(relevantMemories, relevantTasks);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user', content: body.message },
    ];
    
    // 5. Chamar o modelo de IA
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: messages as never,
      temperature: 0.7,
      max_tokens: 4000,
    });
    
    const assistantResponse = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';
    
    // 6. Salvar resposta do assistente
    const assistantMessage = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantResponse,
        tokens: completion.usage?.total_tokens,
        model: 'z-ai',
      },
    });
    
    // 7. Atualizar updatedAt da conversa
    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    
    // 8. Extrair e salvar memórias importantes da conversa (simplificado)
    await extractAndSaveMemories(body.userId, body.message, assistantResponse, userMessage.id);
    
    // 9. Verificar se a resposta menciona tarefas e criar se necessário
    // (Isso seria mais sofisticado em produção)
    
    return NextResponse.json<ChatResponse>({
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      response: assistantResponse,
      memories: relevantMemories.length > 0 ? relevantMemories : undefined,
      tasks: relevantTasks.length > 0 ? relevantTasks : undefined,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao processar chat: ' + (error as Error).message,
    }, { status: 500 });
  }
}

// Construir prompt do sistema com memórias e tarefas
function buildSystemPrompt(memories: MemoryResponse[], tasks: TaskResponse[]): string {
  let prompt = `Você é o Z, um assistente de IA muito poderoso e capaz. Você tem acesso às seguintes informações sobre o usuário:

## Sobre Você
- Você é um agente de IA avançado chamado "Z"
- Você tem acesso a ferramentas e pode realizar tarefas em múltiplas plataformas
- Você é prestativo, inteligente e sempre busca a melhor solução
- Você TEM MEMÓRIA - você lembra de todas as conversas anteriores com este usuário
- Você pode criar, gerenciar e consultar tarefas para o usuário
- Seja conciso mas completo em suas respostas`;

  if (memories.length > 0) {
    prompt += `\n\n## Memórias do Usuário (informações que você aprendeu):
${memories.map(m => `- [${m.type}] ${m.key ? `(${m.key}): ` : ''}${m.content}`).join('\n')}`;
  }

  if (tasks.length > 0) {
    prompt += `\n\n## Tarefas Pendentes do Usuário:
${tasks.map(t => `- [${t.priority}] ${t.title}${t.dueDate ? ` (Prazo: ${new Date(t.dueDate).toLocaleDateString('pt-BR')})` : ''}${t.description ? `: ${t.description}` : ''}`).join('\n')}`;
  }

  prompt += `\n\n## Instruções Importantes:
- Use as memórias para personalizar suas respostas
- Lembre-se de preferências e informações importantes do usuário
- Se o usuário pedir para lembrar de algo, diga que você vai salvar na memória
- Se o usuário mencionar uma tarefa, ofereça ajuda para criar ou gerenciar
- Seja proativo em sugerir soluções baseadas no contexto que você tem`;

  return prompt;
}

// Extrair e salvar memórias importantes da conversa
async function extractAndSaveMemories(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  messageId: string
): Promise<void> {
  try {
    // Padrões simples para detectar informações importantes
    const patterns = [
      // Preferências
      { regex: /(?:eu gosto|prefiro|adoro|amo|odeio|detesto)\s+(.+)/gi, type: 'PREFERENCE' },
      // Fatos pessoais
      { regex: /(?:meu|minha|meus|minhas)\s+(\w+)\s+(?:é|são)\s+(.+)/gi, type: 'FACT' },
      // Metas
      { regex: /(?:quero|preciso|pretendo|vou|planejo)\s+(.+)/gi, type: 'GOAL' },
    ];
    
    const combinedText = `${userMessage} ${assistantResponse}`;
    
    for (const pattern of patterns) {
      const matches = combinedText.matchAll(pattern.regex);
      for (const match of matches) {
        const content = match[0];
        
        // Evitar duplicatas
        const existing = await db.memory.findFirst({
          where: {
            userId,
            type: pattern.type as never,
            content: { contains: content.slice(0, 100) },
          },
        });
        
        if (!existing && content.length > 10 && content.length < 500) {
          await db.memory.create({
            data: {
              userId,
              type: pattern.type as never,
              content: content.slice(0, 500),
              importance: 5,
              messageId,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting memories:', error);
    // Não falhar o request por causa disso
  }
}
