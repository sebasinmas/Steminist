import React, { useState } from 'react';
import { useNavigate, Link, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { EyeIcon, EyeOffIcon } from '../components/common/Icons';
import { useProfileOptions } from '../hooks/useProfileOptions';

const RegisterPage: React.FC = () => {
    const { role } = useParams<{ role: 'mentee' | 'mentor' }>();

    // Step state
    const [step, setStep] = useState(1);

    // Form state
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [neurodivergence, setNeurodivergence] = useState('');

    // Step 2 state
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState('');
    const [experience, setExperience] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [goals, setGoals] = useState<string[]>([]);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, isLoggedIn } = useAuth();
    const { interests: interestOptions, mentorshipGoals: goalOptions, loading: optionsLoading } = useProfileOptions();
    const navigate = useNavigate();

    if (isLoggedIn) {
        return <Navigate to="/" replace />;
    }
    if (!role || !['mentee', 'mentor'].includes(role)) {
        return <Navigate to="/register/mentee" replace />;
    }

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            // CAMBIO: Validación de ambos campos
            if (!firstName || !lastName || !email || !password) {
                setError('Por favor completa todos los campos obligatorios.');
                return;
            }
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const handlePrevStep = () => {
        setStep(1);
        setError('');
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const registrationData = {
                first_name: firstName,
                last_name: lastName,
                name: `${firstName} ${lastName}`,
                email,
                role,
                password,
                neurodivergence,
                title: jobTitle,
                company,
                experience,
                interests,
                mentorshipGoals: goals,
                motivations: goals // Mapping for consistency
            };

            await register(registrationData, role);
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error("Registration error:", err);
            if (err.message && (err.message.includes('Password should be at least 6 characters') || err.message.includes('weak_password'))) {
                setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
            } else if (err.message && err.message.includes('User already registered')) {
                setError('Ya existe una cuenta con este correo electrónico.');
            } else {
                setError('Hubo un error en el registro. Por favor, intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const title = role === 'mentor' ? 'Conviértete en Mentora' : 'Crea tu Cuenta';
    const subtitle = step === 1 ? 'Paso 1: Credenciales' : 'Paso 2: Perfil Profesional';

    return (
        <div className="container mx-auto flex items-center justify-center min-h-screen px-4 py-8">
            <Card className="max-w-lg w-full">
                <Link to="/" className="flex justify-center mb-4 font-bold text-3xl cursor-pointer text-primary">
                    MentorHer
                </Link>

                {/* Progress Indicator */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center space-x-2">
                        <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-700'}`}></div>
                        <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-700'}`}></div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-1">{title}</h1>
                <p className="text-center text-muted-foreground mb-6">{subtitle}</p>

                <form onSubmit={handleNextStep} className="space-y-4">
                    {step === 1 && (
                        <>
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                    required
                                    autoFocus
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium mb-1">Apellido</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                    required
                                    placeholder="Tu apellido"
                                />
                            </div>
                            <div>
                                <label htmlFor="Correo Electrónico" className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                    required
                                    placeholder="Escribe tu correo electrónico"
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
                                        required
                                        placeholder="Escribe una contraseña"
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
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="jobTitle" className="block text-sm font-medium mb-1">Cargo / Título Profesional</label>
                                    <input
                                        id="jobTitle"
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                        placeholder="Ej: Estudiante de Ingeniería"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium mb-1">Empresa / Institución / Área</label>
                                    <input
                                        id="company"
                                        type="text"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                        placeholder="Ej: Universidad Nacional"
                                    />
                                </div>
                                {role === 'mentor' && (
                                    <div className="md:col-span-2">
                                        <label htmlFor="experience" className="block text-sm font-medium mb-1">Nivel de Experiencia</label>
                                        <div className="relative">
                                            <select
                                                id="experience"
                                                value={experience}
                                                onChange={(e) => setExperience(e.target.value)}
                                                className="w-full p-2 border border-border rounded-md bg-input text-foreground appearance-none pr-8"
                                            >
                                                <option value="">Selecciona tu nivel...</option>
                                                <option value="entry">Entry (Junior / Inicial)</option>
                                                <option value="mid">Mid (Semi-Senior / Intermedio)</option>
                                                <option value="senior">Senior (Avanzado)</option>
                                                <option value="lead">Lead (Líder / Principal)</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {role === 'mentor' ? 'Áreas de Especialización (Selecciona al menos 2)' : 'Áreas de Interés (Selecciona al menos 2)'}
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {optionsLoading ? <p className="text-sm text-muted-foreground">Cargando opciones...</p> : interestOptions.map(interest => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => {
                                                if (interests.includes(interest)) {
                                                    setInterests(interests.filter(i => i !== interest));
                                                } else {
                                                    setInterests([...interests, interest]);
                                                }
                                            }}
                                            className={`text-xs px-2 py-1 rounded-full border ${interests.includes(interest) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-accent'}`}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {role === 'mentor' ? 'Temas de Mentoría (Selecciona)' : 'Objetivos de Mentoría (Selecciona)'}
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {optionsLoading ? <p className="text-sm text-muted-foreground">Cargando opciones...</p> : goalOptions.map(goal => (
                                        <button
                                            key={goal}
                                            type="button"
                                            onClick={() => {
                                                if (goals.includes(goal)) {
                                                    setGoals(goals.filter(g => g !== goal));
                                                } else {
                                                    setGoals([...goals, goal]);
                                                }
                                            }}
                                            className={`text-xs px-2 py-1 rounded-full border ${goals.includes(goal) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-accent'}`}
                                        >
                                            {goal}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {role === 'mentee' && (
                                <div className="mt-4">
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
                                </div>
                            )}
                        </>
                    )}

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        {step === 2 && (
                            <Button type="button" onClick={handlePrevStep} variant="outline" className="w-1/3">
                                &lt; Atrás
                            </Button>
                        )}
                        <Button type="submit" className={`flex-1 ${step === 1 ? 'w-full !mt-6' : ''}`} size="lg" disabled={isLoading}>
                            {isLoading ? 'Creando cuenta...' : (step === 1 ? 'Siguiente >' : 'Finalizar Registro')}
                        </Button>
                    </div>
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