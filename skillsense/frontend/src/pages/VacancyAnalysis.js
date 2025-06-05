import React, { useState } from 'react';
import axios from 'axios';

const VacancyAnalysis = () => {
    const [vacancyText, setVacancyText] = useState('');
    const [analysisResult, setAnalysisResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            const response = await axios.post('http://127.0.0.1:8000/api/analyze-vacancy/', {
                prompt: vacancyText
            });
            setAnalysisResult(response.data);
        } catch (error) {
            console.error('Error analyzing vacancy:', error);
            setAnalysisResult('Произошла ошибка при анализе вакансии');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Анализ вакансии</h1>
            
            <div className="mb-6">
                <textarea
                    className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="6"
                    placeholder="Введите текст вакансии..."
                    value={vacancyText}
                    onChange={(e) => setVacancyText(e.target.value)}
                />
            </div>

            <button
                onClick={handleAnalyze}
                disabled={loading || !vacancyText}
                className={`px-6 py-3 rounded-lg text-white font-medium ${
                    loading || !vacancyText
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {loading ? 'Анализируем...' : 'Проанализировать'}
            </button>

            {analysisResult && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Результаты анализа:</h2>
                    <p className="whitespace-pre-wrap">{analysisResult}</p>
                </div>
            )}
        </div>
    );
};

export default VacancyAnalysis; 