import React, { useState } from 'react';
import axios from 'axios';
import hhAreas from '../assets/hh_areas.json';
import styles from '../styles/VacancyAnalysisFromHH.module.css';

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
            return response.data.items;

        } catch (error) {
            console.error('Error searching vacancies:', error);
            throw new Error('Ошибка при поиске вакансий: ' + error.message);
        }
    };

    const extractRequirements = (vacancies) => {
        if (!vacancies || vacancies.length === 0) {
            throw new Error('Нет вакансий для анализа');
        }

        // Собираем требования из вакансий
        const requirements = vacancies.map(vacancy => {
            const requirements = [];
            if (vacancy.snippet?.requirement) {
                requirements.push(vacancy.snippet.requirement);
            }
            if (vacancy.snippet?.responsibility) {
                requirements.push(vacancy.snippet.responsibility);
            }
            return requirements.join(' ');
        });

        const filteredRequirements = requirements.filter(req => req.trim().length > 0);

        if (filteredRequirements.length === 0) {
            throw new Error('Не найдено требований в вакансиях');
        }

        return filteredRequirements;
    };

    const calculateAverageSalary = (vacancies) => {
        if (!vacancies || vacancies.length === 0) {
            return null;
        }

        // Фильтруем вакансии с указанной зарплатой
        const salaries = vacancies
            .filter(vacancy => vacancy.salary)
            .map(vacancy => {
                const { salary } = vacancy;
                // Если указан диапазон, берем среднее значение
                if (salary.from && salary.to) {
                    return {
                        value: (salary.from + salary.to) / 2,
                        from: salary.from,
                        to: salary.to
                    };
                }
                // Если указана только нижняя граница
                if (salary.from) {
                    return {
                        value: salary.from,
                        from: salary.from,
                        to: null
                    };
                }
                // Если указана только верхняя граница
                if (salary.to) {
                    return {
                        value: salary.to,
                        from: null,
                        to: salary.to
                    };
                }
                return null;
            })
            .filter(salary => salary !== null);

        if (salaries.length === 0) {
            return null;
        }

        // Вычисляем среднее значение
        const sum = salaries.reduce((acc, salary) => acc + salary.value, 0);
        const average = Math.round(sum / salaries.length);

        // Находим минимальную и максимальную зарплату
        const minSalary = Math.min(...salaries.map(s => s.from || s.value));
        const maxSalary = Math.max(...salaries.map(s => s.to || s.value));

        return {
            average,
            range: {
                min: minSalary,
                max: maxSalary
            }
        };
    };

    const formatSalaryInfo = (salaryData) => {
        if (!salaryData) return null;
        
        const { average, range } = salaryData;
        const formattedAverage = average.toLocaleString();
        const formattedMin = range.min.toLocaleString();
        const formattedMax = range.max.toLocaleString();
        
        return `
            <div class="${styles.salaryInfo}">
                <p class="${styles.averageSalary}">${formattedAverage} ₽</p>
                <p class="${styles.salaryRange}">от ${formattedMin} до ${formattedMax} ₽</p>
            </div>
        `;
    };

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
            
            // 4. Ищем вакансии
            const vacancies = await searchVacancies();
            
            // 5. Вычисляем среднюю зарплату и диапазон
            const salaryData = calculateAverageSalary(vacancies);
            const formattedSalary = formatSalaryInfo(salaryData);
            
            // 6. Извлекаем требования из вакансий
            const requirements = extractRequirements(vacancies);

            // 7. Анализируем собранные требования
            const analysisResult = await analyzeVacancies(requirements);
            
            if (!analysisResult) {
                throw new Error('Не удалось проанализировать требования');
            }

            // Устанавливаем результат анализа вместе с информацией о зарплате
            setAnalysisResult({
                ...analysisResult,
                salary: formattedSalary
            });
            
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

            <div className={styles.chatContainer}>
                {error && (
                    <div className={`${styles.message} ${styles.assistantMessage}`}>
                        <div className={styles.messageContent}>
                            <div className={styles.messageHeader}>
                                <div className={`${styles.messageIcon} ${styles.assistantIcon}`}>AI</div>
                                <span>Ошибка</span>
                            </div>
                            <div className={styles.messageText}>{error}</div>
                        </div>
                    </div>
                )}

                {foundCity && !isLoading && (
                    <div className={`${styles.message} ${styles.assistantMessage}`}>
                        <div className={styles.messageContent}>
                            <div className={styles.messageHeader}>
                                <div className={`${styles.messageIcon} ${styles.assistantIcon}`}>AI</div>
                                <span>Информация о городе</span>
                            </div>
                            <div className={styles.messageText}>
                                <p>Город: {foundCity.city.name}</p>
                                <p>Регион: {foundCity.region.name}</p>
                                <p>Профессия: {jobTitle}</p>
                            </div>
                        </div>
                    </div>
                )}

                {analysisResult && !isLoading && (
                    <div className={`${styles.message} ${styles.assistantMessage}`}>
                        <div className={styles.messageContent}>
                            <div className={styles.messageHeader}>
                                <div className={`${styles.messageIcon} ${styles.assistantIcon}`}>AI</div>
                                <span>Результаты анализа</span>
                            </div>
                            <div className={styles.messageText}>
                                <p>Проанализировано вакансий: {vacancyCount}</p>
                                {analysisResult.salary && (
                                    <div dangerouslySetInnerHTML={{ __html: analysisResult.salary }} />
                                )}
                                <div className={styles.skillsSection}>
                                    {renderSkillsSection("Hard Skills (Профессиональные навыки)", analysisResult.hard_skills, 'hard')}
                                    {renderSkillsSection("Soft Skills (Гибкие навыки)", analysisResult.soft_skills, 'soft')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className={`${styles.message} ${styles.assistantMessage}`}>
                        <div className={styles.messageContent}>
                            <div className={styles.messageHeader}>
                                <div className={`${styles.messageIcon} ${styles.assistantIcon}`}>AI</div>
                                <span>Анализ</span>
                            </div>
                            <div className={styles.spinnerContainer}>
                                <div className={styles.spinner} />
                                <div className={styles.spinnerText}>
                                    Анализируем вакансии и выделяем ключевые навыки...
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.inputContainer}>
                <div className={styles.inputWrapper}>
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Например: Ищу работу Python разработчика в Москве"
                        className={styles.queryInput}
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleQuerySubmit();
                            }
                        }}
                    />
                    <button 
                        onClick={handleQuerySubmit}
                        disabled={isLoading}
                        className={styles.submitButton}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Обработка...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2L11 13" />
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                                </svg>
                                Анализировать
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VacancyAnalysisFromHH; 