import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3007', {
  autoConnect: false,
})

function App() {
  const [message, setMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [conversation, setConversation] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hello! I am ready when you are. What would you like to talk about?',
    },
  ])
  const conversationEndRef = useRef(null)

  useEffect(() => {
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)
    const handleResponse = (response) => {
      setConversation((currentConversation) => [
        ...currentConversation,
        { id: `${Date.now()}-assistant`, role: 'assistant', text: response },
      ])
      setIsWaiting(false)
    }
    const handleError = (errorMessage) => {
      setConversation((currentConversation) => [
        ...currentConversation,
        { id: `${Date.now()}-error`, role: 'assistant', text: errorMessage },
      ])
      setIsWaiting(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('ai-response', handleResponse)
    socket.on('ai-error', handleError)
    socket.connect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('ai-response', handleResponse)
      socket.off('ai-error', handleError)
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, isWaiting])

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setConversation((currentConversation) => [
      ...currentConversation,
      {
        id: Date.now(),
        role: 'user',
        text: trimmedMessage,
      },
    ])
    setMessage('')
    setIsWaiting(true)
    socket.emit('ai-message', trimmedMessage)
  }

  return (
    <main className="chat-shell">
      <header className="chat-header">
        <div className="brand-mark" aria-hidden="true">S</div>
        <div>
          <p className="eyebrow">Private workspace</p>
          <h1>Socket Chat</h1>
        </div>
        <span className={`status ${isConnected ? '' : 'offline'}`}>
          <span className="status-dot" /> {isConnected ? 'Online' : 'Offline'}
        </span>
      </header>

      <section className="conversation" aria-live="polite" aria-label="Conversation history">
        <div className="date-divider"><span>Today</span></div>
        {conversation.map((item) => (
          <article className={`message-row ${item.role}`} key={item.id}>
            {item.role === 'assistant' && <div className="avatar">S</div>}
            <div className="message-bubble">
              <p>{item.text}</p>
              <time>{item.role === 'user' ? 'You' : 'Assistant'}</time>
            </div>
          </article>
        ))}
        {isWaiting && (
          <article className="message-row assistant">
            <div className="avatar">S</div>
            <div className="message-bubble typing" aria-label="Assistant is thinking">
              <span /> <span /> <span />
            </div>
          </article>
        )}
        <div ref={conversationEndRef} />
      </section>

      <form className="composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="message-input">Write a message</label>
        <textarea
          id="message-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit(event)
            }
          }}
          placeholder="Write a message..."
          rows="1"
        />
        <button type="submit" aria-label="Send message" disabled={!message.trim() || !isConnected || isWaiting}>
          <span aria-hidden="true">&#8593;</span>
        </button>
        <p className="composer-hint">Press Enter to send <span>·</span> Shift + Enter for a new line</p>
      </form>
    </main>
  )
}

export default App
