import React, { useState, useEffect } from 'react';
import hhAreas from '../assets/hh_areas.json';
import styles from '../styles/VacancyAnalysisFromHH.module.css';
import CitySearch from '../components/VacancyAnalysis/CitySearch';
import VacancyService from '../components/VacancyAnalysis/VacancyService';
import ChatMessages from '../components/VacancyAnalysis/ChatMessages';
import QueryInput from '../components/VacancyAnalysis/QueryInput';

const VacancyAnalysisFromHH = () => {
    const [areas, setAreas] = useState(hhAreas);
    const [query, setQuery] = useState("");
    const [foundCity, setFoundCity] = useState(null);
    const [extractedCity, setExtractedCity] = useState(null);
    const [jobTitle, setJobTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [vacancyCount, setVacancyCount] = useState(0);
    const [expandedSkills, setExpandedSkills] = useState({});
    const [isResultAnimating, setIsResultAnimating] = useState(false);

    // Инициализируем сервисы
    const citySearch = CitySearch({ query, areas, onError: setError });
    const vacancyService = VacancyService();

    const handleQuerySubmit = async () => {
        if (query.trim() === "") return;
        
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setVacancyCount(0);
        setExpandedSkills({});
        setExtractedCity(null);
        
        try {
            // 1. Извлекаем город и профессию
            const cityData = await citySearch.extractCityAndRole();
            if (!cityData) {
                throw new Error('Не удалось извлечь данные о городе и профессии');
            }

            // Устанавливаем найденные данные
            setFoundCity(cityData.foundCity);
            setExtractedCity(cityData.extractedCity);
            setJobTitle(cityData.jobTitle);

            // Ждем обновления состояния
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 2. Ищем вакансии
            const vacancies = await vacancyService.searchVacancies(cityData.foundCity, cityData.jobTitle);
            setVacancyCount(vacancies.length);
            
            // 3. Вычисляем среднюю зарплату и диапазон
            const salaryData = vacancyService.calculateAverageSalary(vacancies);
            const formattedSalary = vacancyService.formatSalaryInfo(salaryData);
            
            // 4. Извлекаем требования из вакансий
            const requirements = vacancyService.extractRequirements(vacancies);

            // 5. Анализируем собранные требования
            const analysisResult = await vacancyService.analyzeVacancies(requirements, cityData.jobTitle);
            
            if (!analysisResult) {
                throw new Error('Не удалось проанализировать требования');
            }

            // Устанавливаем результат анализа вместе с информацией о зарплате
            setAnalysisResult({
                ...analysisResult,
                salary: formattedSalary
            });
            
            // Запускаем анимацию появления результатов
            setIsResultAnimating(true);
            setTimeout(() => setIsResultAnimating(false), 400);
            
            // Очищаем поля после успешного анализа
            setQuery("");
            setFoundCity(null);
            setExtractedCity(null);
            setJobTitle("");
            
        } catch (error) {
            console.error('Error processing query:', error);
            
            // Определяем тип ошибки и показываем соответствующее сообщение
            let errorMessage = error.message;
            
            if (error.response) {
                // Ошибка от сервера
                if (error.response.data && error.response.data.error) {
                    if (error.response.data.parse_error) {
                        // Детальная ошибка парсинга JSON
                        errorMessage = `Ошибка парсинга JSON: ${error.response.data.parse_error}`;
                        if (error.response.data.raw_response) {
                            console.error('Raw AI response:', error.response.data.raw_response);
                        }
                    } else {
                        errorMessage = error.response.data.error;
                    }
                } else if (error.response.status === 500) {
                    errorMessage = 'Внутренняя ошибка сервера. Попробуйте позже.';
                } else if (error.response.status === 404) {
                    errorMessage = 'Сервис временно недоступен. Попробуйте позже.';
                }
            } else if (error.request) {
                // Ошибка сети
                errorMessage = 'Ошибка соединения с сервером. Проверьте интернет-соединение.';
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                Анализ вакансий с <span>искусственным интеллектом</span>
            </h1>

            <div className={styles.chatContainer}>
                <ChatMessages 
                    error={error}
                    foundCity={foundCity}
                    jobTitle={jobTitle}
                    isLoading={isLoading}
                    analysisResult={analysisResult}
                    vacancyCount={vacancyCount}
                    extractedCity={extractedCity}
                    foundCityData={foundCity}
                    isResultAnimating={isResultAnimating}
                />
            </div>

            <QueryInput 
                query={query}
                setQuery={setQuery}
                handleQuerySubmit={handleQuerySubmit}
                isLoading={isLoading}
            />
        </div>
    );
};

export default VacancyAnalysisFromHH; 