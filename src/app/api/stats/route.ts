import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus } from '@prisma/client'

// GET /api/stats - Estatísticas do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || '30' // dias

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    const [
      totalConversations,
      totalMessages,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalMemories,
      recentConversations,
      recentMessages,
      tasksByPriority,
      messagesByRole
    ] = await Promise.all([
      // Total de conversas
      db.conversation.count({
        where: { userId, status: { not: 'deleted' } }
      }),

      // Total de mensagens
      db.message.count({
        where: {
          conversation: { userId }
        }
      }),

      // Total de tarefas
      db.task.count({
        where: { userId }
      }),

      // Tarefas completadas
      db.task.count({
        where: { userId, status: TaskStatus.completed }
      }),

      // Tarefas pendentes
      db.task.count({
        where: { 
          userId, 
          status: { in: [TaskStatus.pending, TaskStatus.in_progress] } 
        }
      }),

      // Total de memórias
      db.agentMemory.count({
        where: { userId }
      }),

      // Conversas recentes
      db.conversation.count({
        where: {
          userId,
          createdAt: { gte: daysAgo }
        }
      }),

      // Mensagens recentes
      db.message.count({
        where: {
          conversation: { userId },
          createdAt: { gte: daysAgo }
        }
      }),

      // Tarefas por prioridade
      db.task.groupBy({
        by: ['priority'],
        where: { userId },
        _count: true
      }),

      // Mensagens por papel (user/assistant)
      db.message.groupBy({
        by: ['role'],
        where: {
          conversation: { userId }
        },
        _count: true
      })
    ])

    // Calcular taxa de conclusão de tarefas
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalConversations,
          totalMessages,
          totalTasks,
          completedTasks,
          pendingTasks,
          totalMemories,
          completionRate
        },
        recent: {
          conversations: recentConversations,
          messages: recentMessages,
          period: `${period} dias`
        },
        breakdown: {
          tasksByPriority: tasksByPriority.map(t => ({
            priority: t.priority,
            count: t._count
          })),
          messagesByRole: messagesByRole.map(m => ({
            role: m.role,
            count: m._count
          }))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
