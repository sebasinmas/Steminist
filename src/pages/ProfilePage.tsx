import React, { useState, useRef, useEffect } from 'react';
import type { Mentee, Mentor } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Tag from '../components/common/Tag';
import Tooltip from '../components/common/Tooltip';
import GoogleCalendarButton from '../components/common/GoogleCalendarButton';
import { PencilIcon, CameraIcon, XIcon, LinkIcon } from '../components/common/Icons';
import AvailabilityCalendarModal from '../components/scheduling/AvailabilityCalendarModal';
import { useToast } from '../context/ToastContext';
import { useProfileOptions } from '../hooks/useProfileOptions';
import { supabase } from '../lib/supabase';

interface ProfilePageProps {
    isPublicView?: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ isPublicView = false }) => {
    const { user, refreshUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<typeof user>(user);
    const [newLink, setNewLink] = useState({ title: '', url: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { addToast } = useToast();
    const {
        interests: interestOptions,
        mentorshipGoals: goalOptions,
        loading: optionsLoading,
    } = useProfileOptions();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setProfileData(user);
    }, [user]);

    if (!profileData) {
        return <div>Loading profile...</div>;
    }

    // Solo Mentee / Mentor tienen disponibilidad
    if (!('availability' in profileData)) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                <h1 className="text-2xl font-bold">Página de Perfil no disponible</h1>
                <p className="text-muted-foreground mt-2">
                    Este tipo de usuario no tiene una página de perfil editable.
                </p>
            </div>
        );
    }

    const isMentor = 'reviews' in profileData;

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setProfileData(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = event => {
                if (event.target?.result) {
                    setProfileData(prev =>
                        prev ? { ...prev, avatarUrl: event.target.result as string } : null,
                    );
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const addTag = (type: 'interests' | 'mentorshipGoals', value: string) => {
        if (value) {
            setProfileData(prev => {
                if (!prev) return null;
                const currentTags = (prev as any)[type] || [];
                if (!currentTags.includes(value)) {
                    return { ...prev, [type]: [...currentTags, value] };
                }
                return prev;
            });
        }
    };

    const removeTag = (type: 'interests' | 'mentorshipGoals', tagToRemove: string) => {
        setProfileData(prev =>
            prev
                ? {
                    ...prev,
                    [type]: ((prev as any)[type] || []).filter(
                        (tag: string) => tag !== tagToRemove,
                    ),
                }
                : null,
        );
    };

    const handleNewLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewLink(prev => ({ ...prev, [name]: value }));
    };

    const handleAddLink = () => {
        if (newLink.title && newLink.url) {
            try {
                new URL(newLink.url);
                setProfileData(prev =>
                    prev
                        ? {
                            ...prev,
                            links: [...((prev as Mentor).links || []), newLink],
                        }
                        : null,
                );
                setNewLink({ title: '', url: '' });
            } catch {
                addToast(
                    'Por favor, introduce una URL válida (ej: https://example.com)',
                    'error',
                );
            }
        }
    };

    const handleRemoveLink = (indexToRemove: number) => {
        setProfileData(prev =>
            prev
                ? {
                    ...prev,
                    links: ((prev as Mentor).links || []).filter(
                        (_, index) => index !== indexToRemove,
                    ),
                }
                : null,
        );
    };

    const handleAvailabilitySave = (newAvailability: Record<string, string[]>) => {
        const cleanedAvailability: Record<string, string[]> = {};
        Object.entries(newAvailability).forEach(([date, times]) => {
            if (times.length > 0) {
                cleanedAvailability[date] = times.sort();
            }
        });
        setProfileData(prev =>
            prev ? { ...prev, availability: cleanedAvailability } : null,
        );
        setIsCalendarOpen(false);
    };

    const handleSave = async () => {
        if (!profileData || !user) {
            console.warn('[ProfilePage] handleSave called without profileData or user');
            return;
        }

        const isMentor = 'reviews' in profileData;

        console.log('[ProfilePage] handleSave start', {
            userId: user.id,
            isMentor,
            profileDataSnapshot: profileData,
        });

        setSaving(true);

        try {
            const userId = user.id;
// CAMBIO: Leer directamente nombre y apellido separados
            const avatarUrl = (profileData as any).avatarUrl;
            const firstName = (profileData as any).first_name || '';
            const lastName = (profileData as any).last_name || '';

            // 1) Actualizar users
            console.log('[ProfilePage] Updating users row', {
                userId,
                firstName,
                lastName,
                avatarUrl,
            });

            const { data: usersData, error: userErr } = await supabase
                .from('users')
                .update({
                    first_name: firstName || user.firstName || null,
                    last_name: lastName || user.lastName || null,
                    avatar_url: avatarUrl || null,
                })
                .eq('id', userId)
                .select();

            console.log('[ProfilePage] users update resolved', {
                usersData,
                userErr,
            });

            if (userErr) {
                console.error('[ProfilePage] Error updating users', userErr);
                throw userErr;
            }

            // 2) Actualizar perfil extendido
            if (isMentor) {
                const mentor = profileData as Mentor;

                console.log('[ProfilePage] Updating mentor_profiles row', {
                    userId,
                    title: mentor.title,
                    company: mentor.company,
                });

                const { data: mentorData, error: mentorErr } = await supabase
                    .from('mentor_profiles')
                    .update({
                        title: mentor.title || null,
                        company: mentor.company || null,
                        bio: mentor.longBio || null,
                        interests: mentor.interests || [],
                        mentorship_goals: mentor.mentorshipGoals || [],
                        expertise: (mentor as any).expertise || null,
                        paper_link: (mentor as any).paperLink || null,
                    })
                    .eq('user_id', userId)
                    .select();

                console.log('[ProfilePage] mentor_profiles update resolved', {
                    mentorData,
                    mentorErr,
                });

                if (mentorErr) {
                    console.error('[ProfilePage] Error updating mentor_profiles', mentorErr);
                    throw mentorErr;
                }
            } else {
                const mentee = profileData as Mentee;

                console.log('[ProfilePage] Updating mentee_profiles row', {
                    userId,
                    title: mentee.title,
                    company: mentee.company,
                });

                const { data: menteeData, error: menteeErr } = await supabase
                    .from('mentee_profiles')
                    .update({
                        title: mentee.title || null,
                        company: mentee.company || null,
                        bio: mentee.bio || null,
                        interests: mentee.interests || [],
                        mentorship_goals: mentee.mentorshipGoals || [],
                        role_level: (mentee as any).roleLevel || null,
                        pronouns: mentee.pronouns || null,
                        is_neurodivergent: !!mentee.neurodivergence,
                        neurodivergence_details: mentee.neurodivergence || null,
                    })
                    .eq('user_id', userId)
                    .select();

                console.log('[ProfilePage] mentee_profiles update resolved', {
                    menteeData,
                    menteeErr,
                });

                if (menteeErr) {
                    console.error('[ProfilePage] Error updating mentee_profiles', menteeErr);
                    throw menteeErr;
                }
            }

            console.log('[ProfilePage] Calling refreshUser');
            await refreshUser();
            console.log('[ProfilePage] refreshUser done');

            setIsEditing(false);
            addToast('Perfil actualizado con éxito.', 'success');

            console.log('[ProfilePage] handleSave completed successfully');
        } catch (rawErr) {
            const err = rawErr as any;
            console.error('[ProfilePage] Error in handleSave', err);

            const message =
                err?.message ||
                err?.error_description ||
                'Ocurrió un error al guardar los cambios del perfil.';

            addToast(message, 'error');
        } finally {
            console.log('[ProfilePage] handleSave finally → setSaving(false)');
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setProfileData(user);
        setIsEditing(false);
        setNewLink({ title: '', url: '' });
    };

    const TagEditor: React.FC<{
        title: string;
        tags: string[];
        tagType: 'interests' | 'mentorshipGoals';
        suggestions?: string[];
        restrictedOptions?: string[];
    }> = ({ title, tags, tagType, suggestions, restrictedOptions }) => {
        const [inputValue, setInputValue] = useState('');

        const handleAdd = () => {
            if (inputValue) {
                addTag(tagType, inputValue);
                setInputValue('');
            }
        };

        const handleSuggestionClick = (suggestion: string) => {
            addTag(tagType, suggestion);
        };

        const handleToggleOption = (option: string) => {
            if ((tags || []).includes(option)) {
                removeTag(tagType, option);
            } else {
                addTag(tagType, option);
            }
        };

        if (restrictedOptions) {
            return (
                <div className="bg-card p-6 rounded-lg border border-border">
                    <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                        {title}
                    </h2>
                    {optionsLoading ? (
                        <p className="text-sm text-muted-foreground">
                            Cargando opciones...
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {restrictedOptions.map(option => (
                                <button
                                    key={option}
                                    onClick={() => isEditing && handleToggleOption(option)}
                                    disabled={!isEditing}
                                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${(tags || []).includes(option)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-border hover:bg-accent'
                                        } ${!isEditing ? 'opacity-80 cursor-default' : 'cursor-pointer'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="bg-card p-6 rounded-lg border border-border">
                <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                    {title}
                </h2>
                <div className="flex flex-wrap">
                    {(tags || []).map(tag => (
                        <span
                            key={tag}
                            className="relative group bg-secondary text-secondary-foreground text-base font-semibold mr-2 mb-2 px-4 py-2 rounded-full"
                        >
                            {tag}
                            {isEditing && (
                                <button
                                    onClick={() => removeTag(tagType, tag)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
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
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                placeholder={`Añadir ${title.toLowerCase().slice(0, -1)}...`}
                                className="flex-grow p-2 border border-border rounded-md bg-input text-foreground"
                            />
                            <Button onClick={handleAdd} size="sm">
                                Añadir
                            </Button>
                        </div>
                        {suggestions && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs font-semibold text-muted-foreground mr-2">
                                    Sugerencias:
                                </span>
                                {suggestions
                                    .filter(s => !(tags || []).includes(s))
                                    .slice(0, 5)
                                    .map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleSuggestionClick(s)}
                                            className="text-xs bg-accent hover:bg-accent/80 px-2 py-1 rounded-md"
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
                <div className="lg:col-span-1">
                    <div className="sticky top-28 bg-card p-8 rounded-lg border border-border text-center">
                        <div className="relative w-40 h-40 mx-auto mb-4 group">
                            <img
                                src={profileData.avatarUrl}
                                alt={profileData.name}
                                className="w-40 h-40 rounded-full object-cover"
                            />
                            {isEditing && (
                                <>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-white"
                                        >
                                            <CameraIcon className="w-10 h-10" />
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </>
                            )}
                        </div>
                            {isEditing ? (
                            <div className="space-y-2 mb-2">
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="Nombre"
                                    value={(profileData as any).first_name || ''}
                                    onChange={handleInputChange}
                                    className="w-full text-center text-lg font-bold bg-input border border-border rounded-md p-2"
                                />
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Apellido"
                                    value={(profileData as any).last_name || ''}
                                    onChange={handleInputChange}
                                    className="w-full text-center text-lg font-bold bg-input border border-border rounded-md p-2"
                                />
                            </div>
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
                                placeholder= "Cargo / Título profesional"
                            />
                        ) : (
                            <p className="text-lg text-primary">{profileData.title || 'Sin Cargo / Título profesional'}</p>
                        )}
                        {isEditing ? (
                            <input
                                type="text"
                                name="company"
                                value={profileData.company || ''}
                                onChange={handleInputChange}
                                className="w-full text-center text-md text-muted-foreground bg-input border border-border rounded-md p-2 mt-2"
                                placeholder="Empresa / Institución / Área"
                            />
                        ) : (
                            <p className="text-md text-muted-foreground mb-4">
                                {profileData.company || 'Sin Empresa / Institución'}
                            </p>
                        )}
                        {isMentor && (
                            <div className="text-lg my-4">
                                <span className="font-bold text-yellow-500">
                                    ★ {(profileData as Mentor).rating.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">
                                    {' '}
                                    ({(profileData as Mentor).reviews} reseñas)
                                </span>
                            </div>
                        )}
                        {!isEditing && !isPublicView && (
                            <Button
                                onClick={() => setIsEditing(true)}
                                size="lg"
                                className="w-full mt-6 flex items-center justify-center gap-2"
                            >
                                <PencilIcon /> Editar Perfil
                            </Button>
                        )}
                        {isEditing && (
                            <div className="flex flex-col space-y-2 mt-6">
                                <Button
                                    onClick={handleSave}
                                    size="lg"
                                    className="w-full"
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    variant="secondary"
                                    className="w-full"
                                    disabled={saving}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card p-6 rounded-lg border border-border">
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                            Sobre Mí
                        </h2>
                        {isEditing ? (
                            <textarea
                                name={isMentor ? 'longBio' : 'bio'}
                                value={
                                    isMentor
                                        ? (profileData as Mentor).longBio
                                        : (profileData as Mentee).bio || ''
                                }
                                onChange={handleInputChange}
                                rows={6}
                                className="w-full text-lg text-foreground/90 whitespace-pre-line bg-input border border-border rounded-md p-3"
                                placeholder="Escribe una breve biografía sobre ti..."
                            />
                        ) : (
                            <p className="text-lg text-foreground/90 whitespace-pre-line">
                                {isMentor
                                    ? (profileData as Mentor).longBio || 'Sin biografía añadida.'
                                    : (profileData as Mentee).bio || 'Sin biografía añadida.'}
                            </p>
                        )}
                    </div>

                    {!isMentor && !isPublicView && (
                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                                Información Confidencial
                            </h2>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="pronouns"
                                            className="block text-sm font-medium mb-1"
                                        >
                                            Pronombres
                                        </label>
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
                                        <label
                                            htmlFor="neurodivergence"
                                            className="block text-sm font-medium mb-1"
                                        >
                                            Neurodivergencia (opcional)
                                        </label>
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
                                    <p className="text-xs text-muted-foreground">
                                        Esta información es opcional y solo será visible para tu
                                        mentora confirmada y los administradores.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-lg text-foreground/90 space-y-2">
                                    <p>
                                        <strong>Pronombres:</strong>{' '}
                                        {(profileData as Mentee).pronouns || 'No especificado'}
                                    </p>
                                    <p>
                                        <strong>Neurodivergencia:</strong>{' '}
                                        {(profileData as Mentee).neurodivergence || 'No especificado'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <TagEditor
                        title="Áreas de Especialización"
                        tags={profileData.interests || []}
                        tagType="interests"
                        restrictedOptions={interestOptions}
                    />
                    <TagEditor
                        title={isMentor ? 'Temas de Mentoría' : 'Mis Objetivos de Mentoría'}
                        tags={profileData.mentorshipGoals || []}
                        tagType="mentorshipGoals"
                        restrictedOptions={goalOptions}
                    />

                    {isMentor && (
                        <div className="bg-card p-6 rounded-lg border border-border">
                            <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                                Publicaciones y Enlaces
                            </h2>
                            <div className="space-y-3">
                                {((profileData as Mentor).links || []).length > 0 ? (
                                    ((profileData as Mentor).links || []).map((link, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between group bg-secondary/50 p-3 rounded-md"
                                        >
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-primary hover:underline"
                                            >
                                                <LinkIcon className="w-5 h-5 flex-shrink-0" />
                                                <span className="font-semibold truncate">
                                                    {link.title}
                                                </span>
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
                                    !isEditing && (
                                        <p className="text-muted-foreground">
                                            No se han añadido enlaces.
                                        </p>
                                    )
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
                                    <Button
                                        onClick={handleAddLink}
                                        size="sm"
                                        disabled={!newLink.title || !newLink.url}
                                    >
                                        Añadir Enlace
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-card p-6 rounded-lg border border-border">
                        <h2 className="text-2xl font-bold mb-4 border-b border-border pb-2">
                            Mi Disponibilidad
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {isMentor
                                ? 'Indica a las mentoreadas cuándo estás disponible.'
                                : 'Indica a las mentoras cuándo estás disponible.'}
                        </p>
                        <div className="space-y-3">
                            {Object.entries(profileData.availability || {}).map(
                                ([date, times]) => (
                                    <div
                                        key={date}
                                        className="bg-secondary p-3 rounded-md flex items-center justify-between"
                                    >
                                        <p className="font-semibold">
                                            {new Date(date).toLocaleDateString('es-ES', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            {(times as string[]).map(time => (
                                                <Tag key={time}>{time}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                        {!isPublicView && (
                            <div className="flex flex-wrap items-center gap-4 mt-4">
                                {isEditing && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsCalendarOpen(true)}
                                    >
                                        Gestionar Disponibilidad
                                    </Button>
                                )}
                                <GoogleCalendarButton />
                            </div>
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