import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Send, User, Bot, AlertCircle, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

type Message = {
  id: number;
  sender: "user" | "bot" | "human";
  text: string;
  time: string;
};

export default function LiveChat() {
  const [isAiActive, setIsAiActive] = useState(true);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [activeChatId, setActiveChatId] = useState(1);
  const [chats, setChats] = useState([
    { id: 1, name: "João Silva", phone: "+55 11 98765-4321", lastMessage: "Qual o valor do plano?", time: "10:42", unread: 2 },
    { id: 2, name: "Maria Oliveira", phone: "+55 21 99999-8888", lastMessage: "Obrigada!", time: "09:15", unread: 0 },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "user", text: "Olá, gostaria de saber mais sobre o sistema.", time: "10:40" },
    { id: 2, sender: "bot", text: "Olá! Sou o assistente virtual. Nosso sistema ajuda a automatizar seu WhatsApp. Como posso te ajudar hoje?", time: "10:41" },
    { id: 3, sender: "user", text: "Qual o valor do plano?", time: "10:42" },
  ]);

  useEffect(() => {
    // Connect to Socket.IO server on the same origin
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Live Chat server");
      newSocket.emit("join_chat", activeChatId);
    });

    newSocket.on("new_message", (data: { chatId: number; message: Message; isTransfer?: boolean }) => {
      if (data.chatId === activeChatId) {
        setMessages((prev) => {
          // Prevent duplicate messages if we already added it locally
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });

        if (data.isTransfer) {
          setIsAiActive(false);
          toast.warning("A IA transferiu este atendimento para você.");
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [activeChatId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !socket) return;
    
    const newMessage: Message = { 
      id: Date.now(), 
      sender: "human", 
      text: message, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    // Optimistic update
    setMessages((prev) => [...prev, newMessage]);
    
    // Send to server
    socket.emit("send_message", { chatId: activeChatId, message: newMessage, isAiActive, history: messages });
    
    setMessage("");
  };

  const handleSimulateCustomer = () => {
    if (!message.trim() || !socket) return;
    
    const newMessage: Message = { 
      id: Date.now(), 
      sender: "user", 
      text: message, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    // Optimistic update
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Send to server
    socket.emit("send_message", { chatId: activeChatId, message: newMessage, isAiActive, history: messages });
    
    setMessage("");
  };

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Lista de Chats */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="p-4 border-b border-zinc-200">
          <CardTitle className="text-lg">Conversas Ativas</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => {
                setActiveChatId(chat.id);
                socket?.emit("join_chat", chat.id);
              }}
              className={`p-4 border-b border-zinc-100 cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-sm text-zinc-900">{chat.name}</h3>
                <span className="text-xs text-zinc-500">{chat.time}</span>
              </div>
              <p className="text-xs text-zinc-500 truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Janela de Chat */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="p-4 border-b border-zinc-200 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">{activeChat.name}</CardTitle>
            <p className="text-xs text-zinc-500">{activeChat.phone}</p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200">
            <span className="text-sm font-medium text-zinc-700">Modo IA Ativo</span>
            <Switch checked={isAiActive} onCheckedChange={setIsAiActive} />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
          {!isAiActive && (
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
              <AlertCircle className="w-4 h-4" />
              IA Pausada. Você está no controle desta conversa.
            </div>
          )}
          
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender === 'user' 
                  ? 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-sm' 
                  : msg.sender === 'bot'
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-tr-sm'
                    : 'bg-zinc-900 text-zinc-50 rounded-tr-sm'
              }`}>
                <div className="flex items-center gap-1.5 mb-1 opacity-70">
                  {msg.sender === 'user' ? <User className="w-3 h-3" /> : msg.sender === 'bot' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    {msg.sender === 'user' ? 'Cliente' : msg.sender === 'bot' ? 'IA' : 'Você (Humano)'}
                  </span>
                </div>
                <p className="text-sm">{msg.text}</p>
                <div className="text-[10px] text-right mt-1 opacity-50">{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <div className="p-4 border-t border-zinc-200 bg-white">
          <div className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem para intervir..." 
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSimulateCustomer} variant="outline" title="Simular Cliente" className="shrink-0 text-zinc-500">
              <MessageCircle className="w-4 h-4 mr-2" />
              Simular Cliente
            </Button>
            <Button onClick={handleSend} className="shrink-0">
              <Send className="w-4 h-4 mr-2" />
              Enviar como Humano
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
