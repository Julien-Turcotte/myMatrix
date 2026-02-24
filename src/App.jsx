import { useState, useCallback } from 'react';
import BootScreen from './components/BootScreen';
import LoginScreen from './components/LoginScreen';
import MainLayout from './components/MainLayout';
import { useMatrix } from './hooks/useMatrix';
import './App.css';

const SCREEN = {
  BOOT: 'boot',
  LOGIN: 'login',
  MAIN: 'main',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.BOOT);
  const {
    client,
    syncState,
    rooms,
    activeRoomId,
    messages,
    typingUsers,
    error,
    login,
    logout,
    selectRoom,
    sendMessage,
    joinRoom,
    leaveRoom,
    sendTyping,
    getUnreadCount,
  } = useMatrix();

  const handleBootDone = useCallback(() => {
    setScreen(SCREEN.LOGIN);
  }, []);

  const handleLogin = useCallback(async (credentials) => {
    await login(credentials);
    setScreen(SCREEN.MAIN);
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
    setScreen(SCREEN.LOGIN);
  }, [logout]);

  return (
    <div className="app">
      {screen === SCREEN.BOOT && (
        <BootScreen onDone={handleBootDone} />
      )}
      {screen === SCREEN.LOGIN && (
        <LoginScreen onLogin={handleLogin} error={error} />
      )}
      {screen === SCREEN.MAIN && (
        <MainLayout
          client={client}
          rooms={rooms}
          activeRoomId={activeRoomId}
          messages={messages}
          typingUsers={typingUsers}
          syncState={syncState}
          onSelectRoom={selectRoom}
          onSendMessage={sendMessage}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
          onLogout={handleLogout}
          sendTyping={sendTyping}
          getUnreadCount={getUnreadCount}
        />
      )}
    </div>
  );
}
