import React from 'react';
import axios from 'axios';

const CitySearch = ({ query, areas, onCityFound, onError }) => {
    const findCity = (cityName, data) => {
        const trimmedCityName = cityName
            .trim()
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Удаляем zero-width spaces и другие невидимые символы
            .replace(/\s+/g, ' ')
            .toLowerCase();
        const exactMatch = findExactMatch(trimmedCityName, data);
        if (exactMatch) return exactMatch;
        return findPartialMatch(trimmedCityName, data);
    };

    const findExactMatch = (cityName, data) => {
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
    };

    const findPartialMatch = (cityName, data) => {
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
    };

    const extractCityAndRole = async () => {
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

            return {
                foundCity: result,
                extractedCity: extractedCityName,
                jobTitle: extractedRole
            };

        } catch (error) {
            onError(error.message);
            return null;
        }
    };

    return { extractCityAndRole };
};

export default CitySearch; 