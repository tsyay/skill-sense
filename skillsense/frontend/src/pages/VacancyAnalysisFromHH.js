import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HH_API_BASE_URL = 'https://api.hh.ru';

const VacancyAnalysisFromHH = () => {
    const [areas, setAreas] = useState([]);
    const [city, setCity] = useState("");
    const [foundCity, setFoundCity] = useState(null);
    const [jobTitle, setJobTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [vacancyCount, setVacancyCount] = useState(0);

    useEffect(() => {
        // Загружаем список регионов
        console.log('Fetching areas from HH.ru API...');
        axios.get(`${HH_API_BASE_URL}/areas`)
            .then(response => {
                console.log('Areas response:', response.data);
                setAreas(response.data);
            })
            .catch(error => {
                console.error('Error fetching areas:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                setError('Ошибка при загрузке списка регионов: ' + error.message);
            });
    }, []);

    const handleCitySearch = () => {
        if (city.trim() === "") return;
        const result = findCity(city, areas);
        setFoundCity(result);
    };

    function findCity(cityName, data) {
        const exactMatch = findExactMatch(cityName, data);
        if (exactMatch) return exactMatch;
        return findPartialMatch(cityName, data);
    }

    function findExactMatch(cityName, data) {
        for (const region of data) {
            if (region.areas && Array.isArray(region.areas)) {
                const foundCity = region.areas.find(area => 
                    area.name.toLowerCase() === cityName.toLowerCase()
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
        for (const region of data) {
            if (region.areas && Array.isArray(region.areas)) {
                const foundCity = region.areas.find(area => 
                    area.name.toLowerCase().includes(cityName.toLowerCase())
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
            // Создаем единый промпт из всех вакансий
            const combinedPrompt = vacancies.map((vacancy, index) => `
                ${vacancy.snippet?.requirement || ''}
                ---
            `).join('\n');

            const response = await axios.post('http://127.0.0.1:8000/api/analyze-vacancy/', {
                prompt: `Проанализируй следующие вакансии и выдели общие навыки и требования, которые встречаются чаще всего:\n\n${combinedPrompt}`
            });

            return response.data;
        } catch (error) {
            console.error('Error analyzing vacancies:', error);
            return 'Ошибка при анализе вакансий';
        }
    };

    const searchVacancies = async () => {
        if (!foundCity || !jobTitle.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setAnalysisResult('');
        setVacancyCount(0);
        
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
        } finally {
            setIsLoading(false);
        }
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
                <h3 className="text-xl font-semibold mb-2">Поиск города</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Введите название города или региона"
                        className="flex-1 p-2 border rounded"
                    />
                    <button 
                        onClick={handleCitySearch}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Поиск города
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
                        <h3 className="text-xl font-semibold mb-2">Поиск вакансий</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="Введите название должности"
                                className="flex-1 p-2 border rounded"
                            />
                            <button 
                                onClick={searchVacancies}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded text-white ${
                                    isLoading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                                {isLoading ? 'Поиск и анализ...' : 'Найти и проанализировать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {analysisResult && (
                <div className="mt-8">
                    <div className="mb-4 text-gray-600">
                        Проанализировано вакансий: {vacancyCount}
                    </div>
                    <div className="p-6 bg-white rounded-lg shadow-sm border">
                        <h3 className="text-2xl font-semibold mb-4">Результаты анализа:</h3>
                        <div className="prose max-w-none">
                            <p className="whitespace-pre-wrap">{analysisResult}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VacancyAnalysisFromHH; 