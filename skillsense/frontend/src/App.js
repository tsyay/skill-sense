import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/header';
import Analyzer from './pages/analyzer';
import MainPage from './pages/mainPage';
import VacancyAnalysis from './pages/VacancyAnalysis';
import VacancyAnalysisFromHH from './pages/VacancyAnalysisFromHH';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/" element={<MainPage />} />
          <Route path="/vacancy-analysis" element={<VacancyAnalysis />} />
          <Route path="/vacancy-analysis-hh" element={<VacancyAnalysisFromHH />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
