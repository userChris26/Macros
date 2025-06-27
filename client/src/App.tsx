//import React from 'react';
// Redirect -> Navigate, Switch -> Routes
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CardPage from './pages/CardPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cards" element={<CardPage />} />
      </Routes>
    </Router>
  ); // <Navigate to="/" /> was removed from Routes
}


export default App;