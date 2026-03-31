import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, TaskResponse, UpdateTaskInput } from '@/lib/types';

// GET /api/tasks/[id] - Buscar tarefa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const task = await db.task.findUnique({
      where: { id },
      include: {
        subtasks: {
          orderBy: { order: 'asc' },
        },
        reminders: true,
      },
    });
    
    if (!task) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Tarefa não encontrada',
      }, { status: 404 });
    }
    
    return NextResponse.json<ApiResponse<TaskResponse>>({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao buscar tarefa',
    }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Atualizar tarefa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateTaskInput = await request.json();
    
    const updateData: Record<string, unknown> = { ...body };
    
    // Se status for COMPLETED, definir completedAt
    if (body.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    
    // Converter dueDate se fornecida
    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    }
    
    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        subtasks: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    return NextResponse.json<ApiResponse<TaskResponse>>({
      success: true,
      data: task,
      message: 'Tarefa atualizada com sucesso',
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao atualizar tarefa',
    }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Deletar tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.task.delete({
      where: { id },
    });
    
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'Tarefa deletada com sucesso',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao deletar tarefa',
    }, { status: 500 });
  }
}
