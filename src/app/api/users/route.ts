import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, UserResponse, CreateUserInput } from '@/lib/types';

// GET /api/users - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (email) {
      const user = await db.user.findUnique({
        where: { email },
      });
      
      if (!user) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Usuário não encontrado',
        }, { status: 404 });
      }
      
      return NextResponse.json<ApiResponse<UserResponse>>({
        success: true,
        data: user,
      });
    }
    
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json<ApiResponse<UserResponse[]>>({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao buscar usuários',
    }, { status: 500 });
  }
}

// POST /api/users - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserInput = await request.json();
    
    // Verificar se email já existe
    const existingUser = await db.user.findUnique({
      where: { email: body.email },
    });
    
    if (existingUser) {
      return NextResponse.json<ApiResponse<UserResponse>>({
        success: true,
        data: existingUser,
        message: 'Usuário já existe',
      });
    }
    
    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        avatar: body.avatar,
        preferences: body.preferences || {},
      },
    });
    
    return NextResponse.json<ApiResponse<UserResponse>>({
      success: true,
      data: user,
      message: 'Usuário criado com sucesso',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Erro ao criar usuário',
    }, { status: 500 });
  }
}
