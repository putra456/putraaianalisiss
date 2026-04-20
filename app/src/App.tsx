import { useState, useCallback } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import ChatInterface from './components/ChatInterface'

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true)

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false)
  }, [])

  return (
    <>
      {showWelcome && <WelcomeScreen onComplete={handleWelcomeComplete} />}
      <ChatInterface />
    </>
  )
}
