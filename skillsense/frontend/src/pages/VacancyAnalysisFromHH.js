import React, { useState, useEffect } from 'react';
import axios from 'axios';
import hhAreas from '../assets/hh_areas.json';
import styles from '../styles/VacancyAnalysisFromHH.module.css';

const HH_API_BASE_URL = 'https://api.hh.ru';

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
        
        return {
            average: formattedAverage,
            min: formattedMin,
            max: formattedMax
        };
    };

    const handleQuerySubmit = async () => {
        if (query.trim() === "") return;
        
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setVacancyCount(0);
        setExpandedSkills({});
        setExtractedCity(null);
        
        try {
            // 1. Извлекаем город из запроса
            const cityResponse = await axios.post('http://127.0.0.1:8000/api/extract-city/', {
                query: query
            });
            
            // Очищаем название города от возможных JSON-артефактов
            let extractedCityName = cityResponse.data.city;
            if (typeof extractedCityName === 'string') {
                extractedCityName = extractedCityName
                    .replace(/`/g, '')
                    .replace(/\./g, '')
                    .replace(/[\u200B-\u200D\uFEFF]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            
            if (!extractedCityName) {
                throw new Error('Не удалось определить город из запроса');
            }
            
            // 2. Находим ID города в базе HH.ru
            const result = findCity(extractedCityName, areas);
            if (!result) {
                throw new Error(`Город "${extractedCityName}" не найден в базе данных`);
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
            setExtractedCity(extractedCityName);
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

            console.log('Raw response:', response.data);

            // Проверяем, есть ли ошибка в ответе
            if (response.data.error) {
                console.error('API Error:', response.data);
                throw new Error(`Ошибка API: ${response.data.error}`);
            }

            // Если ответ уже является объектом (валидный JSON), возвращаем его
            if (typeof response.data === 'object' && response.data !== null) {
                return response.data;
            }

            // Если ответ - строка, пытаемся её распарсить
            if (typeof response.data === 'string') {
                let cleanedResponse = response.data;
                
                // Remove any markdown code block markers
                cleanedResponse = cleanedResponse
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .replace(/`/g, '') 
                    .trim();

                console.log('Cleaned response:', cleanedResponse);

                try {
                    const skillsData = JSON.parse(cleanedResponse);
                    return skillsData;
                } catch (parseError) {
                    console.error('JSON Parse error:', parseError);
                    console.error('Failed to parse string:', cleanedResponse);
                    throw new Error(`Ошибка парсинга JSON: ${parseError.message}. Полученный ответ: ${cleanedResponse.substring(0, 200)}...`);
                }
            }

            throw new Error('Неожиданный формат ответа от сервера');
        } catch (error) {
            console.error('Error analyzing vacancies:', error);
            if (error.response && error.response.data && error.response.data.error) {
                throw new Error(`Ошибка анализа: ${error.response.data.error}`);
            }
            throw new Error('Ошибка при анализе требований: ' + error.message);
        }
    };

    const toggleSkill = (skillType, index) => {
        const key = `${skillType}-${index}`;
        setExpandedSkills(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
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
                    <>
                        {/* Сообщение со статистикой */}
                        <div className={`${styles.analysisResult} ${isResultAnimating ? styles.fadeIn : ''}`}>
                            <div className={styles.resultHeader}>
                                <h3 className={styles.resultTitle}>{jobTitle}</h3>
                                <div className={styles.locationBadge}>
                                    Анализ {vacancyCount} вакансий 
                                </div>
                            </div>
                            
                            <div className={styles.resultContent}>
                                {/* Секция зарплаты */}
                                {analysisResult.salary && (
                                    <div className={styles.salarySection}>
                                        <h4 className={styles.sectionTitle}>Диапазон зарплат</h4>
                                        <div className={styles.salaryDisplay}>
                                            <span className={styles.salaryAmount}>
                                                {analysisResult.salary.average || 'N/A'}
                                            </span>
                                            <span className={styles.salaryCurrency}>₽</span>
                                        </div>
                                        <div className={styles.salaryRange}>
                                            от {analysisResult.salary.min} до {analysisResult.salary.max} ₽
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Сообщение с подробными навыками */}
                        <div className={`${styles.analysisResult} ${isResultAnimating ? styles.fadeIn : ''}`}>
                            <div className={styles.resultHeader}>
                                <h3 className={styles.resultTitle}>Подробная информация о навыках</h3>
                                <p className={styles.resultDescription}>
                                    Описания и способы изучения ключевых компетенций
                                </p>
                            </div>
                            
                            <div className={styles.resultContent}>
                                {/* Секция Hard Skills */}
                                {analysisResult.hard_skills && analysisResult.hard_skills.length > 0 && (
                                    <div className={styles.skillsSection}>
                                        <h4 className={styles.sectionTitle}>Hard Skills (Профессиональные навыки)</h4>
                                        <div className={styles.skillsList}>
                                            {analysisResult.hard_skills.map((skill, index) => (
                                                <div key={`hard-${index}`} className={styles.skillItem}>
                                                    <div className={styles.skillHeader}>
                                                        <h5 className={styles.skillName}>{skill.name}</h5>
                                                    </div>
                                                    <div className={styles.skillDetails}>
                                                        <p className={styles.skillDescription}>{skill.description}</p>
                                                        <div className={styles.learningInfo}>
                                                            <strong>Как освоить:</strong> {skill.how_to_learn}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Секция Soft Skills */}
                                {analysisResult.soft_skills && analysisResult.soft_skills.length > 0 && (
                                    <div className={styles.skillsSection}>
                                        <h4 className={styles.sectionTitle}>Soft Skills (Гибкие навыки)</h4>
                                        <div className={styles.skillsList}>
                                            {analysisResult.soft_skills.map((skill, index) => (
                                                <div key={`soft-${index}`} className={styles.skillItem}>
                                                    <div className={styles.skillHeader}>
                                                        <h5 className={styles.skillName}>{skill.name}</h5>
                                                    </div>
                                                    <div className={styles.skillDetails}>
                                                        <p className={styles.skillDescription}>{skill.description}</p>
                                                        <div className={styles.learningInfo}>
                                                            <strong>Как освоить:</strong> {skill.how_to_learn}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Сообщение со статистикой навыков */}
                        <div className={`${styles.analysisResult} ${isResultAnimating ? styles.fadeIn : ''}`}>
                            <div className={styles.resultHeader}>
                                <h3 className={styles.resultTitle}>Статистика навыков</h3>
                                <p className={styles.resultDescription}>
                                    Процент требований к навыкам в вакансиях
                                </p>
                            </div>
                            
                            <div className={styles.resultContent}>
                                <h4 className={styles.sectionTitle}>Требуемые навыки</h4>
                                
                                {/* Объединяем все навыки для статистики */}
                                {(() => {
                                    const allSkills = [];
                                    
                                    // Добавляем hard skills
                                    if (analysisResult.hard_skills) {
                                        analysisResult.hard_skills.forEach(skill => {
                                            allSkills.push({
                                                ...skill,
                                                type: 'hard'
                                            });
                                        });
                                    }
                                    
                                    // Добавляем soft skills
                                    if (analysisResult.soft_skills) {
                                        analysisResult.soft_skills.forEach(skill => {
                                            allSkills.push({
                                                ...skill,
                                                type: 'soft'
                                            });
                                        });
                                    }
                                    
                                    // Сортируем по проценту спроса
                                    allSkills.sort((a, b) => (b.demand || 0) - (a.demand || 0));
                                    
                                    return allSkills.map((skill, index) => (
                                        <div className={styles.skill} key={`stat-${index}`}>
                                            <div className={styles.row}> 
                                                <h3 className={styles.skillName}>{skill.name}</h3>
                                            </div>
                                            <progress 
                                                max={100} 
                                                value={skill.demand || 50}
                                                className={styles.progressBar}
                                            />
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </>
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