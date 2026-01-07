import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Dashboard } from './components/Dashboard';
import { AppView } from './types';

function App() {
  // State to manage which screen is visible
  // Defaults to Login screen
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);

  // TRANSITIONS
  const handleLoginSuccess = () => {
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentView(AppView.LOGIN);
  };
  
  const goToSignup = () => {
    setCurrentView(AppView.SIGNUP);
  };
  
  const goToLogin = () => {
    setCurrentView(AppView.LOGIN);
  };

  return (
    <div className="App">
      {currentView === AppView.LOGIN && (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onNavigateToSignup={goToSignup} 
        />
      )}
      
      {currentView === AppView.SIGNUP && (
        <SignupPage 
          onSignupSuccess={handleLoginSuccess} 
          onNavigateToLogin={goToLogin} 
        />
      )}
      
      {currentView === AppView.DASHBOARD && (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;