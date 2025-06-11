import React, { useState } from 'react';
import axios from 'axios';
import hhAreas from '../assets/hh_areas.json';

const HH_API_BASE_URL = 'https://api.hh.ru';

const VacancyAnalysisFromHH = () => {
    const [areas, setAreas] = useState(hhAreas);
    const [query, setQuery] = useState("");
    const [foundCity, setFoundCity] = useState(null);
    const [jobTitle, setJobTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [vacancyCount, setVacancyCount] = useState(0);
    const [expandedSkills, setExpandedSkills] = useState({});

    const handleQuerySubmit = async () => {
        if (query.trim() === "") return;
        
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setVacancyCount(0);
        
        try {
            // Используем локальный файл с регионами
            console.log('Using local areas data...');
            console.log('All regions and areas:', JSON.stringify(areas, null, 2));
            

            // 1. Извлекаем город из запроса
            const cityResponse = await axios.post('http://127.0.0.1:8000/api/extract-city/', {
                query: query
            });
            
            // Очищаем название города от возможных JSON-артефактов
            let extractedCity = cityResponse.data.city;
            if (typeof extractedCity === 'string') {
                // Удаляем все, что похоже на JSON
                extractedCity = extractedCity.split('{')[0].split('}')[0].split('[')[0].split(']')[0];
                // Удаляем обратные кавычки, точки, невидимые символы и лишние пробелы
                extractedCity = extractedCity
                    .replace(/`/g, '')
                    .replace(/\./g, '')
                    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Удаляем zero-width spaces и другие невидимые символы
                    .replace(/\s+/g, ' ') // Заменяем все пробельные символы на один пробел
                    .trim();
            }
            
            if (!extractedCity) {
                throw new Error('Не удалось определить город из запроса');
            }
            
            console.log('Extracted city:', extractedCity); // Для отладки
            
            // 2. Находим ID города в базе HH.ru
            const result = findCity(extractedCity, areas);
            if (!result) {
                throw new Error(`Город "${extractedCity}" не найден в базе данных`);
            }
            
            setFoundCity(result);
            
            // 3. Извлекаем профессию из запроса
            const roleResponse = await axios.post('http://127.0.0.1:8000/api/extract-professional-role/', {
                query: query
            });
            
            const extractedRole = roleResponse.data.role?.trim();
            if (!extractedRole) {
                throw new Error('Не удалось определить профессию из запроса');
            }
            
            setJobTitle(extractedRole);
            
            // 4. Ищем и анализируем вакансии
            await searchVacancies();
            
        } catch (error) {
            console.error('Error processing query:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    function findCity(cityName, data) {
        const trimmedCityName = cityName
            .trim()
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Удаляем zero-width spaces и другие невидимые символы
            .replace(/\s+/g, ' ')
            .toLowerCase();
        const exactMatch = findExactMatch(trimmedCityName, data);
        if (exactMatch) return exactMatch;
        return findPartialMatch(trimmedCityName, data);
    }

    function findExactMatch(cityName, data) {
        const trimmedCityName = cityName
            .trim()
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Удаляем zero-width spaces и другие невидимые символы
            .replace(/\s+/g, ' ')
            .toLowerCase();
        for (const region of data) {
            if (region.areas && Array.isArray(region.areas)) {
                const foundCity = region.areas.find(area => 
                    area.name
                        .trim()
                        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Удаляем zero-width spaces и другие невидимые символы
                        .replace(/\s+/g, ' ')
                        .toLowerCase() === trimmedCityName
                );
                
                if (foundCity) {
                    return {
                        city: foundCity,
                        region: {
                            id: region.id,
                            name: region.name
                        }
                    };
                }
                
                for (const area of region.areas) {
                    if (area.areas && Array.isArray(area.areas)) {
                        const foundInSubarea = findExactMatch(cityName, [area]);
                        if (foundInSubarea) return foundInSubarea;
                    }
                }
            }
        }
        return null;
    }

    function findPartialMatch(cityName, data) {
        const trimmedCityName = cityName
            .trim()
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Удаляем zero-width spaces и другие невидимые символы
            .replace(/\s+/g, ' ')
            .toLowerCase();
        for (const region of data) {
            if (region.areas && Array.isArray(region.areas)) {
                const foundCity = region.areas.find(area => 
                    area.name
                        .trim()
                        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Удаляем zero-width spaces и другие невидимые символы
                        .replace(/\s+/g, ' ')
                        .toLowerCase()
                        .includes(trimmedCityName)
                );
                
                if (foundCity) {
                    return {
                        city: foundCity,
                        region: {
                            id: region.id,
                            name: region.name
                        }
                    };
                }
                
                for (const area of region.areas) {
                    if (area.areas && Array.isArray(area.areas)) {
                        const foundInSubarea = findPartialMatch(cityName, [area]);
                        if (foundInSubarea) return foundInSubarea;
                    }
                }
            }
        }
        return null;
    }

    const analyzeVacancies = async (vacancies) => {
        try {
            const combinedPrompt = vacancies.map((vacancy, index) => `
                ${vacancy.snippet?.requirement || ''}
                ---
            `).join('\n');

            const response = await axios.post('http://127.0.0.1:8000/api/analyze-vacancy/', {
                prompt: `Проанализируй следующие вакансии и выдели общие навыки и требования, которые встречаются чаще всего:\n\n${combinedPrompt}`
            });

            // Log the raw response for debugging
            console.log('Raw response:', response.data);

            // Clean the response string by removing backticks and any extra whitespace
            let cleanedResponse = response.data;
            
            // Remove markdown code block markers if they exist
            if (typeof cleanedResponse === 'string') {
                // Remove any markdown code block markers
                cleanedResponse = cleanedResponse
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .replace(/`/g, '')  // Remove any remaining backticks
                    .trim();

                // Log the cleaned response for debugging
                console.log('Cleaned response:', cleanedResponse);

                try {
                    // Parse the cleaned JSON string into an object
                    const skillsData = JSON.parse(cleanedResponse);
                    return skillsData;
                } catch (parseError) {
                    console.error('JSON Parse error:', parseError);
                    console.error('Failed to parse string:', cleanedResponse);
                    throw new Error('Failed to parse skills data');
                }
            } else {
                // If response is already an object, return it directly
                return cleanedResponse;
            }
        } catch (error) {
            console.error('Error analyzing vacancies:', error);
            return null;
        }
    };

    const searchVacancies = async () => {
        if (!foundCity || !jobTitle.trim()) return;
        
        console.log('Searching vacancies with params:', {
            area: foundCity.city.id,
            text: jobTitle
        });

        try {
            const response = await axios.get(`${HH_API_BASE_URL}/vacancies`, {
                params: {
                    area: foundCity.city.id,
                    experience: "noExperience",
                    text: jobTitle,
                    per_page: 20
                },
            });
            
            console.log('Vacancies response:', {
                total: response.data.found,
                pages: response.data.pages,
                items: response.data.items.length
            });
            
            setVacancyCount(response.data.items.length);

            // Анализируем все вакансии вместе
            const result = await analyzeVacancies(response.data.items);
            setAnalysisResult(result);

        } catch (error) {
            console.error('Error searching vacancies:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            });
            
            let errorMessage = 'Ошибка при поиске вакансий: ';
            if (error.response?.status === 429) {
                errorMessage += 'Превышен лимит запросов. Попробуйте позже.';
            } else if (error.response?.data?.errors) {
                errorMessage += error.response.data.errors.map(err => err.value).join(', ');
            } else {
                errorMessage += error.message;
            }
            
            setError(errorMessage);
        }
    };

    const toggleSkill = (skillType, index) => {
        const key = `${skillType}-${index}`;
        setExpandedSkills(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const renderSkillsSection = (title, skills, skillType) => {
        if (!skills || skills.length === 0) return null;

        return (
            <div className="mb-8">
                <h4 className="text-xl font-semibold mb-4">{title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map((skill, index) => {
                        const isExpanded = expandedSkills[`${skillType}-${index}`];
                        return (
                            <div 
                                key={index} 
                                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => toggleSkill(skillType, index)}
                            >
                                <div className="flex items-center justify-between">
                                    <h5 className="text-lg font-medium text-blue-600">{skill.name}</h5>
                                    <span className="text-blue-500">
                                        {isExpanded ? '▼' : '▶'}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <h6 className="text-sm font-medium text-gray-700 mb-1">Описание:</h6>
                                            <p className="text-gray-600">{skill.description}</p>
                                        </div>
                                        <div className="bg-blue-50 rounded p-3">
                                            <h6 className="text-sm font-medium text-blue-800 mb-1">Как освоить:</h6>
                                            <p className="text-sm text-blue-700">{skill.how_to_learn}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Анализ вакансий с HH.ru</h1>

            {error && (
                <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            
            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Введите ваш запрос</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Например: Ищу работу Python разработчика в Москве"
                        className="flex-1 p-2 border rounded"
                    />
                    <button 
                        onClick={handleQuerySubmit}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded text-white ${
                            isLoading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {isLoading ? 'Обработка...' : 'Анализировать'}
                    </button>
                </div>
            </div>
            
            {foundCity && (
                <div className="mb-6">
                    <div className="p-4 bg-gray-50 rounded mb-4">
                        <p className="font-semibold">Найден город:</p>
                        <p>ID: {foundCity.city.id}</p>
                        <p>Название: {foundCity.city.name}</p>
                        <p>Регион: {foundCity.region.name}</p>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-2">Найдена профессия:</h3>
                        <p className="p-4 bg-gray-50 rounded">{jobTitle}</p>
                    </div>
                </div>
            )}

            {analysisResult && (
                <div className="mt-8">
                    <div className="mb-4 text-gray-600">
                        Проанализировано вакансий: {vacancyCount}
                    </div>
                    <div className="p-6 bg-white rounded-lg shadow-sm border">
                        <h3 className="text-2xl font-semibold mb-6">Результаты анализа:</h3>
                        <div className="space-y-8">
                            {renderSkillsSection("Hard Skills (Профессиональные навыки)", analysisResult.hard_skills, 'hard')}
                            {renderSkillsSection("Soft Skills (Гибкие навыки)", analysisResult.soft_skills, 'soft')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VacancyAnalysisFromHH; 