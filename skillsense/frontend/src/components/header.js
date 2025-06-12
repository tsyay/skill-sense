import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './header.module.css';

const Header = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('access_token');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>
                    SkillSense
                </Link>
                <nav className={styles.nav}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/vacancy-analysis-hh" className={styles.navLink}>
                                Анализ
                            </Link>
                            <button onClick={handleLogout} className={styles.logoutButton}>
                                Выйти
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={styles.navLink}>
                                Вход
                            </Link>
                            <Link to="/register" className={styles.navLink}>
                                Регистрация
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
