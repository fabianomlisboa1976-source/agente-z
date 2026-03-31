import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, ConversationResponse, UpdateConversationInput } from '@/lib/types';

// GET /api/conversations/[id] - Buscar conversa por ID com mensagens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeMessages = searchParams.get('includeMessages') !== 'false';
    const messageLimit = parseInt(searchParams.get('messageLimit') || '100');
    const messageOffset = parseInt(searchParams.get('messageOffset') || '0');
    
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: includeMessages ? {
        messages: {
          orderBy: { createdAt: 'asc' },
          skip: messageOffset,
          take: messageLimit,
        },
      } : undefined,
    });
    
    if (!conversation) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Conversa não encontrada',
      }, { status: 404 });
    }
    
    return NextResponse.json<ApiResponse<ConversationResponse>>({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao buscar conversa',
    }, { status: 500 });
  }
}

// PUT /api/conversations/[id] - Atualizar conversa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateConversationInput = await request.json();
    
    const conversation = await db.conversation.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json<ApiResponse<ConversationResponse>>({
      success: true,
      data: conversation,
      message: 'Conversa atualizada com sucesso',
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao atualizar conversa',
    }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Deletar conversa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.conversation.delete({
      where: { id },
    });
    
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'Conversa deletada com sucesso',
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao deletar conversa',
    }, { status: 500 });
  }
}
