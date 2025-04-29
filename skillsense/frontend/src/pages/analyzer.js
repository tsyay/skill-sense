import React from 'react';
import '../styles/analyzer.css';
import YandexGPTForm from '../components/YandexGPTForm';
import HHru from '../components/hhru';
const Analyzer = () => {
  return (
    <div className="analyzer-container">
      <div className="analyzer-content">
        <h1 className="analyzer-title">SkillSense Analyzer</h1>
        <p className="analyzer-description">
          Введите ваш запрос для анализа навыков и компетенций. Наш сервис поможет определить 
          ключевые умения и предложит пути развития вашей карьеры.
        </p>
        <YandexGPTForm />
        <HHru />
      </div>
    </div>
  );
};

export default Analyzer;
