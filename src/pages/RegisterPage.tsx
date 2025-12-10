import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { EyeIcon, EyeOffIcon } from '../components/common/Icons';
import { useProfileOptions } from '../hooks/useProfileOptions';
// Importamos el DTO y los tipos específicos
import { RegisterDTO, RegisterMenteeDTO, RegisterMentorDTO } from '../DTO/Register.dto';

const RegisterPage: React.FC = () => {
    const { role } = useParams<{ role: 'mentee' | 'mentor' }>();
    const navigate = useNavigate();
    const { register, isLoggedIn } = useAuth();
    const { interests: interestOptions, mentorshipGoals: goalOptions, loading: optionsLoading } = useProfileOptions();

    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 1. ESTADO UNIFICADO: Inicializamos el formulario basándonos en el DTO
    // Usamos Partial porque al inicio los campos están vacíos
    const [formData, setFormData] = useState<Partial<RegisterDTO>>({
        role: role as 'mentee' | 'mentor',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        interests: [],
        mentorship_goals: [],
        // Campos opcionales inicializados para evitar errores de uncontrolled components
        is_neurodivergent: false,
        neurodivergence_details: '',
        title: '',
        company: '',
        bio: '',
        // Campos específicos
        ...(role === 'mentor' ? { long_bio: '', max_mentees: 3 } : { pronouns: '', neurodivergence_details: '' })
    });

    // Redirecciones de seguridad
    if (isLoggedIn) return <Navigate to="/" replace />;
    if (!role || !['mentee', 'mentor'].includes(role)) return <Navigate to="/register/mentee" replace />;

    // 2. MANEJADOR GENÉRICO (TEXTO Y SELECTS)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
        const updates: any = { [name]: value };
        
        if (name === 'neurodivergence_details') {
            // Si hay texto (eliminando espacios), is_neurodivergent = true
            // Si borra todo el texto, vuelve a false
            updates.is_neurodivergent = value.trim().length > 0;
        }

        return { ...prev, ...updates };
    });
    };

    // 3. MANEJADOR PARA ARRAYS (Intereses / Goals)
    const handleArrayToggle = (field: 'interests' | 'mentorship_goals', value: string) => {
        setFormData(prev => {
            const currentArray = (prev[field] as string[]) || [];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray as any }; // Cast necesario por el tipo estricto del Enum en DTO
        });
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            // Validación simple usando el objeto formData
            if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
                setError('Por favor completa todos los campos obligatorios.');
                return;
            }
            if ((formData.password?.length || 0) < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // El formData YA TIENE la forma del DTO, así que lo pasamos directo.
            // Hacemos un cast final para asegurar a TS que es el DTO completo.
            await register(formData as RegisterDTO, role);
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error("Registration error:", err);
            // Manejo de errores simplificado
            const msg = err.message || '';
            if (msg.includes('password')) setError('La contraseña es muy débil.');
            else if (msg.includes('already registered') || msg.includes('unique')) setError('Este correo ya está registrado.');
            else setError('Hubo un error en el registro. Intenta de nuevo.');
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
                    {/* PASO 1: DATOS BÁSICOS (Coinciden con RegisterGenericDTO) */}
                    {step === 1 && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nombre</label>
                                    <input
                                        name="first_name" // IMPORTANTE: Coincide con el DTO
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Apellido</label>
                                    <input
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Contraseña</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-border rounded-md bg-input text-foreground pr-10"
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
                        </>
                    )}

                    {/* PASO 2: DATOS ESPECÍFICOS */}
                    {step === 2 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cargo / Título</label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                        placeholder="Ej: Ing. de Software"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Empresa / Institución</label>
                                    <input
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        placeholder="Ej: Universidad de La Frontera"
                                        className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                    />
                                </div>
                            </div>

                            {/* CAMPOS CONDICIONALES BASADOS EN ROL */}
                            {role === 'mentor' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Biografía Larga</label>
                                        <textarea
                                            name="long_bio"
                                            value={(formData as RegisterMentorDTO).bio}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                            rows={3}
                                            placeholder="Cuéntanos sobre tu experiencia..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Neurodivergencia (Opcional)</label>
                                        <input
                                            name="neurodivergence_details" // Nombre exacto del DTO
                                            value={(formData as RegisterMenteeDTO).neurodivergence_details || ''}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                            placeholder="Ej: TDAH, Dislexia..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Pronombres (Opcional)</label>
                                        <input
                                            name="pronouns"
                                            value={(formData as RegisterMenteeDTO).pronouns || ''}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                            placeholder="Ej: Ella, Elle"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* SELECCIÓN DE TAGS (INTERESES) */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {role === 'mentor' ? 'Áreas de Especialización' : 'Áreas de Interés'}
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {optionsLoading ? <p>Cargando...</p> : interestOptions.map(interest => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => handleArrayToggle('interests', interest)}
                                            className={`text-xs px-2 py-1 rounded-full border ${formData.interests?.includes(interest as any) 
                                                ? 'bg-primary text-primary-foreground border-primary' 
                                                : 'bg-background border-border hover:bg-accent'}`}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* SELECCIÓN DE GOALS */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {role === 'mentor' ? 'Temas de Mentoría' : 'Objetivos de Mentoría'}
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {goalOptions.map(goal => (
                                        <button
                                            key={goal}
                                            type="button"
                                            onClick={() => handleArrayToggle('mentorship_goals', goal)}
                                            className={`text-xs px-2 py-1 rounded-full border ${formData.mentorship_goals?.includes(goal as any) 
                                                ? 'bg-primary text-primary-foreground border-primary' 
                                                : 'bg-background border-border hover:bg-accent'}`}
                                        >
                                            {goal}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        {step === 2 && (
                            <Button type="button" onClick={() => setStep(1)} variant="outline" className="w-1/3">
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