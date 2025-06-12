import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Register.module.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: ''
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
            const response = await axios.post('http://127.0.0.1:8000/auth/register/', formData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/');
        } catch (err) {
            if (err.response?.data) {
                const errorData = err.response.data;
                if (typeof errorData === 'object') {
                    const errorMessages = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${value.join(', ')}`)
                        .join('\n');
                    setError(errorMessages);
                } else {
                    setError(errorData);
                }
            } else {
                setError('Произошла ошибка при регистрации');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h1 className={styles.title}>Регистрация</h1>
                {error && <div className={styles.error}>{error}</div>}
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.nameFields}>
                        <div className={styles.formGroup}>
                            <label htmlFor="first_name">Имя</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                className={styles.input}
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="last_name">Фамилия</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                className={styles.input}
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
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
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={styles.input}
                            value={formData.email}
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
                    <div className={styles.formGroup}>
                        <label htmlFor="password2">Подтвердите пароль</label>
                        <input
                            type="password"
                            id="password2"
                            name="password2"
                            className={styles.input}
                            value={formData.password2}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
                <div className={styles.loginLink}>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </div>
            </div>
        </div>
    );
};

export default Register; 