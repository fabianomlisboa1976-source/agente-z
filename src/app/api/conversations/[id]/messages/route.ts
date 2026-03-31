import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/conversations/[id]/messages - Listar mensagens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const before = searchParams.get('before') // ID da mensagem para buscar anteriores
    const after = searchParams.get('after') // ID da mensagem para buscar posteriores

    const where: Prisma.MessageWhereInput = {
      conversationId: id,
      deletedAt: null
    }

    // Se especificado, buscar mensagens antes ou depois de uma específica
    if (before || after) {
      const referenceMessage = await db.message.findUnique({
        where: { id: before || after || '' },
        select: { createdAt: true }
      })

      if (referenceMessage) {
        if (before) {
          where.createdAt = { lt: referenceMessage.createdAt }
        } else {
          where.createdAt = { gt: referenceMessage.createdAt }
        }
      }
    }

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        orderBy: { createdAt: after ? 'asc' : 'desc' },
        take: limit,
        skip: offset,
        include: {
          attachments: true,
          feedback: true
        }
      }),
      db.message.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: after ? messages : messages.reverse(), // Sempre retornar em ordem cronológica
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar mensagens' },
      { status: 500 }
    )
  }
}

// POST /api/conversations/[id]/messages - Adicionar mensagem
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const body = await request.json()
    const { 
      role, 
      content, 
      contentType = 'text', 
      tokenCount,
      modelUsed,
      processingTime,
      metadata 
    } = body

    if (!role || !content) {
      return NextResponse.json(
        { success: false, error: 'role e content são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a conversa existe
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Criar mensagem e atualizar conversa
    const [message] = await db.$transaction([
      db.message.create({
        data: {
          conversationId,
          role: role as any,
          content,
          contentType,
          tokenCount,
          modelUsed,
          processingTime,
          metadata
        },
        include: {
          attachments: true
        }
      }),
      db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    ])

    // Gerar título automaticamente se for a primeira mensagem do usuário
    if (role === 'user' && conversation.title === 'Nova Conversa') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
      await db.conversation.update({
        where: { id: conversationId },
        data: { title }
      })
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar mensagem' },
      { status: 500 }
    )
  }
}
