import React, { useState } from 'react';
import { useNavigate, Link, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const RegisterPage: React.FC = () => {
    const { role } = useParams<{ role: 'mentee' | 'mentor' }>();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [neurodivergence, setNeurodivergence] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    if (!role || !['mentee', 'mentor'].includes(role)) {
        return <Navigate to="/register/mentee" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await register({ name, email, password, neurodivergence }, role);
            navigate('/', { replace: true });
        } catch (err) {
            setError('Hubo un error en el registro. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const title = role === 'mentor' ? 'Conviértete en Mentora' : 'Crea tu Cuenta de Mentoreada';

    return (
        <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
            <Card className="max-w-md w-full">
                <Link to="/" className="flex justify-center mb-6 font-bold text-3xl cursor-pointer text-primary">
                    MentorHer
                </Link>
                <h1 className="text-2xl font-bold text-center mb-6">{title}</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre Completo</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                            required
                        />
                    </div>
                    {role === 'mentee' && (
                        <div>
                            <label htmlFor="neurodivergence" className="block text-sm font-medium mb-1">
                                Discapacidad o Neurodivergencia (Opcional)
                            </label>
                            <input
                                id="neurodivergence"
                                type="text"
                                value={neurodivergence}
                                onChange={(e) => setNeurodivergence(e.target.value)}
                                className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                placeholder="Ej: TDAH, Dislexia, Espectro Autista"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Esta información es confidencial y solo se compartirá con tu mentora una vez conectadas.
                            </p>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full !mt-6" size="lg" disabled={isLoading}>
                        {isLoading ? 'Creando cuenta...' : 'Registrarse'}
                    </Button>
                </form>
                 <p className="text-center text-sm text-muted-foreground mt-6">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                        Inicia Sesión
                    </Link>
                </p>
            </Card>
        </div>
    );
};

export default RegisterPage;