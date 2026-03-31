import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

// API Configuration
const API_BASE_URL = 'http://10.0.2.2:3000'; // Android emulator default
// const API_BASE_URL = 'http://localhost:3000'; // iOS simulator
// const API_BASE_URL = 'http://192.168.1.100:3000'; // Physical device (replace with your IP)

// Colors
const COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  userBubble: '#6366f1',
  assistantBubble: '#334155',
  border: '#475569',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat');
  const [tasks, setTasks] = useState<Task[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Initialize user on first load
  useEffect(() => {
    initializeUser();
  }, []);

  // Load tasks when user changes
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const initializeUser = async () => {
    try {
      // Try to get existing user from secure storage
      const storedUserId = await SecureStore.getItemAsync('z_user_id');
      
      if (storedUserId) {
        // Fetch user data
        const response = await fetch(`${API_BASE_URL}/api/users?email=${storedUserId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setUser(data.data);
          setIsInitialized(true);
          return;
        }
      }
      
      // Create new user
      const deviceId = await SecureStore.getItemAsync('z_device_id') || generateDeviceId();
      await SecureStore.setItemAsync('z_device_id', deviceId);
      
      const email = `z_user_${deviceId.slice(0, 8)}@z-app.local`;
      
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: 'Z User' }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        await SecureStore.setItemAsync('z_user_id', data.data.id);
        setUser(data.data);
        
        // Add welcome message
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Olá! Eu sou o Z, seu assistente pessoal com memória permanente. 🧠\n\nPosso lembrar de todas as nossas conversas, suas preferências, tarefas e muito mais!\n\nComo posso ajudar você hoje?',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando.');
    } finally {
      setIsInitialized(true);
    }
  };

  const generateDeviceId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: userMessage.content,
        }),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Reload tasks in case new ones were created
        loadTasks();
      } else {
        throw new Error(data.error || 'Erro ao processar mensagem');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, não consegui processar sua mensagem. Verifique sua conexão com o servidor.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>Z</Text>
            </View>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'COMPLETED' ? styles.statusCompleted :
          item.status === 'IN_PROGRESS' ? styles.statusInProgress :
          styles.statusPending
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'COMPLETED' ? 'Concluída' :
             item.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Pendente'}
          </Text>
        </View>
      </View>
      <View style={[
        styles.priorityIndicator,
        item.priority === 'URGENT' ? styles.priorityUrgent :
        item.priority === 'HIGH' ? styles.priorityHigh :
        item.priority === 'MEDIUM' ? styles.priorityMedium :
        styles.priorityLow
      ]} />
    </View>
  );

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>Z</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Inicializando...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>Z</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Agente Z</Text>
              <Text style={styles.headerSubtitle}>Memória Persistente</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Dropdown */}
        {showMenu && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('chat');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>💬 Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setActiveTab('tasks');
                loadTasks();
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>📋 Tarefas</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                Alert.alert('Sobre', 'Agente Z v1.0.0\nAssistente com memória persistente');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>ℹ️ Sobre</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {activeTab === 'chat' ? (
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            )}

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Digite sua mensagem..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                maxLength={4000}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.tasksContainer}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>Suas Tarefas</Text>
              <TouchableOpacity onPress={loadTasks}>
                <Text style={styles.refreshButton}>🔄</Text>
              </TouchableOpacity>
            </View>
            
            {tasks.length === 0 ? (
              <View style={styles.emptyTasks}>
                <Text style={styles.emptyTasksText}>Nenhuma tarefa encontrada</Text>
                <Text style={styles.emptyTasksHint}>
                  Peça ao Z para criar uma tarefa no chat!
                </Text>
              </View>
            ) : (
              <FlatList
                data={tasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.tasksList}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingLogoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  spinner: {
    marginBottom: 10,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  menuDropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
    marginVertical: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '100%',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.assistantBubble,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  typingIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    backgroundColor: COLORS.background,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
  sendButtonText: {
    color: COLORS.text,
    fontSize: 18,
  },
  tasksContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    fontSize: 20,
  },
  tasksList: {
    paddingBottom: 16,
  },
  taskItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: COLORS.success + '30',
  },
  statusInProgress: {
    backgroundColor: COLORS.primary + '30',
  },
  statusPending: {
    backgroundColor: COLORS.warning + '30',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.text,
  },
  priorityIndicator: {
    height: 3,
    borderRadius: 2,
    marginTop: 12,
  },
  priorityUrgent: {
    backgroundColor: COLORS.error,
  },
  priorityHigh: {
    backgroundColor: COLORS.warning,
  },
  priorityMedium: {
    backgroundColor: COLORS.primary,
  },
  priorityLow: {
    backgroundColor: COLORS.textSecondary,
  },
  emptyTasks: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTasksText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  emptyTasksHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
