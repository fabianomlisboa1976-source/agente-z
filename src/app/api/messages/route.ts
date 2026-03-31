import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, MessageResponse, CreateMessageInput, PaginatedResponse } from '@/lib/types';

// GET /api/messages - Listar mensagens de uma conversa
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!conversationId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'conversationId é obrigatório',
      }, { status: 400 });
    }
    
    const where = { conversationId };
    
    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.message.count({ where }),
    ]);
    
    return NextResponse.json<PaginatedResponse<MessageResponse>>({
      success: true,
      data: messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao buscar mensagens',
    }, { status: 500 });
  }
}

// POST /api/messages - Criar nova mensagem
export async function POST(request: NextRequest) {
  try {
    const body: CreateMessageInput = await request.json();
    
    if (!body.conversationId || !body.role || !body.content) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'conversationId, role e content são obrigatórios',
      }, { status: 400 });
    }
    
    // Verificar se a conversa existe
    const conversation = await db.conversation.findUnique({
      where: { id: body.conversationId },
    });
    
    if (!conversation) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Conversa não encontrada',
      }, { status: 404 });
    }
    
    const message = await db.message.create({
      data: {
        conversationId: body.conversationId,
        role: body.role,
        content: body.content,
        tokens: body.tokens,
        model: body.model,
        metadata: body.metadata || {},
      },
    });
    
    // Atualizar updatedAt da conversa
    await db.conversation.update({
      where: { id: body.conversationId },
      data: { updatedAt: new Date() },
    });
    
    return NextResponse.json<ApiResponse<MessageResponse>>({
      success: true,
      data: message,
      message: 'Mensagem criada com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao criar mensagem',
    }, { status: 500 });
  }
}
