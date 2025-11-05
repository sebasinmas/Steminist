import React, { useState, useRef } from 'react';
import type { Mentee, Mentor } from '../types';
import Button from '../components/common/Button';
import Tag from '../components/common/Tag';
import { PencilIcon, CameraIcon, XIcon, LinkIcon } from '../components/common/Icons';
import AvailabilityCalendarModal from '../components/scheduling/AvailabilityCalendarModal';
import { MENTORSHIP_GOALS } from '../constants';
import { useToast } from '../context/ToastContext';

interface ProfilePageProps {
    user: Mentee | Mentor;
    isPublicView?: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, isPublicView = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState(user);
    const [newExpertise, setNewExpertise] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const [newLink, setNewLink] = useState({ title: '', url: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { addToast } = useToast();

    const isMentor = 'reviews' in profileData;


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target?.result) {
                    setProfileData(prev => ({ ...prev, avatarUrl: event.target.result as string }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const addTag = (type: 'expertise' | 'mentorshipGoals' | 'mentoringTopics') => {
        const value = type === 'expertise' ? newExpertise : newGoal;
        const setter = type === 'expertise' ? setNewExpertise : setNewGoal;

        if (value) {
            setProfileData(prev => {
                const currentTags = (prev as any)[type] || [];
                if (!currentTags.includes(value)) {
                    return { ...prev, [type]: [...currentTags, value] };
                }
                return prev;
            });
            setter('');
        }
    };

    const removeTag = (type: 'expertise' | 'mentorshipGoals' | 'mentoringTopics', tagToRemove: string) => {
        setProfileData(prev => ({
            ...prev,
            [type]: ((prev as any)[type] || []).filter((tag: string) => tag !== tagToRemove)
        }));
    };
    
    const handleNewLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewLink(prev => ({ ...prev, [name]: value }));
    };

    const handleAddLink = () => {
        if (newLink.title && newLink.url) {
            try {
                new URL(newLink.url);
                setProfileData(prev => ({
                    ...prev,
                    links: [...((prev as Mentor).links || []), newLink]
                }));
                setNewLink({ title: '', url: '' });
            } catch (_) {
                alert("Por favor, introduce una URL válida (ej: https://example.com)");
            }
        }
    };

    const handleRemoveLink = (indexToRemove: number) => {
        setProfileData(prev => ({
            ...prev,
            links: ((prev as Mentor).links || []).filter((_, index) => index !== indexToRemove)
        }));
    };


    const handleAvailabilitySave = (newAvailability: Record<string, string[]>) => {
        const cleanedAvailability: Record<string, string[]> = {};
        Object.entries(newAvailability).forEach(([date, times]) => {
            if (times.length > 0) {
                cleanedAvailability[date] = times.sort();
            }
        });
        setProfileData(prev => ({ ...prev, availability: cleanedAvailability }));
        setIsCalendarOpen(false);
    };

    const handleSave = () => {
        // In a real app, you would send this data to an API
        console.log("Saving data:", profileData);
        setIsEditing(false);
        addToast('Perfil actualizado con éxito.', 'success');
    };

    const handleCancel = () => {
        setProfileData(user); // Reset changes
        setIsEditing(false);
        setNewLink({ title: '', url: '' });
    };
    
    const TagEditor: React.FC<{
        title: string;
        tags: string[];
        tagType: 'expertise' | 'mentorshipGoals' | 'mentoringTopics';
        suggestions?: string[];
    }> = ({ title, tags, tagType, suggestions }) => {
        const [inputValue, setInputValue] = useState('');
        
        const handleAdd = () => {
            if (inputValue) {
                removeTag(tagType, inputValue); // to avoid duplicates if re-adding
                addTag(tagType);
                setInputValue('');
            }
        };

        const handleSuggestionClick = (suggestion: string) => {
             setProfileData(prev => {
                const currentTags = (prev as any)[tagType] || [];
                if (!currentTags.includes(suggestion)) {
                    return { ...prev, [tagType]: [...currentTags, suggestion] };
                }
                return prev;
            });
        }
        
        return (
             <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">{title}</h2>
                <div className="flex flex-wrap">
                    {(tags || []).map(tag => (
                        <span key={tag} className="relative group bg-secondary text-secondary-foreground text-base font-semibold mr-2 mb-2 px-4 py-2 rounded-full">
                            {tag}
                            {isEditing && (
                                <button onClick={() => removeTag(tagType, tag)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    <XIcon className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
                 {isEditing && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder={`Añadir ${title.toLowerCase().slice(0, -1)}...`}
                                className="flex-grow p-2 border border-border rounded-md bg-input text-foreground"
                            />
                            <Button onClick={handleAdd} size="sm">Añadir</Button>
                        </div>
                        {suggestions && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs font-semibold text-muted-foreground mr-2">Sugerencias:</span>
                                {suggestions.filter(s => !(tags || []).includes(s)).slice(0, 5).map(s => (
                                    <button key={s} onClick={() => handleSuggestionClick(s)} className="text-xs bg-accent hover:bg-accent/80 px-2 py-1 rounded-md">{s}</button>
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
                <div className="lg:col-span-1">
                    <div className="sticky top-28 bg-card p-8 rounded-lg border border-border text-center">
                        <div className="relative w-40 h-40 mx-auto mb-4 group">
                            <img src={profileData.avatarUrl} alt={profileData.name} className="w-40 h-40 rounded-full object-cover" />
                            {isEditing && (
                                <>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => fileInputRef.current?.click()} className="text-white">
                                            <CameraIcon className="w-10 h-10" />
                                        </button>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                                </>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                name="name"
                                value={profileData.name}
                                onChange={handleInputChange}
                                className="w-full text-center text-3xl font-bold bg-input border border-border rounded-md p-2"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold">{profileData.name}</h1>
                        )}
                        {isEditing ? (
                            <input
                                type="text"
                                name="title"
                                value={profileData.title || ''}
                                onChange={handleInputChange}
                                className="w-full text-center text-lg text-primary bg-input border border-border rounded-md p-2 mt-2"
                            />
                        ) : (
                            <p className="text-lg text-primary">{profileData.title}</p>
                        )}
                        {isEditing ? (
                             <input
                                type="text"
                                name="company"
                                value={profileData.company || ''}
                                onChange={handleInputChange}
                                className="w-full text-center text-md text-muted-foreground bg-input border border-border rounded-md p-2 mt-2"
                            />
                        ) : (
                             <p className="text-md text-muted-foreground mb-4">{profileData.company}</p>
                        )}

                        {isMentor && (
                            <div className="text-lg my-4">
                                <span className="font-bold text-yellow-500">★ {(profileData as Mentor).rating.toFixed(1)}</span>
                                <span className="text-muted-foreground"> ({(profileData as Mentor).reviews} reseñas)</span>
                            </div>
                        )}
                       
                        {!isEditing && !isPublicView && (
                             <Button onClick={() => setIsEditing(true)} size="lg" className="w-full mt-6 flex items-center justify-center gap-2">
                                <PencilIcon /> Editar Perfil
                            </Button>
                        )}
                        {isEditing && (
                            <div className="flex flex-col space-y-2 mt-6">
                                <Button onClick={handleSave} size="lg" className="w-full">Guardar Cambios</Button>
                                <Button onClick={handleCancel} variant="secondary" className="w-full">Cancelar</Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card p-6 rounded-lg border border-border">
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Sobre Mí</h2>
                        {isEditing ? (
                            <textarea
                                name={isMentor ? 'longBio' : 'bio'}
                                value={isMentor ? (profileData as Mentor).longBio : (profileData as Mentee).bio || ''}
                                onChange={handleInputChange}
                                rows={6}
                                className="w-full text-lg text-foreground/90 whitespace-pre-line bg-input border border-border rounded-md p-3"
                            />
                        ) : (
                            <p className="text-lg text-foreground/90 whitespace-pre-line">{isMentor ? (profileData as Mentor).longBio : (profileData as Mentee).bio}</p>
                        )}
                    </div>

                    {!isMentor && !isPublicView && (
                         <div className="bg-card p-6 rounded-lg border border-border">
                            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Información Confidencial</h2>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="pronouns" className="block text-sm font-medium mb-1">Pronombres</label>
                                        <input
                                            type="text"
                                            id="pronouns"
                                            name="pronouns"
                                            value={(profileData as Mentee).pronouns || ''}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                            placeholder="Ej: Ella, Elle"
                                        />
                                    </div>
                                     <div>
                                        <label htmlFor="neurodivergence" className="block text-sm font-medium mb-1">Neurodivergencia (opcional)</label>
                                        <input
                                            type="text"
                                            id="neurodivergence"
                                            name="neurodivergence"
                                            value={(profileData as Mentee).neurodivergence || ''}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-border rounded-md bg-input text-foreground"
                                            placeholder="Ej: TDAH, Espectro Autista"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Esta información es opcional y solo será visible para tu mentora confirmada y los administradores de la plataforma para ayudar a proporcionar una experiencia de apoyo.</p>
                                </div>
                            ) : (
                                 <div className="text-lg text-foreground/90 space-y-2">
                                    <p><strong>Pronombres:</strong> {(profileData as Mentee).pronouns || 'No especificado'}</p>
                                    <p><strong>Neurodivergencia:</strong> {(profileData as Mentee).neurodivergence || 'No especificado'}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <TagEditor 
                        title="Áreas de Especialización"
                        tags={profileData.expertise || []}
                        tagType="expertise"
                    />

                     <TagEditor 
                        title={isMentor ? "Temas de Mentoría" : "Mis Objetivos de Mentoría"}
                        tags={(isMentor ? (profileData as Mentor).mentoringTopics : (profileData as Mentee).mentorshipGoals) || []}
                        tagType={isMentor ? 'mentoringTopics' : 'mentorshipGoals'}
                        suggestions={MENTORSHIP_GOALS}
                    />
                    
                    {isMentor && (
                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Publicaciones y Enlaces</h2>
                            <div className="space-y-3">
                                {((profileData as Mentor).links || []).length > 0 ? (
                                    ((profileData as Mentor).links || []).map((link, index) => (
                                        <div key={index} className="flex items-center justify-between group bg-secondary/50 p-3 rounded-md">
                                            <a 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-primary hover:underline"
                                            >
                                                <LinkIcon className="w-5 h-5 flex-shrink-0" />
                                                <span className="font-semibold truncate">{link.title}</span>
                                            </a>
                                             {isEditing && (
                                                <button 
                                                    onClick={() => handleRemoveLink(index)} 
                                                    className="bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4"
                                                    aria-label={`Eliminar enlace ${link.title}`}
                                                >
                                                    <XIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                     !isEditing && <p className="text-muted-foreground">No se han añadido enlaces.</p>
                                )}
                            </div>
                             {isEditing && (
                                <div className="mt-6 pt-4 border-t border-border/50">
                                    <h3 className="font-semibold mb-2">Añadir nuevo enlace</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                         <input
                                            type="text"
                                            name="title"
                                            value={newLink.title}
                                            onChange={handleNewLinkChange}
                                            placeholder="Título (ej: Paper sobre IA)"
                                            className="p-2 border border-border rounded-md bg-input text-foreground"
                                        />
                                        <input
                                            type="url"
                                            name="url"
                                            value={newLink.url}
                                            onChange={handleNewLinkChange}
                                            placeholder="URL (ej: https://...)"
                                            className="p-2 border border-border rounded-md bg-input text-foreground"
                                        />
                                    </div>
                                    <Button onClick={handleAddLink} size="sm" disabled={!newLink.title || !newLink.url}>Añadir Enlace</Button>
                                </div>
                            )}
                        </div>
                    )}

                     <div className="bg-card p-6 rounded-lg border border-border">
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">Mi Disponibilidad</h2>
                        <p className="text-muted-foreground mb-4">
                            {isMentor 
                                ? 'Indica a las mentoreadas cuándo estás disponible para conectar.' 
                                : 'Indica a las mentoras cuándo estás disponible para conectar.'}
                        </p>
                        <div className="space-y-3">
                             {Object.entries(profileData.availability || {}).map(([date, times]) => (
                                <div key={date} className="bg-secondary p-3 rounded-md flex items-center justify-between">
                                    <p className="font-semibold">{new Date(date).toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {(times as string[]).map(time => <Tag key={time}>{time}</Tag>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isEditing && (
                             <Button variant="secondary" className="mt-4" onClick={() => setIsCalendarOpen(true)}>Gestionar Disponibilidad</Button>
                        )}
                    </div>
                </div>
            </div>
            <AvailabilityCalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                currentAvailability={profileData.availability || {}}
                onSave={handleAvailabilitySave}
            />
        </div>
    );
};

export default ProfilePage;