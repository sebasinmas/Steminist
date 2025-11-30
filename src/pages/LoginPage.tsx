import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { EyeIcon, EyeOffIcon } from '../components/common/Icons';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    if (isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch (err: any) {
            if (err.message === 'Invalid login credentials') {
                setError('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
            } else {
                setError('Error al iniciar sesión. Inténtalo de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
            <Card className="max-w-md w-full">
                <Link to="/" className="flex justify-center mb-6 font-bold text-3xl cursor-pointer text-primary">
                    MentorHer
                </Link>
                <h1 className="text-2xl font-bold text-center mb-2">Iniciar Sesión</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email de Demo</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            placeholder="mentora@demo.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1">Contraseña</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-border rounded-md bg-input text-foreground pr-10"
                                placeholder="Cualquier contraseña (o 'admin')"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                            >
                                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <Button type="submit" className="w-full !mt-6" size="lg" disabled={isLoading}>
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" className="font-semibold text-primary hover:underline">
                        Regístrate
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default LoginPage;