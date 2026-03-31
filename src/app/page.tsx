'use client'

import { useState, useEffect, useCallback } from 'react'

// Tipos
interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
}

interface Conversation {
  id: string
  userId: string
  title: string | null
  summary: string | null
  createdAt: string
  messages?: Message[]
}

interface Message {
  id: string
  conversationId: string
  role: string
  content: string
  createdAt: string
}

interface Task {
  id: string
  userId: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string | null
  dueDate: string | null
  createdAt: string
}

interface Memory {
  id: string
  userId: string
  type: string
  key: string | null
  content: string
  importance: number
  createdAt: string
}

interface ChatState {
  messages: Array<{ role: string; content: string }>
  input: string
  loading: boolean
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'docs' | 'chat' | 'data'>('docs')
  const [users, setUsers] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [chat, setChat] = useState<ChatState>({
    messages: [],
    input: '',
    loading: false
  })
  const [selectedConversation, setSelectedConversation] = useState<string>('')

  // Função para carregar dados do usuário
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [convRes, tasksRes, memRes] = await Promise.all([
        fetch(`/api/conversations?userId=${userId}`),
        fetch(`/api/tasks?userId=${userId}`),
        fetch(`/api/memory?userId=${userId}`)
      ])
      
      const [convData, tasksData, memData] = await Promise.all([
        convRes.json(),
        tasksRes.json(),
        memRes.json()
      ])
      
      if (convData.success) setConversations(convData.data)
      if (tasksData.success) setTasks(tasksData.data)
      if (memData.success) setMemories(memData.data)
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }, [])

  // Função para carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      const [usersRes, healthRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/health')
      ])
      
      const usersData = await usersRes.json()
      if (usersData.success && usersData.data.length > 0) {
        setUsers(usersData.data)
        setSelectedUser(usersData.data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  // Carregar dados quando usuário é selecionado
  useEffect(() => {
    if (selectedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadUserData(selectedUser)
    }
  }, [selectedUser, loadUserData])

  const sendChatMessage = async () => {
    if (!chat.input.trim() || !selectedUser) return
    
    const userMessage = chat.input
    setChat(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: userMessage }],
      input: '',
      loading: true
    }))
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          message: userMessage,
          conversationId: selectedConversation || undefined
        })
      })
      
      const data = await response.json()
      
      if (data.conversationId) {
        setSelectedConversation(data.conversationId)
      }
      
      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: data.response || data.error }],
        loading: false
      }))
      
      // Recarregar dados
      loadUserData(selectedUser)
    } catch (error) {
      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: 'Erro ao enviar mensagem' }],
        loading: false
      }))
    }
  }

  const createTestUser = async () => {
    const email = prompt('Digite o email do novo usuário:')
    if (!email) return
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: email.split('@')[0] })
      })
      const data = await response.json()
      if (data.success) {
        loadData()
        alert('Usuário criado com sucesso!')
      }
    } catch (error) {
      alert('Erro ao criar usuário')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl">
                Z
              </div>
              <div>
                <h1 className="text-xl font-bold">Agente Z - API de Memória</h1>
                <p className="text-sm text-gray-400">Banco de dados local para o seu APK</p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { id: 'docs', label: '📋 Documentação' },
                { id: 'chat', label: '💬 Chat' },
                { id: 'data', label: '📊 Dados' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Seleção de usuário */}
        {activeTab !== 'docs' && (
          <div className="mb-6 flex items-center gap-4 bg-gray-800/50 rounded-xl p-4">
            <label className="text-sm text-gray-400">Usuário:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
            <button
              onClick={createTestUser}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
            >
              + Novo Usuário
            </button>
          </div>
        )}

        {/* Conteúdo baseado na tab */}
        {activeTab === 'docs' && <DocsTab />}
        
        {activeTab === 'chat' && (
          <ChatTab
            chat={chat}
            setChat={setChat}
            sendChatMessage={sendChatMessage}
            conversations={conversations}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
          />
        )}
        
        {activeTab === 'data' && (
          <DataTab
            conversations={conversations}
            tasks={tasks}
            memories={memories}
            userId={selectedUser}
            onRefresh={() => loadUserData(selectedUser)}
          />
        )}
      </main>
    </div>
  )
}

