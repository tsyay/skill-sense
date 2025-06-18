import React from 'react';
import styles from '../../styles/VacancyAnalysisFromHH.module.css';
import AnalysisResults from './AnalysisResults';

const ChatMessages = ({ 
    error, 
    foundCity, 
    jobTitle, 
    isLoading, 
    analysisResult, 
    vacancyCount, 
    extractedCity, 
    foundCityData, 
    isResultAnimating 
}) => {
    return (
        <>
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
                <AnalysisResults 
                    analysisResult={analysisResult}
                    jobTitle={jobTitle}
                    vacancyCount={vacancyCount}
                    extractedCity={extractedCity}
                    foundCity={foundCityData}
                    isResultAnimating={isResultAnimating}
                />
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
        </>
    );
};

export default ChatMessages; 