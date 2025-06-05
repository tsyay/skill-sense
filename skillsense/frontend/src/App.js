import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/header';
import Analyzer from './pages/analyzer';
import MainPage from './pages/mainPage';
import VacancyAnalysis from './pages/VacancyAnalysis';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/" element={<MainPage />} />
          <Route path="/vacancy-analysis" element={<VacancyAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
