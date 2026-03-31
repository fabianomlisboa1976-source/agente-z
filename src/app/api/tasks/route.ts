import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, TaskResponse, CreateTaskInput, PaginatedResponse } from '@/lib/types';

// GET /api/tasks - Listar tarefas do usuário
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId é obrigatório',
      }, { status: 400 });
    }
    
    const where = {
      userId,
      ...(status && { status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD' }),
      ...(priority && { priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }),
      ...(category && { category }),
    };
    
    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          subtasks: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      db.task.count({ where }),
    ]);
    
    return NextResponse.json<PaginatedResponse<TaskResponse>>({
      success: true,
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao buscar tarefas',
    }, { status: 500 });
  }
}

// POST /api/tasks - Criar nova tarefa
export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskInput = await request.json();
    
    if (!body.userId || !body.title) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId e title são obrigatórios',
      }, { status: 400 });
    }
    
    const task = await db.task.create({
      data: {
        userId: body.userId,
        title: body.title,
        description: body.description,
        priority: body.priority || 'MEDIUM',
        category: body.category,
        tags: body.tags,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        conversationId: body.conversationId,
      },
      include: {
        subtasks: true,
      },
    });
    
    return NextResponse.json<ApiResponse<TaskResponse>>({
      success: true,
      data: task,
      message: 'Tarefa criada com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao criar tarefa',
    }, { status: 500 });
  }
}
