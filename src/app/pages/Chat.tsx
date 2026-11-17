import { useState } from 'react';
import { MessageSquare, Send, Paperclip, Search, Phone, Video, MoreVertical, Smile, CheckCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { mockChatRooms, mockMessages } from '../data/mockData';
import { motion } from 'motion/react';

export function Chat() {
  const [selectedChat, setSelectedChat] = useState(mockChatRooms[0].id);
  const [messageInput, setMessageInput] = useState('');

  const currentChat = mockChatRooms.find(chat => chat.id === selectedChat);
  const messages = mockMessages[selectedChat] || [];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message
      console.log('Sending:', messageInput);
      setMessageInput('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-bold mb-2">Messages</h1>
        <p className="text-gray-600">Real-time collaboration with your team</p>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gray-200 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Chat List Sidebar */}
            <div className="border-r border-gray-200 bg-gray-50 lg:col-span-1">
              {/* Search */}
              <div className="p-4 bg-white border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9 bg-gray-50 border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Chat Rooms */}
              <div className="overflow-y-auto h-full">
                {mockChatRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => setSelectedChat(room.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-white ${
                      selectedChat === room.id ? 'bg-white border-l-4 border-[#2979FF]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white">
                          <AvatarImage src={room.participantAvatar} />
                          <AvatarFallback>{room.participantName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10b981] border-2 border-white rounded-full" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">{room.participantName}</h3>
                          <span className="text-xs text-gray-500">{room.lastMessageTime}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">{room.lastMessage}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                            {room.projectTitle}
                          </Badge>
                          {room.unreadCount > 0 && (
                            <Badge className="bg-[#2979FF] text-white text-xs h-5 w-5 flex items-center justify-center p-0 rounded-full">
                              {room.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Empty State */}
                {mockChatRooms.length === 0 && (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold mb-2">No conversations yet</h3>
                    <p className="text-sm text-gray-600">Start a project to begin chatting</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="lg:col-span-2 flex flex-col bg-white">
              {currentChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-gray-100">
                          <AvatarImage src={currentChat.participantAvatar} />
                          <AvatarFallback>{currentChat.participantName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{currentChat.participantName}</h3>
                          <p className="text-xs text-gray-600">{currentChat.projectTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
                      >
                        {!message.isCurrentUser && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.senderAvatar} />
                            <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`flex flex-col ${message.isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.isCurrentUser
                                ? 'bg-[#2979FF] text-white rounded-br-md'
                                : 'bg-white border border-gray-200 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            {message.hasAttachment && (
                              <div className="mt-2 p-2 bg-white/10 rounded-lg flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                <span className="text-xs">brand-kit.zip</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {message.isCurrentUser && (
                              <CheckCheck className="w-3 h-3 text-[#2979FF]" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-end gap-3">
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full flex-shrink-0">
                        <Paperclip className="w-5 h-5 text-gray-400" />
                      </Button>
                      
                      <div className="flex-1 relative">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message..."
                          className="pr-12 bg-gray-50 border-gray-200 rounded-2xl h-12"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                        >
                          <Smile className="w-5 h-5 text-gray-400" />
                        </Button>
                      </div>

                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="h-12 w-12 p-0 rounded-full bg-[#2979FF] hover:bg-[#1e5fd8] flex-shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a chat from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
