import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/header';
import Analyzer from './pages/analyzer';
import MainPage from './pages/mainPage';
import VacancyAnalysis from './pages/VacancyAnalysis';
import VacancyAnalysisFromHH from './pages/VacancyAnalysisFromHH';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Защищенные маршруты */}
          <Route 
            path="/analyzer" 
            element={
              <ProtectedRoute>
                <Analyzer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vacancy-analysis" 
            element={
              <ProtectedRoute>
                <VacancyAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vacancy-analysis-hh" 
            element={
              <ProtectedRoute>
                <VacancyAnalysisFromHH />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
