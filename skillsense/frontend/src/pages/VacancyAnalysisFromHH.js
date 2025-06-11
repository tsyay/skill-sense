import React, { useState } from 'react';
import axios from 'axios';
import hhAreas from '../assets/hh_areas.json';
import styles from './VacancyAnalysisFromHH.module.css';

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
        setExpandedSkills({});
        
        try {
            // 1. Извлекаем город из запроса
            const cityResponse = await axios.post('http://127.0.0.1:8000/api/extract-city/', {
                query: query
            });
            
            // Очищаем название города от возможных JSON-артефактов
            let extractedCity = cityResponse.data.city;
            if (typeof extractedCity === 'string') {
                extractedCity = extractedCity
                    .replace(/`/g, '')
                    .replace(/\./g, '')
                    .replace(/[\u200B-\u200D\uFEFF]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            
            if (!extractedCity) {
                throw new Error('Не удалось определить город из запроса');
            }
            
            // 2. Находим ID города в базе HH.ru
            const result = findCity(extractedCity, areas);
            if (!result) {
                throw new Error(`Город "${extractedCity}" не найден в базе данных`);
            }
            
            // 3. Извлекаем профессию из запроса
            const roleResponse = await axios.post('http://127.0.0.1:8000/api/extract-professional-role/', {
                query: query
            });
            
            const extractedRole = roleResponse.data.role?.trim();
            if (!extractedRole) {
                throw new Error('Не удалось определить профессию из запроса');
            }

            // Устанавливаем найденные данные
            setFoundCity(result);
            setJobTitle(extractedRole);

            // Ждем обновления состояния
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 4. Ищем вакансии и собираем требования
            const requirements = await searchVacancies();
            
            if (!requirements || requirements.length === 0) {
                throw new Error('Не удалось найти требования в вакансиях');
            }

            // 5. Анализируем собранные требования
            const analysisResult = await analyzeVacancies(requirements);
            
            if (!analysisResult) {
                throw new Error('Не удалось проанализировать требования');
            }

            // Устанавливаем результат анализа
            setAnalysisResult(analysisResult);
            
            // Очищаем поля после успешного анализа
            setQuery("");
            setFoundCity(null);
            setJobTitle("");
            
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

    const searchVacancies = async () => {
        if (!foundCity || !jobTitle.trim()) {
            console.error('Missing required data:', { foundCity, jobTitle });
            return [];
        }
        
        try {
            const response = await axios.get(`${HH_API_BASE_URL}/vacancies`, {
                params: {
                    area: foundCity.city.id,
                    experience: "noExperience",
                    text: jobTitle,
                    per_page: 20
                },
            });
            
            if (!response.data || !response.data.items) {
                throw new Error('Некорректный ответ от API вакансий');
            }

            setVacancyCount(response.data.items.length);

            // Собираем требования из вакансий
            const requirements = response.data.items
                .map(vacancy => {
                    const requirements = [];
                    if (vacancy.snippet?.requirement) {
                        requirements.push(vacancy.snippet.requirement);
                    }
                    if (vacancy.snippet?.responsibility) {
                        requirements.push(vacancy.snippet.responsibility);
                    }
                    return requirements.join(' ');
                })
                .filter(req => req.trim().length > 0);

            if (requirements.length === 0) {
                throw new Error('Не найдено требований в вакансиях');
            }

            return requirements;

        } catch (error) {
            console.error('Error searching vacancies:', error);
            throw new Error('Ошибка при поиске вакансий: ' + error.message);
        }
    };

    const analyzeVacancies = async (requirements) => {
        try {
            const combinedPrompt = requirements.join('\n---\n');

            const response = await axios.post('http://127.0.0.1:8000/api/analyze-vacancy/', {
                prompt: `Проанализируй следующие требования из вакансий ${jobTitle}  и выдели общие навыки и требования, которые встречаются чаще всего, игнорируй все, что по твоему не относится к этой профессии:\n\n${combinedPrompt}`
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
            throw new Error('Ошибка при анализе требований');
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
            <div className={styles.skillsSection}>
                <h4 className={styles.skillsTitle}>{title}</h4>
                <div className={styles.skillsGrid}>
                    {skills.map((skill, index) => {
                        const isExpanded = expandedSkills[`${skillType}-${index}`];
                        return (
                            <div 
                                key={index} 
                                className={styles.skillCard}
                                onClick={() => toggleSkill(skillType, index)}
                            >
                                <div className={styles.skillHeader}>
                                    <h5 className={styles.skillName}>{skill.name}</h5>
                                    <span className={styles.expandIcon}>
                                        {isExpanded ? '▼' : '▶'}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div className={styles.skillContent}>
                                        <div>
                                            <h6 className={styles.skillDescriptionTitle}>Описание:</h6>
                                            <p className={styles.skillDescription}>{skill.description}</p>
                                        </div>
                                        <div className={styles.learningSection}>
                                            <h6 className={styles.learningTitle}>Как освоить:</h6>
                                            <p className={styles.learningText}>{skill.how_to_learn}</p>
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
        <div className={styles.container}>
            <h1 className={styles.title}>
                Анализ вакансий с <span>искусственным интеллектом</span>
            </h1>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}
            
            <div className={styles.querySection}>
                <h3 className={styles.queryTitle}>Введите ваш запрос</h3>
                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Например: Ищу работу Python разработчика в Москве"
                        className={styles.queryInput}
                    />
                    <button 
                        onClick={handleQuerySubmit}
                        disabled={isLoading}
                        className={styles.submitButton}
                    >
                        {isLoading ? 'Обработка...' : 'Анализировать'}
                    </button>
                </div>
            </div>
            
            {isLoading && (
                <div className={styles.spinnerContainer}>
                    <div className={styles.spinner} />
                    <div className={styles.spinnerText}>
                        Анализируем вакансии и выделяем ключевые навыки...
                    </div>
                </div>
            )}
            
            {foundCity && !isLoading && (
                <div className={styles.querySection}>
                    <div className={styles.cityInfo}>
                        <p className={styles.cityInfoTitle}>Найден город:</p>
                        <p>ID: {foundCity.city.id}</p>
                        <p>Название: {foundCity.city.name}</p>
                        <p>Регион: {foundCity.region.name}</p>
                    </div>

                    <div>
                        <h3 className={styles.queryTitle}>Найдена профессия:</h3>
                        <p className={styles.professionInfo}>{jobTitle}</p>
                    </div>
                </div>
            )}

            {analysisResult && !isLoading && (
                <div className={styles.analysisSection}>
                    <div className={styles.vacancyCount}>
                        Проанализировано вакансий: {vacancyCount}
                    </div>
                    <div className={styles.analysisContainer}>
                        <h3 className={styles.analysisTitle}>Результаты анализа:</h3>
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