// Componente de Documentação
function DocsTab() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/health',
      description: 'Verificar status da API e contagens',
      params: []
    },
    {
      method: 'GET/POST',
      path: '/api/users',
      description: 'Listar ou criar usuários',
      params: [
        { name: 'email', type: 'query', desc: 'Filtrar por email' }
      ]
    },
    {
      method: 'GET/POST',
      path: '/api/conversations',
      description: 'Listar ou criar conversas',
      params: [
        { name: 'userId', type: 'query/body', desc: 'ID do usuário (obrigatório)' },
        { name: 'title', type: 'body', desc: 'Título da conversa' }
      ]
    },
    {
      method: 'GET/PUT/DELETE',
      path: '/api/conversations/[id]',
      description: 'Gerenciar conversa específica',
      params: [
        { name: 'includeMessages', type: 'query', desc: 'Incluir mensagens (default: true)' }
      ]
    },
    {
      method: 'GET/POST',
      path: '/api/messages',
      description: 'Listar ou criar mensagens',
      params: [
        { name: 'conversationId', type: 'query/body', desc: 'ID da conversa (obrigatório)' },
        { name: 'role', type: 'body', desc: 'user/assistant/system' },
        { name: 'content', type: 'body', desc: 'Conteúdo da mensagem' }
      ]
    },
    {
      method: 'GET/POST',
      path: '/api/tasks',
      description: 'Listar ou criar tarefas',
      params: [
        { name: 'userId', type: 'query/body', desc: 'ID do usuário (obrigatório)' },
        { name: 'status', type: 'query', desc: 'Filtrar por status' },
        { name: 'priority', type: 'query', desc: 'Filtrar por prioridade' }
      ]
    },
    {
      method: 'GET/POST',
      path: '/api/memory',
      description: 'Listar ou criar memórias',
      params: [
        { name: 'userId', type: 'query/body', desc: 'ID do usuário (obrigatório)' },
        { name: 'type', type: 'query/body', desc: 'Tipo de memória' },
        { name: 'query', type: 'query', desc: 'Buscar por texto' }
      ]
    },
    {
      method: 'POST',
      path: '/api/chat',
      description: 'Chat com o agente Z (com memória)',
      params: [
        { name: 'userId', type: 'body', desc: 'ID do usuário (obrigatório)' },
        { name: 'message', type: 'body', desc: 'Mensagem do usuário (obrigatório)' },
        { name: 'conversationId', type: 'body', desc: 'ID da conversa (opcional)' }
      ]
    },
    {
      method: 'GET',
      path: '/api/search',
      description: 'Buscar em todas as entidades',
      params: [
        { name: 'userId', type: 'query', desc: 'ID do usuário (obrigatório)' },
        { name: 'q', type: 'query', desc: 'Termo de busca (obrigatório)' },
        { name: 'types', type: 'query', desc: 'Tipos: memory,task,conversation,message' }
      ]
    }
  ]

  const codeExamples = {
    android: `// Android - Exemplo com OkHttp
OkHttpClient client = new OkHttpClient();

// Criar usuário
JSONObject userJson = new JSONObject();
userJson.put("email", "usuario@email.com");
userJson.put("name", "Nome do Usuário");

Request createUserRequest = new Request.Builder()
    .url("http://SEU_SERVIDOR:3000/api/users")
    .post(RequestBody.create(
        userJson.toString(), 
        MediaType.parse("application/json")
    ))
    .build();

Response response = client.newCall(createUserRequest).execute();
String userId = new JSONObject(response.body().string())
    .getJSONObject("data").getString("id");

// Enviar mensagem ao agente Z
JSONObject chatJson = new JSONObject();
chatJson.put("userId", userId);
chatJson.put("message", "Olá Z, lembre que prefiro respostas curtas");

Request chatRequest = new Request.Builder()
    .url("http://SEU_SERVIDOR:3000/api/chat")
    .post(RequestBody.create(
        chatJson.toString(),
        MediaType.parse("application/json")
    ))
    .build();

Response chatResponse = client.newCall(chatRequest).execute();
JSONObject chatResult = new JSONObject(chatResponse.body().string());
String agentResponse = chatResult.getString("response");`,
    
    kotlin: `// Kotlin - Exemplo com Retrofit
interface ZApiService {
    @POST("api/users")
    suspend fun createUser(@Body user: CreateUserRequest): ApiResponse<User>
    
    @POST("api/chat")
    suspend fun chat(@Body request: ChatRequest): ChatResponse
    
    @GET("api/conversations")
    suspend fun getConversations(
        @Query("userId") userId: String
    ): PaginatedResponse<Conversation>
    
    @GET("api/tasks")
    suspend fun getTasks(
        @Query("userId") userId: String,
        @Query("status") status: String? = null
    ): PaginatedResponse<Task>
    
    @GET("api/memory")
    suspend fun getMemories(
        @Query("userId") userId: String,
        @Query("query") query: String? = null
    ): PaginatedResponse<Memory>
}

data class ChatRequest(
    val userId: String,
    val message: String,
    val conversationId: String? = null
)

// Uso
val api = Retrofit.Builder()
    .baseUrl("http://SEU_SERVIDOR:3000/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()
    .create(ZApiService::class.java)

// Chat com o agente
val response = api.chat(ChatRequest(
    userId = "user_123",
    message = "Quais tarefas tenho para hoje?"
))
println(response.response)  // Resposta do agente Z`
  }

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/30">
        <h2 className="text-2xl font-bold mb-3">🚀 API do Agente Z</h2>
        <p className="text-gray-300 mb-4">
          Esta API fornece um sistema completo de memória persistente para o seu aplicativo Android.
          O agente Z pode lembrar de conversas, preferências, tarefas e contexto do usuário.
        </p>
        <div className="flex gap-4">
          <div className="bg-gray-800/50 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Banco de dados:</span>
            <span className="ml-2 font-mono">SQLite</span>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">URL Base:</span>
            <span className="ml-2 font-mono text-green-400">http://localhost:3000</span>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div>
        <h3 className="text-xl font-bold mb-4">📚 Endpoints</h3>
        <div className="grid gap-3">
          {endpoints.map((ep, i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-start gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  ep.method.includes('POST') ? 'bg-green-600' :
                  ep.method.includes('PUT') ? 'bg-yellow-600' :
                  ep.method.includes('DELETE') ? 'bg-red-600' :
                  'bg-blue-600'
                }`}>
                  {ep.method}
                </span>
                <div className="flex-1">
                  <code className="text-blue-400 font-mono">{ep.path}</code>
                  <p className="text-gray-400 text-sm mt-1">{ep.description}</p>
                  {ep.params.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ep.params.map((p, j) => (
                        <span key={j} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {p.name}: <span className="text-gray-400">{p.desc}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Examples */}
      <div>
        <h3 className="text-xl font-bold mb-4">💻 Exemplos de Código</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Java (OkHttp)</h4>
            <pre className="bg-gray-800 rounded-xl p-4 overflow-auto text-xs font-mono border border-gray-700 max-h-80">
              {codeExamples.android}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Kotlin (Retrofit)</h4>
            <pre className="bg-gray-800 rounded-xl p-4 overflow-auto text-xs font-mono border border-gray-700 max-h-80">
              {codeExamples.kotlin}
            </pre>
          </div>
        </div>
      </div>

      {/* Tipos de Memória */}
      <div>
        <h3 className="text-xl font-bold mb-4">🧠 Tipos de Memória</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { type: 'CONVERSATION', desc: 'Memórias de conversas' },
            { type: 'FACT', desc: 'Fatos sobre o usuário' },
            { type: 'PREFERENCE', desc: 'Preferências do usuário' },
            { type: 'CONTEXT', desc: 'Contexto de trabalho atual' },
            { type: 'SKILL', desc: 'Habilidades do usuário' },
            { type: 'GOAL', desc: 'Metas e objetivos' },
            { type: 'SCHEDULE', desc: 'Informações de agenda' },
            { type: 'NOTE', desc: 'Notas gerais' },
            { type: 'EPISODIC', desc: 'Eventos específicos' },
          ].map((m, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <span className="font-mono text-blue-400">{m.type}</span>
              <p className="text-gray-400 text-sm">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente de Chat
function ChatTab({
  chat,
  setChat,
  sendChatMessage,
  conversations,
  selectedConversation,
  setSelectedConversation
}: {
  chat: ChatState
  setChat: React.Dispatch<React.SetStateAction<ChatState>>
  sendChatMessage: () => void
  conversations: Conversation[]
  selectedConversation: string
  setSelectedConversation: (id: string) => void
}) {
  return (
    <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Lista de conversas */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 overflow-auto">
        <h3 className="font-bold mb-3">Conversas</h3>
        <div className="space-y-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedConversation === conv.id
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium truncate">{conv.title || 'Sem título'}</div>
              <div className="text-xs text-gray-400">
                {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="md:col-span-3 flex flex-col bg-gray-800/50 rounded-xl border border-gray-700">
        {/* Mensagens */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {chat.messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <div className="text-4xl mb-3">💬</div>
              <p>Envie uma mensagem para o Agente Z</p>
              <p className="text-sm">Ele vai lembrar de tudo!</p>
            </div>
          ) : (
            chat.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))
          )}
          {chat.loading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={chat.input}
              onChange={(e) => setChat(prev => ({ ...prev, input: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={sendChatMessage}
              disabled={chat.loading || !chat.input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-xl font-medium transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de Dados
function DataTab({
  conversations,
  tasks,
  memories,
  userId,
  onRefresh
}: {
  conversations: Conversation[]
  tasks: Task[]
  memories: Memory[]
  userId: string
  onRefresh: () => void
}) {
  const [activeDataTab, setActiveDataTab] = useState<'conversations' | 'tasks' | 'memories'>('tasks')

  const createTask = async () => {
    const title = prompt('Título da tarefa:')
    if (!title) return
    
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          priority: 'MEDIUM'
        })
      })
      onRefresh()
    } catch (error) {
      alert('Erro ao criar tarefa')
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      onRefresh()
    } catch (error) {
      alert('Erro ao atualizar tarefa')
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'tasks', label: `📋 Tarefas (${tasks.length})` },
          { id: 'memories', label: `🧠 Memórias (${memories.length})` },
          { id: 'conversations', label: `💬 Conversas (${conversations.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveDataTab(tab.id as typeof activeDataTab)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeDataTab === tab.id
                ? 'bg-blue-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={onRefresh}
          className="ml-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Conteúdo */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {activeDataTab === 'tasks' && (
          <div>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold">Tarefas</h3>
              <button
                onClick={createTask}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
              >
                + Nova Tarefa
              </button>
            </div>
            <div className="divide-y divide-gray-700">
              {tasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-400 mt-1">{task.description}</div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'URGENT' ? 'bg-red-600' :
                          task.priority === 'HIGH' ? 'bg-orange-600' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.status === 'COMPLETED' ? 'bg-green-600' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-600' :
                          'bg-gray-600'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="IN_PROGRESS">Em Progresso</option>
                      <option value="COMPLETED">Concluída</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeDataTab === 'memories' && (
          <div>
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold">Memórias do Agente</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {memories.map(memory => (
                <div key={memory.id} className="p-4 hover:bg-gray-700/50">
                  <div className="flex items-start gap-3">
                    <span className="text-xs bg-purple-600/50 px-2 py-1 rounded font-mono">
                      {memory.type}
                    </span>
                    {memory.key && (
                      <span className="text-xs bg-blue-600/50 px-2 py-1 rounded">
                        {memory.key}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="text-sm">{memory.content}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Importância: {memory.importance}/10
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeDataTab === 'conversations' && (
          <div>
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold">Histórico de Conversas</h3>
            </div>
            <div className="divide-y divide-gray-700">
              {conversations.map(conv => (
                <div key={conv.id} className="p-4 hover:bg-gray-700/50">
                  <div className="font-medium">{conv.title || 'Sem título'}</div>
                  {conv.summary && (
                    <div className="text-sm text-gray-400 mt-1">{conv.summary}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {conv.messages?.length || 0} mensagens • {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
