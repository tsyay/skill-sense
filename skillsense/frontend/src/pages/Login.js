import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Login.module.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://127.0.0.1:8000/auth/login/', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            // Сохраняем токены в localStorage
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Перенаправляем на главную страницу
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Произошла ошибка при входе');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h1 className={styles.title}>Вход</h1>
                {error && <div className={styles.error}>{error}</div>}
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username">Имя пользователя</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className={styles.input}
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={styles.input}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
                <div className={styles.registerLink}>
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </div>
            </div>
        </div>
    );
};

export default Login; 