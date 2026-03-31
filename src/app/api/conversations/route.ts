import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, ConversationResponse, CreateConversationInput, PaginatedResponse } from '@/lib/types';

// GET /api/conversations - Listar conversas do usuário
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId é obrigatório',
      }, { status: 400 });
    }
    
    const where = {
      userId,
      ...(includeArchived ? {} : { isArchived: false }),
    };
    
    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Última mensagem para preview
          },
        },
      }),
      db.conversation.count({ where }),
    ]);
    
    return NextResponse.json<PaginatedResponse<ConversationResponse>>({
      success: true,
      data: conversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao buscar conversas',
    }, { status: 500 });
  }
}

// POST /api/conversations - Criar nova conversa
export async function POST(request: NextRequest) {
  try {
    const body: CreateConversationInput = await request.json();
    
    if (!body.userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId é obrigatório',
      }, { status: 400 });
    }
    
    const conversation = await db.conversation.create({
      data: {
        userId: body.userId,
        title: body.title || 'Nova Conversa',
        context: body.context || {},
      },
    });
    
    return NextResponse.json<ApiResponse<ConversationResponse>>({
      success: true,
      data: conversation,
      message: 'Conversa criada com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao criar conversa',
    }, { status: 500 });
  }
}
