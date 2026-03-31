import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/[id] - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            tasks: true,
            memories: true,
            attachments: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, avatar, preferences, deviceId } = body

    const user = await db.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
        ...(preferences && { preferences }),
        ...(deviceId && { deviceId })
      }
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Usuário deletado' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}
