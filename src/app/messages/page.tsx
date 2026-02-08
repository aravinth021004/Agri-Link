'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Send, ArrowLeft, Loader2, MessageSquare } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Conversation {
  partnerId: string
  partnerName: string
  partnerImage: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  isRead: boolean
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toUserId = searchParams.get('to')
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      setConversations(data.conversations || [])
      
      // If there's a to param, select that conversation or start new
      if (toUserId && data.conversations) {
        const existing = data.conversations.find((c: Conversation) => c.partnerId === toUserId)
        if (existing) {
          setSelectedConversation(existing)
          fetchMessages(toUserId)
        } else {
          // Fetch user info for new conversation
          const userRes = await fetch(`/api/users/profile?userId=${toUserId}`)
          const userData = await userRes.json()
          if (userData.user) {
            setSelectedConversation({
              partnerId: toUserId,
              partnerName: userData.user.fullName,
              partnerImage: userData.user.profileImage,
              lastMessage: '',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [toUserId])

  const fetchMessages = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/messages?partnerId=${partnerId}`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchConversations()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router, fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages
  useEffect(() => {
    if (!selectedConversation) return
    
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.partnerId)
    }, 5000) // Poll every 5 seconds
    
    return () => clearInterval(interval)
  }, [selectedConversation])

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    fetchMessages(conv.partnerId)
    // Update URL without navigation
    window.history.replaceState({}, '', `/messages?to=${conv.partnerId}`)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return
    
    setIsSending(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.partnerId,
          content: newMessage,
        }),
      })
      setNewMessage('')
      fetchMessages(selectedConversation.partnerId)
      fetchConversations()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex">
      {/* Conversations List */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Start a conversation with a farmer</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 text-left ${
                  selectedConversation?.partnerId === conv.partnerId ? 'bg-green-50' : ''
                }`}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-green-100 flex-shrink-0">
                  {conv.partnerImage ? (
                    <Image src={conv.partnerImage} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-green-600 font-bold">
                      {conv.partnerName.charAt(0)}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{conv.partnerName}</p>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'Start chatting...'}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(conv.lastMessageTime)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-green-100">
              {selectedConversation.partnerImage ? (
                <Image 
                  src={selectedConversation.partnerImage} 
                  alt="" 
                  width={40}
                  height={40}
                  className="object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-green-600 font-bold">
                  {selectedConversation.partnerName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedConversation.partnerName}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      msg.senderId === session?.user?.id
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === session?.user?.id ? 'text-green-100' : 'text-gray-400'
                    }`}>
                      {formatRelativeTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="rounded-full w-12 h-12 p-0"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}
