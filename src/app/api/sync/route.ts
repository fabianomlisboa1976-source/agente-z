import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/sync - Sincronizar dados do dispositivo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      lastSyncAt,
      conversations = [],
      tasks = [],
      memories = []
    } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const syncTime = new Date()
    const lastSync = lastSyncAt ? new Date(lastSyncAt) : new Date(0)

    // Buscar dados atualizados desde a última sincronização
    const [updatedConversations, updatedTasks, updatedMemories] = await Promise.all([
      // Conversas atualizadas
      db.conversation.findMany({
        where: {
          userId,
          updatedAt: { gt: lastSync }
        },
        include: {
          messages: {
            where: { updatedAt: { gt: lastSync } },
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      
      // Tarefas atualizadas
      db.task.findMany({
        where: {
          userId,
          updatedAt: { gt: lastSync }
        }
      }),
      
      // Memórias atualizadas
      db.agentMemory.findMany({
        where: {
          userId,
          updatedAt: { gt: lastSync }
        }
      })
    ])

    // Processar dados enviados pelo dispositivo (se houver)
    const uploadedIds: { conversations: string[]; tasks: string[]; memories: string[] } = {
      conversations: [],
      tasks: [],
      memories: []
    }

    // Upload de conversas do dispositivo
    for (const conv of conversations) {
      try {
        const existing = await db.conversation.findUnique({
          where: { id: conv.id }
        })

        if (!existing) {
          await db.conversation.create({
            data: {
              id: conv.id,
              userId,
              title: conv.title,
              status: conv.status,
              createdAt: new Date(conv.createdAt),
              updatedAt: new Date(conv.updatedAt),
              messages: {
                create: conv.messages?.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  contentType: m.contentType || 'text',
                  createdAt: new Date(m.createdAt)
                })) || []
              }
            }
          })
          uploadedIds.conversations.push(conv.id)
        }
      } catch (e) {
        console.error('Error uploading conversation:', e)
      }
    }

    // Upload de tarefas do dispositivo
    for (const task of tasks) {
      try {
        const existing = await db.task.findUnique({
          where: { id: task.id }
        })

        if (!existing) {
          await db.task.create({
            data: {
              id: task.id,
              userId,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
              completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt)
            }
          })
          uploadedIds.tasks.push(task.id)
        }
      } catch (e) {
        console.error('Error uploading task:', e)
      }
    }

    // Upload de memórias do dispositivo
    for (const memory of memories) {
      try {
        await db.agentMemory.upsert({
          where: {
            userId_key: { userId, key: memory.key }
          },
          create: {
            id: memory.id,
            userId,
            type: memory.type,
            key: memory.key,
            value: memory.value,
            importance: memory.importance || 5,
            source: memory.source || 'device',
            createdAt: new Date(memory.createdAt),
            updatedAt: new Date(memory.updatedAt)
          },
          update: {
            value: memory.value,
            importance: memory.importance || 5,
            updatedAt: new Date()
          }
        })
        uploadedIds.memories.push(memory.id)
      } catch (e) {
        console.error('Error uploading memory:', e)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        serverTime: syncTime.toISOString(),
        conversations: updatedConversations,
        tasks: updatedTasks,
        memories: updatedMemories,
        uploaded: uploadedIds
      }
    })
  } catch (error) {
    console.error('Error in sync:', error)
    return NextResponse.json(
      { success: false, error: 'Erro na sincronização' },
      { status: 500 }
    )
  }
}

// GET /api/sync - Obter dados completos para sync inicial
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const [conversations, tasks, memories] = await Promise.all([
      db.conversation.findMany({
        where: { userId, status: { not: 'deleted' } },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      db.task.findMany({
        where: { userId, status: { not: 'archived' } }
      }),
      db.agentMemory.findMany({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        serverTime: new Date().toISOString(),
        conversations,
        tasks,
        memories
      }
    })
  } catch (error) {
    console.error('Error in full sync:', error)
    return NextResponse.json(
      { success: false, error: 'Erro na sincronização completa' },
      { status: 500 }
    )
  }
}
