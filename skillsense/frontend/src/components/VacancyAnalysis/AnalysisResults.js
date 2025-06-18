import React from 'react';
import styles from '../../styles/VacancyAnalysisFromHH.module.css';

const AnalysisResults = ({ 
    analysisResult, 
    jobTitle, 
    vacancyCount, 
    extractedCity, 
    foundCity, 
    isResultAnimating 
}) => {
    if (!analysisResult) return null;

    return (
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
    );
};

export default AnalysisResults; 