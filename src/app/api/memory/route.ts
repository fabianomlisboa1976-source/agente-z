import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, MemoryResponse, CreateMemoryInput, PaginatedResponse } from '@/lib/types';

// GET /api/memory - Listar/buscar memórias do usuário
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const key = searchParams.get('key');
    const query = searchParams.get('query'); // Busca textual
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId é obrigatório',
      }, { status: 400 });
    }
    
    const where = {
      userId,
      ...(type && { type: type as never }),
      ...(key && { key }),
      ...(query && {
        content: {
          contains: query,
        },
      }),
    };
    
    const [memories, total] = await Promise.all([
      db.memory.findMany({
        where,
        orderBy: [
          { importance: 'desc' },
          { lastAccessAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.memory.count({ where }),
    ]);
    
    return NextResponse.json<PaginatedResponse<MemoryResponse>>({
      success: true,
      data: memories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao buscar memórias',
    }, { status: 500 });
  }
}

// POST /api/memory - Criar nova memória
export async function POST(request: NextRequest) {
  try {
    const body: CreateMemoryInput = await request.json();
    
    if (!body.userId || !body.type || !body.content) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId, type e content são obrigatórios',
      }, { status: 400 });
    }
    
    // Se key foi fornecida, verificar se já existe e atualizar
    if (body.key) {
      const existingMemory = await db.memory.findFirst({
        where: {
          userId: body.userId,
          key: body.key,
          type: body.type as never,
        },
      });
      
      if (existingMemory) {
        const updated = await db.memory.update({
          where: { id: existingMemory.id },
          data: {
            content: body.content,
            importance: body.importance ?? existingMemory.importance,
            metadata: body.metadata ?? existingMemory.metadata,
            updatedAt: new Date(),
          },
        });
        
        return NextResponse.json<ApiResponse<MemoryResponse>>({
          success: true,
          data: updated,
          message: 'Memória atualizada com sucesso',
        });
      }
    }
    
    const memory = await db.memory.create({
      data: {
        userId: body.userId,
        type: body.type as never,
        key: body.key,
        content: body.content,
        importance: body.importance ?? 5,
        metadata: body.metadata || {},
        messageId: body.messageId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
    });
    
    return NextResponse.json<ApiResponse<MemoryResponse>>({
      success: true,
      data: memory,
      message: 'Memória criada com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao criar memória',
    }, { status: 500 });
  }
}
