import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

interface SearchResult {
  type: 'memory' | 'task' | 'conversation' | 'message';
  id: string;
  title?: string;
  content: string;
  relevance: number;
  createdAt: Date;
}

// GET /api/search - Buscar em todas as entidades do usuário
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const query = searchParams.get('q');
    const types = searchParams.get('types')?.split(',') || ['memory', 'task', 'conversation', 'message'];
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!userId || !query) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'userId e q (query) são obrigatórios',
      }, { status: 400 });
    }
    
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    
    // Buscar em memórias
    if (types.includes('memory')) {
      const memories = await db.memory.findMany({
        where: {
          userId,
          OR: [
            { content: { contains: queryLower } },
            { key: { contains: queryLower } },
          ],
        },
        take: limit,
      });
      
      for (const m of memories) {
        const relevance = calculateRelevance(m.content, queryWords);
        results.push({
          type: 'memory',
          id: m.id,
          title: m.key || m.type,
          content: m.content,
          relevance,
          createdAt: m.createdAt,
        });
      }
    }
    
    // Buscar em tarefas
    if (types.includes('task')) {
      const tasks = await db.task.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: queryLower } },
            { description: { contains: queryLower } },
            { tags: { contains: queryLower } },
          ],
        },
        take: limit,
      });
      
      for (const t of tasks) {
        const content = `${t.title} ${t.description || ''}`;
        const relevance = calculateRelevance(content, queryWords);
        results.push({
          type: 'task',
          id: t.id,
          title: t.title,
          content: t.description || t.title,
          relevance,
          createdAt: t.createdAt,
        });
      }
    }
    
    // Buscar em conversas
    if (types.includes('conversation')) {
      const conversations = await db.conversation.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: queryLower } },
            { summary: { contains: queryLower } },
          ],
        },
        take: limit,
      });
      
      for (const c of conversations) {
        const content = `${c.title || ''} ${c.summary || ''}`;
        const relevance = calculateRelevance(content, queryWords);
        results.push({
          type: 'conversation',
          id: c.id,
          title: c.title || 'Sem título',
          content: c.summary || 'Sem resumo',
          relevance,
          createdAt: c.createdAt,
        });
      }
    }
    
    // Buscar em mensagens
    if (types.includes('message')) {
      const messages = await db.message.findMany({
        where: {
          content: { contains: queryLower },
          conversation: { userId },
        },
        include: {
          conversation: true,
        },
        take: limit,
      });
      
      for (const m of messages) {
        const relevance = calculateRelevance(m.content, queryWords);
        results.push({
          type: 'message',
          id: m.id,
          title: `${m.role} em ${m.conversation.title || 'Conversa'}`,
          content: m.content.slice(0, 300) + (m.content.length > 300 ? '...' : ''),
          relevance,
          createdAt: m.createdAt,
        });
      }
    }
    
    // Ordenar por relevância
    results.sort((a, b) => b.relevance - a.relevance);
    
    return NextResponse.json<ApiResponse<SearchResult[]>>({
      success: true,
      data: results.slice(0, limit),
    });
  } catch (error) {
    console.error('Error in search:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro na busca',
    }, { status: 500 });
  }
}

// Calcular relevância simples baseada em correspondência de palavras
function calculateRelevance(content: string, queryWords: string[]): number {
  const contentLower = content.toLowerCase();
  let score = 0;
  
  for (const word of queryWords) {
    const regex = new RegExp(word, 'gi');
    const matches = contentLower.match(regex);
    if (matches) {
      score += matches.length * 10;
    }
  }
  
  // Bonus para correspondência exata
  if (queryWords.length > 1) {
    const fullQuery = queryWords.join(' ');
    if (contentLower.includes(fullQuery)) {
      score += 50;
    }
  }
  
  return score;
}
