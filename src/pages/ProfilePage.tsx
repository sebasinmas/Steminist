import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import Button from '../components/common/Button';
import { CameraIcon, PencilIcon, XIcon, LinkIcon, CalendarIcon } from '../components/common/Icons';
import { useToast } from '../context/ToastContext';
import type { Mentor, Mentee } from '../types';
import AvailabilityCalendarModal from '../components/scheduling/AvailabilityCalendarModal';
// import { MENTORSHIP_GOALS } from '../utils/constants';
import Tag from '../components/common/Tag';

interface ProfilePageProps {
    isPublicView?: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ isPublicView = false }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    // Estados locales
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Estado local del perfil (copia para editar)
    const [localProfile, setLocalProfile] = useState<Mentor | Mentee | null>(null);
    
    // Manejo de imagen de avatar
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // Estado para nuevo enlace
    const [newLink, setNewLink] = useState({ title: '', url: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sincronizar el estado local cuando carga el usuario del contexto
    useEffect(() => {
        if (user && !('role' in user && user.role === 'admin')) {
             setLocalProfile(user as Mentor | Mentee);
             setPreviewUrl(user.avatarUrl);
        }
    }, [user]);

    if (!localProfile) return <div className="p-8 text-center">Cargando perfil...</div>;

    // Type guard simple
    const isMentor = 'reviews' in localProfile;

    // --- Manejadores de Eventos ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalProfile(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            
            // Crear URL temporal para previsualización inmediata
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    // Manejo de Tags (Intereses / Objetivos)
    const addTag = (type: 'interests' | 'mentorshipGoals', value: string) => {
        if (value && localProfile) {
            const currentTags = (localProfile as any)[type] || [];
            if (!currentTags.includes(value)) {
                setLocalProfile({ ...localProfile, [type]: [...currentTags, value] });
            }
        }
    };

    const removeTag = (type: 'interests' | 'mentorshipGoals', tagToRemove: string) => {
        if (localProfile) {
            setLocalProfile({
                ...localProfile,
                [type]: ((localProfile as any)[type] || []).filter((tag: string) => tag !== tagToRemove)
            });
        }
    };

    // Manejo de Enlaces (Solo Mentoras)
    const handleNewLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewLink(prev => ({ ...prev, [name]: value }));
    };

    const handleAddLink = () => {
        if (newLink.title && newLink.url && isMentor) {
            try {
                new URL(newLink.url); // Validar URL
                setLocalProfile(prev => prev ? ({
                    ...prev,
                    links: [...((prev as Mentor).links || []), newLink]
                }) : null);
                setNewLink({ title: '', url: '' });
            } catch (_) {
                addToast("Por favor, introduce una URL válida (ej: https://example.com)", 'error');
            }
        }
    };

    const handleRemoveLink = (indexToRemove: number) => {
        if (isMentor) {
            setLocalProfile(prev => prev ? ({
                ...prev,
                links: ((prev as Mentor).links || []).filter((_, index) => index !== indexToRemove)
            }) : null);
        }
    };

    // Manejo de Disponibilidad
    const handleAvailabilitySave = (newAvailability: Record<string, string[]>) => {
        const cleanedAvailability: Record<string, string[]> = {};
        Object.entries(newAvailability).forEach(([date, times]) => {
            if (times.length > 0) {
                cleanedAvailability[date] = times.sort();
            }
        });
        setLocalProfile(prev => prev ? ({ ...prev, availability: cleanedAvailability }) : null);
        setIsCalendarOpen(false);
    };

    // Guardado Final
    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (!localProfile) return;

            let finalAvatarUrl = localProfile.avatarUrl;

            // 1. Subir imagen si se seleccionó una nueva
            if (selectedFile) {
                // storageService ya maneja la conversión a WebP y el nombre único
                finalAvatarUrl = await storageService.uploadAvatar(localProfile.id, selectedFile);
            }

            // 2. Preparar datos para actualizar (excluir campos readonly de Auth)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, email, role, ...metadataToUpdate } = localProfile;

            // 3. Actualizar en Supabase Auth
            await authService.updateProfile({
                ...metadataToUpdate,
                avatarUrl: finalAvatarUrl
            });

            addToast('Perfil actualizado con éxito.', 'success');
            setIsEditing(false);
            setSelectedFile(null);
            
        } catch (error) {
            console.error('Error al guardar:', error);
            addToast('Error al actualizar el perfil.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Revertir cambios al estado del contexto
        if (user && !('role' in user && user.role === 'admin')) {
            setLocalProfile(user as Mentor | Mentee);
            setPreviewUrl(user.avatarUrl);
        }
        setSelectedFile(null);
        setNewLink({ title: '', url: '' });
        setIsEditing(false);
    };

    // --- Subcomponente TagEditor ---
    const TagEditor: React.FC<{
        title: string;
        tags: string[];
        tagType: 'interests' | 'mentorshipGoals';
        suggestions?: string[];
        restrictedOptions?: string[];
    }> = ({ title, tags, tagType, suggestions, restrictedOptions }) => {
        const [inputValue, setInputValue] = useState('');

        const handleAdd = () => {
            if (inputValue.trim()) {
                addTag(tagType, inputValue.trim());
                setInputValue('');
            }
        };

        return (
            <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">{title}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {(tags || []).map(tag => (
                        <span key={tag} className="relative group bg-secondary text-secondary-foreground text-base font-semibold px-4 py-2 rounded-full flex items-center">
                            {tag}
                            {isEditing && (
                                <button 
                                    onClick={() => removeTag(tagType, tag)} 
                                    className="ml-2 text-destructive hover:text-destructive/80 focus:outline-none"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
                {isEditing && (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder={`Añadir ${title.toLowerCase()}...`}
                                className="flex-grow p-2 border border-border rounded-md bg-input text-foreground"
                            />
                            <Button onClick={handleAdd} size="sm" variant="secondary">Añadir</Button>
                        </div>
                        {suggestions && (
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-semibold text-muted-foreground self-center">Sugerencias:</span>
                                {suggestions.filter(s => !(tags || []).includes(s)).slice(0, 5).map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => addTag(tagType, s)} 
                                        className="text-xs bg-accent hover:bg-accent/80 px-2 py-1 rounded-md transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Columna Izquierda: Foto y Datos Básicos */}
                <div className="lg:col-span-1">
                    <div className="sticky top-28 bg-card p-8 rounded-lg border border-border text-center shadow-sm">
                        
                        <div className="relative w-40 h-40 mx-auto mb-6 group">
                            <img 
                                src={previewUrl || 'https://via.placeholder.com/150'} 
                                alt={localProfile.name} 
                                className="w-40 h-40 rounded-full object-cover border-4 border-background shadow-md" 
                            />
                            {isEditing && (
                                <>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <CameraIcon className="text-white w-10 h-10" />
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                                </>
                            )}
                        </div>

                        <div className="space-y-3">
                            {isEditing ? (
                                <input 
                                    name="name" 
                                    value={localProfile.name} 
                                    onChange={handleInputChange} 
                                    className="w-full text-center text-2xl font-bold bg-input border border-border rounded-md p-1"
                                    placeholder="Nombre completo"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold">{localProfile.name}</h1>
                            )}

                            {isEditing ? (
                                <input 
                                    name="title" 
                                    value={localProfile.title || ''} 
                                    onChange={handleInputChange} 
                                    className="w-full text-center text-lg text-primary bg-input border border-border rounded-md p-1" 
                                    placeholder="Título Profesional"
                                />
                            ) : (
                                <p className="text-lg text-primary">{localProfile.title}</p>
                            )}

                            {isEditing ? (
                                <input 
                                    name="company" 
                                    value={localProfile.company || ''} 
                                    onChange={handleInputChange} 
                                    className="w-full text-center text-md text-muted-foreground bg-input border border-border rounded-md p-1" 
                                    placeholder="Empresa / Institución"
                                />
                            ) : (
                                <p className="text-md text-muted-foreground">{localProfile.company}</p>
                            )}
                        </div>

                        {isMentor && (
                            <div className="text-lg my-4 p-2 bg-secondary/30 rounded-lg inline-block">
                                <span className="font-bold text-yellow-500">★ {(localProfile as Mentor).rating.toFixed(1)}</span>
                                <span className="text-muted-foreground text-sm ml-1">({(localProfile as Mentor).reviews} reseñas)</span>
                            </div>
                        )}

                        {!isEditing && !isPublicView && (
                            <Button onClick={() => setIsEditing(true)} size="lg" className="w-full mt-6 flex items-center justify-center gap-2">
                                <PencilIcon className="w-4 h-4" /> Editar Perfil
                            </Button>
                        )}

                        {isEditing && (
                            <div className="flex flex-col space-y-2 mt-6">
                                <Button onClick={handleSave} size="lg" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                                <Button onClick={handleCancel} variant="secondary" className="w-full" disabled={isLoading}>
                                    Cancelar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Detalles */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Bio */}
                    <div className="bg-card p-6 rounded-lg border border-border">
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Sobre Mí</h2>
                        {isEditing ? (
                            <textarea 
                                name={isMentor ? 'longBio' : 'bio'} 
                                value={isMentor ? (localProfile as Mentor).longBio : (localProfile as Mentee).bio || ''} 
                                onChange={handleInputChange} 
                                rows={6} 
                                className="w-full text-lg text-foreground/90 whitespace-pre-line bg-input border border-border rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none" 
                                placeholder="Cuéntanos sobre tu trayectoria..."
                            />
                        ) : (
                            <p className="text-lg text-foreground/90 whitespace-pre-line leading-relaxed">
                                {isMentor ? (localProfile as Mentor).longBio : (localProfile as Mentee).bio}
                            </p>
                        )}
                    </div>

                    {/* Información Confidencial (Solo Mentee) */}
                    {!isMentor && !isPublicView && (
                        <div className="bg-card p-6 rounded-lg border border-border bg-secondary/10">
                            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Información Privada</h2>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="pronouns" className="block text-sm font-medium mb-1">Pronombres</label>
                                        <input type="text" id="pronouns" name="pronouns" value={(localProfile as Mentee).pronouns || ''} onChange={handleInputChange} className="w-full p-2 border border-border rounded-md bg-input text-foreground" placeholder="Ej: Ella" />
                                    </div>
                                    <div>
                                        <label htmlFor="neurodivergence" className="block text-sm font-medium mb-1">Neurodivergencia</label>
                                        <input type="text" id="neurodivergence" name="neurodivergence" value={(localProfile as Mentee).neurodivergence || ''} onChange={handleInputChange} className="w-full p-2 border border-border rounded-md bg-input text-foreground" placeholder="Ej: TDAH, Dislexia (Opcional)" />
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">Esta información solo es visible para ti y tus mentoras confirmadas.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><span className="font-semibold text-muted-foreground">Pronombres:</span> <span className="ml-2">{ (localProfile as Mentee).pronouns || 'No especificado' }</span></div>
                                    <div><span className="font-semibold text-muted-foreground">Neurodivergencia:</span> <span className="ml-2">{ (localProfile as Mentee).neurodivergence || 'No especificado' }</span></div>
                                </div>
                            )}
                        </div>
                    )}

                    <TagEditor 
                        title="Áreas de Especialización / Intereses" 
                        tags={localProfile.interests || []} 
                        tagType="interests" 
                    />
                    
                    <TagEditor 
                        title={isMentor ? "Temas de Mentoría" : "Mis Objetivos"} 
                        tags={localProfile.mentorshipGoals || []} 
                        tagType="mentorshipGoals" 
                        // suggestions={MENTORSHIP_GOALS} 
                    />

                    {/* Enlaces (Solo Mentor) */}
                    {isMentor && (
                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Publicaciones y Enlaces</h2>
                            <div className="space-y-3">
                                {((localProfile as Mentor).links || []).length > 0 ? (
                                    ((localProfile as Mentor).links || []).map((link, index) => (
                                        <div key={index} className="flex items-center justify-between group bg-secondary/50 p-3 rounded-md hover:bg-secondary transition-colors">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:underline overflow-hidden">
                                                <LinkIcon className="w-5 h-5 flex-shrink-0" />
                                                <span className="font-semibold truncate">{link.title}</span>
                                            </a>
                                            {isEditing && (
                                                <button onClick={() => handleRemoveLink(index)} className="text-destructive hover:bg-destructive/10 p-1 rounded-full transition-colors" aria-label="Eliminar enlace">
                                                    <XIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    !isEditing && <p className="text-muted-foreground italic">No se han añadido enlaces.</p>
                                )}
                            </div>
                            
                            {isEditing && (
                                <div className="mt-6 pt-4 border-t border-border/50">
                                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Añadir nuevo enlace</h3>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input type="text" name="title" value={newLink.title} onChange={handleNewLinkChange} placeholder="Título (ej: Mi Portfolio)" className="flex-1 p-2 border border-border rounded-md bg-input text-foreground" />
                                        <input type="url" name="url" value={newLink.url} onChange={handleNewLinkChange} placeholder="URL (https://...)" className="flex-1 p-2 border border-border rounded-md bg-input text-foreground" />
                                        <Button onClick={handleAddLink} size="sm" variant="secondary" disabled={!newLink.title || !newLink.url}>Añadir</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Disponibilidad */}
                    <div className="bg-card p-6 rounded-lg border border-border">
                        <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                            <h2 className="text-2xl font-bold">Disponibilidad</h2>
                            {!isPublicView && (
                                <Button variant="ghost" size="sm" onClick={() => addToast('Próximamente: Sincronización con Google Calendar', 'info')}>
                                    <CalendarIcon className="mr-2 h-4 w-4" /> Sync G-Calendar
                                </Button>
                            )}
                        </div>
                        
                        <p className="text-muted-foreground mb-4">
                            {isMentor ? 'Define los bloques horarios en los que puedes recibir sesiones.' : 'Indica tus horarios preferidos.'}
                        </p>
                        
                        <div className="space-y-3">
                            {Object.entries(localProfile.availability || {}).length > 0 ? (
                                Object.entries(localProfile.availability || {}).map(([date, times]) => (
                                    <div key={date} className="bg-secondary p-3 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="font-semibold flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-primary" />
                                            {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {(times as string[]).map(time => <Tag key={time} className="text-xs bg-background border border-border">{time}</Tag>)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground italic p-4 text-center bg-secondary/20 rounded-lg">No has definido tu disponibilidad.</p>
                            )}
                        </div>

                        {!isPublicView && isEditing && (
                            <div className="mt-6">
                                <Button variant="secondary" onClick={() => setIsCalendarOpen(true)} className="w-full sm:w-auto">
                                    Gestionar Disponibilidad Completa
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <AvailabilityCalendarModal 
                isOpen={isCalendarOpen} 
                onClose={() => setIsCalendarOpen(false)} 
                currentAvailability={localProfile.availability || {}} 
                onSave={handleAvailabilitySave} 
            />
        </div>
    );
};

export default ProfilePage;