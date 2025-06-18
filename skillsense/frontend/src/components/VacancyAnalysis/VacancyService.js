import axios from 'axios';

const HH_API_BASE_URL = 'https://api.hh.ru';

const VacancyService = () => {
    const searchVacancies = async (foundCity, jobTitle) => {
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

    const analyzeVacancies = async (requirements, jobTitle) => {
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

    return {
        searchVacancies,
        extractRequirements,
        calculateAverageSalary,
        formatSalaryInfo,
        analyzeVacancies
    };
};

export default VacancyService; 