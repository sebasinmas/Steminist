import React, { useState } from 'react';
import type { Page, UserRole, Theme } from '../../types';
import { SunIcon, MoonIcon, BellIcon, ChevronDownIcon, MenuIcon, XIcon } from '../common/Icons';

interface HeaderProps {
    currentPage: Page;
    navigateTo: (page: Page) => void;
    userRole: UserRole;
    setUserRole: (role: UserRole) => void;
    notificationCount: number;
    theme: Theme;
    toggleTheme: () => void;
}

// FIX: Define an interface for navLinks to enforce type safety.
interface NavLink {
    page: Page;
    label: string;
    roles: UserRole[];
}

const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo, userRole, setUserRole, notificationCount, theme, toggleTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // FIX: Apply the NavLink type to the navLinks array to fix type inference issue.
    const navLinks: NavLink[] = [
        { page: 'discover', label: 'Descubrir Mentoras', roles: ['mentee'] },
        { page: 'dashboard', label: 'Panel de Control', roles: ['mentee', 'mentor'] },
        { page: 'admin_dashboard', label: 'Panel de Admin', roles: ['admin'] },
    ];

    const handleRoleChange = (role: UserRole) => {
        setUserRole(role);
        setIsDropdownOpen(false);
        if (role === 'mentee') {
            navigateTo('discover');
        } else if (role === 'mentor') {
            navigateTo('dashboard');
        } else if (role === 'admin') {
            navigateTo('admin_dashboard');
        }
    };

    const getRoleName = (role: UserRole) => {
        switch (role) {
            case 'mentee': return 'Mentoreada';
            case 'mentor': return 'Mentora';
            case 'admin': return 'Admin';
            default: return '';
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center">
                        <div onClick={() => navigateTo('landing')} className="flex-shrink-0 font-bold text-2xl cursor-pointer text-primary">
                            MentorHer
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center space-x-8">
                        {userRole && navLinks.filter(link => link.roles.includes(userRole)).map(link => (
                            <button
                                key={link.page}
                                onClick={() => navigateTo(link.page)}
                                className={`text-lg font-medium transition-colors ${currentPage === link.page ? 'text-primary' : 'text-foreground/60 hover:text-foreground'}`}
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-accent transition-colors">
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>
                        {userRole !== 'admin' && (
                            <button onClick={() => navigateTo('notifications')} className="relative p-2 rounded-full hover:bg-accent transition-colors">
                                <BellIcon />
                                {notificationCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{notificationCount}</span>
                                )}
                            </button>
                        )}
                        <div className="relative hidden md:block">
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors">
                                <span>{getRoleName(userRole)}</span>
                                <ChevronDownIcon className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1">
                                    {userRole !== 'admin' && <button onClick={() => { navigateTo('profile_self'); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Mi Perfil</button>}
                                    {userRole !== 'admin' && <div className="border-t border-border my-1"></div>}
                                    <button onClick={() => handleRoleChange('mentee')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Cambiar a Mentoreada</button>
                                    <button onClick={() => handleRoleChange('mentor')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Cambiar a Mentora</button>
                                    <button onClick={() => handleRoleChange('admin')} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent">Cambiar a Admin</button>
                                </div>
                            )}
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-accent transition-colors">
                                {isMenuOpen ? <XIcon /> : <MenuIcon />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-background border-t border-border">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                         {userRole && navLinks.filter(link => link.roles.includes(userRole)).map(link => (
                            <button
                                key={link.page}
                                onClick={() => { navigateTo(link.page); setIsMenuOpen(false); }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === link.page ? 'bg-accent text-primary' : 'text-foreground/80 hover:bg-accent'}`}
                            >
                                {link.label}
                            </button>
                        ))}
                        {userRole !== 'admin' && (
                            <button
                                onClick={() => { navigateTo('profile_self'); setIsMenuOpen(false); }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === 'profile_self' ? 'bg-accent text-primary' : 'text-foreground/80 hover:bg-accent'}`}
                            >
                                Mi Perfil
                            </button>
                        )}
                        <div className="border-t border-border pt-4 mt-4">
                            <p className="px-3 text-sm font-semibold text-foreground/60">Cambiar Rol:</p>
                             <button onClick={() => { handleRoleChange('mentee'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:bg-accent">Mentoreada</button>
                             <button onClick={() => { handleRoleChange('mentor'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:bg-accent">Mentora</button>
                             <button onClick={() => { handleRoleChange('admin'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:bg-accent">Admin</button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;