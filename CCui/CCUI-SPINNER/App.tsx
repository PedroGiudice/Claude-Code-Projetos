
import React from 'react';
import CCuiLayout from './src/components/ccui/CCuiLayout.jsx';
import { AuthProvider } from './src/contexts/AuthContext.jsx';
import { WebSocketProvider } from './src/contexts/WebSocketContext.jsx';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <CCuiLayout />
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;
