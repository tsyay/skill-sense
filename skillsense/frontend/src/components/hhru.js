import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HH_API_BASE_URL = 'https://api.hh.ru';

const HHru = () => {
  const [areas, setAreas] = useState([]);
  const [city, setCity] = useState("");
  const [foundCity, setFoundCity] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [vacancies, setVacancies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const searchVacancies = async () => {
    if (!foundCity || !jobTitle.trim()) return;
    
    setIsLoading(true);
    setError(null);
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
      
      setVacancies(response.data.items);
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
    <div>
      {error && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Поиск города</h3>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Введите название города или региона"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button onClick={handleCitySearch} style={{ padding: '8px 16px' }}>
          Поиск города
        </button>
      </div>
      
      {foundCity ? (
        <div>
          <p>Найден город:</p>
          <p>ID: {foundCity.city.id}</p>
          <p>Название: {foundCity.city.name}</p>
          <p>Регион: {foundCity.region.name}</p>

          <div style={{ marginTop: '20px' }}>
            <h3>Поиск вакансий</h3>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Введите название должности"
              style={{ padding: '8px', marginRight: '10px' }}
            />
            <button 
              onClick={searchVacancies} 
              style={{ padding: '8px 16px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Поиск...' : 'Найти вакансии'}
            </button>
          </div>

          {vacancies.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Найденные вакансии:</h3>
              {vacancies.map((vacancy, index) => (
                <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd' }}>
                  <h4>{vacancy.name}</h4>
                  <p>Компания: {vacancy.employer?.name}</p>
                  <p>Зарплата: {vacancy.salary?.from ? `от ${vacancy.salary.from}` : ''} {vacancy.salary?.to ? `до ${vacancy.salary.to}` : ''} {vacancy.salary?.currency || ''}</p>
                  <div style={{ marginTop: '10px' }}>
                    <h5>Описание:</h5>
                    <div 
                      style={{ 
                        maxHeight: '200px', 
                        overflow: 'auto',
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                      }}
                      dangerouslySetInnerHTML={{ __html: vacancy.snippet?.responsibility || vacancy.description || 'Описание отсутствует' }}
                    />
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <h5>Требования:</h5>
                    <div 
                      style={{ 
                        maxHeight: '200px', 
                        overflow: 'auto',
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                      }}
                      dangerouslySetInnerHTML={{ __html: vacancy.snippet?.requirement || 'Требования не указаны' }}
                    />
                  </div>
                  <a 
                    href={vacancy.alternate_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    Подробнее
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : city ? (
        <p>Город не найден</p>
      ) : null}
    </div>
  );
};

export default HHru;
  

