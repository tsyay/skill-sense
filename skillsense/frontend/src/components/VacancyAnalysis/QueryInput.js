import React from 'react';
import styles from '../../styles/VacancyAnalysisFromHH.module.css';

const QueryInput = ({ 
    query, 
    setQuery, 
    handleQuerySubmit, 
    isLoading 
}) => {
    return (
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
    );
};

export default QueryInput; 