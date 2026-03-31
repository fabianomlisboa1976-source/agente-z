import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/health - Verificar saúde do sistema
export async function GET() {
  try {
    // Testar conexão com o banco
    await db.$queryRaw`SELECT 1`;
    
    // Contar registros
    const [users, conversations, messages, tasks, memories] = await Promise.all([
      db.user.count(),
      db.conversation.count(),
      db.message.count(),
      db.task.count(),
      db.memory.count(),
    ]);
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        counts: {
          users,
          conversations,
          messages,
          tasks,
          memories,
        },
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    }, { status: 500 });
  }
}
