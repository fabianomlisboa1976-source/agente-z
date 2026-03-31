// Tipos para a API do Agente Z

// ============================================
// Usuários
// ============================================
export interface CreateUserInput {
  email: string;
  name?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  preferences: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Conversas
// ============================================
export interface CreateConversationInput {
  userId: string;
  title?: string;
  context?: Record<string, unknown>;
}

export interface UpdateConversationInput {
  title?: string;
  summary?: string;
  isArchived?: boolean;
  isStarred?: boolean;
  context?: Record<string, unknown>;
}

export interface ConversationResponse {
  id: string;
  userId: string;
  title: string | null;
  summary: string | null;
  context: Record<string, unknown> | null;
  isArchived: boolean;
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageResponse[];
}

// ============================================
// Mensagens
// ============================================
export interface CreateMessageInput {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  tokens: number | null;
  model: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ============================================
// Tarefas
// ============================================
export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  tags?: string;
  dueDate?: Date;
  conversationId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  tags?: string;
  dueDate?: Date;
}

export interface TaskResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  tags: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  subtasks?: SubTaskResponse[];
}

export interface SubTaskResponse {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: Date;
}

// ============================================
// Memória
// ============================================
export interface CreateMemoryInput {
  userId: string;
  type: 'CONVERSATION' | 'FACT' | 'PREFERENCE' | 'CONTEXT' | 'SKILL' | 'RELATIONSHIP' | 'GOAL' | 'SCHEDULE' | 'NOTE' | 'EPISODIC';
  key?: string;
  content: string;
  importance?: number;
  metadata?: Record<string, unknown>;
  messageId?: string;
  expiresAt?: Date;
}

export interface MemoryResponse {
  id: string;
  userId: string;
  type: string;
  key: string | null;
  content: string;
  importance: number;
  accessCount: number;
  metadata: Record<string, unknown> | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastAccessAt: Date;
}

// ============================================
// Chat
// ============================================
export interface ChatInput {
  userId: string;
  message: string;
  conversationId?: string;
  includeMemory?: boolean;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  response: string;
  memories?: MemoryResponse[];
  tasks?: TaskResponse[];
}

// ============================================
// Respostas da API
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
