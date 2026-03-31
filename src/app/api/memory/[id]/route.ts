import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/memory/[id] - Buscar memória específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const memory = await db.agentMemory.findUnique({
      where: { id }
    })

    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Memória não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar contador de acesso
    await db.agentMemory.update({
      where: { id },
      data: {
        lastAccessed: new Date(),
        accessCount: { increment: 1 }
      }
    })

    return NextResponse.json({ success: true, data: memory })
  } catch (error) {
    console.error('Error fetching memory:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar memória' },
      { status: 500 }
    )
  }
}

// PUT /api/memory/[id] - Atualizar memória
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { value, importance, source, verified, expiresAt } = body

    const memory = await db.agentMemory.update({
      where: { id },
      data: {
        ...(value !== undefined && { value }),
        ...(importance !== undefined && { importance }),
        ...(source !== undefined && { source }),
        ...(verified !== undefined && { verified }),
        ...(expiresAt !== undefined && { 
          expiresAt: expiresAt ? new Date(expiresAt) : null 
        })
      }
    })

    return NextResponse.json({ success: true, data: memory })
  } catch (error) {
    console.error('Error updating memory:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar memória' },
      { status: 500 }
    )
  }
}

// DELETE /api/memory/[id] - Deletar memória
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.agentMemory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Memória deletada' })
  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar memória' },
      { status: 500 }
    )
  }
}
