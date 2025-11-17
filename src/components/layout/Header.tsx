import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon,
} from "../common/Icons";
// FIX: Import Theme and UserRole types to resolve TypeScript errors.
import type { Theme, UserRole } from "../../../types";

interface HeaderProps {
  notificationCount: number;
  theme: Theme;
  toggleTheme: () => void;
}

interface NavLinkInfo {
  path: string;
  label: string;
  roles: UserRole[];
}

const Header: React.FC<HeaderProps> = ({
  notificationCount,
  theme,
  toggleTheme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks: NavLinkInfo[] = [
    { path: "/discover", label: "Descubrir Mentoras", roles: ["mentee"] },
    {
      path: "/dashboard",
      label: "Panel de Control",
      roles: ["mentee", "mentor"],
    },
    { path: "/library", label: "Biblioteca", roles: ["mentee", "mentor"] },
    { path: "/admin", label: "Panel de Admin", roles: ["admin"] },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case "mentee":
        return "Mentoreada";
      case "mentor":
        return "Mentora";
      case "admin":
        return "Admin";
      default:
        return "";
    }
  };

  const activeLinkClass = "text-primary";
  const inactiveLinkClass = "text-foreground/60 hover:text-foreground";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <NavLink
              to="/"
              className="shrink-0 font-bold text-2xl cursor-pointer text-primary"
            >
              MentorHer
            </NavLink>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            {role &&
              navLinks
                .filter((link) => link.roles.includes(role))
                .map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `text-lg font-medium transition-colors ${
                        isActive ? activeLinkClass : inactiveLinkClass
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
          </nav>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-accent transition-colors"
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
            {role !== "admin" && (
              <NavLink
                to="/notifications"
                className="relative p-2 rounded-full hover:bg-accent transition-colors"
              >
                <BellIcon />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </NavLink>
            )}
            {role && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <span>{getRoleName(role)}</span>
                  <ChevronDownIcon
                    className={`transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1">
                    {role !== "admin" && (
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        Mi Perfil
                      </button>
                    )}
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-accent"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-accent transition-colors"
              >
                {isMenuOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {role &&
              navLinks
                .filter((link) => link.roles.includes(role))
                .map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? "bg-accent text-primary"
                          : "text-foreground/80 hover:bg-accent"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
            {role !== "admin" && (
              <NavLink
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? "bg-accent text-primary"
                      : "text-foreground/80 hover:bg-accent"
                  }`
                }
              >
                Mi Perfil
              </NavLink>
            )}
            <div className="border-t border-border pt-4 mt-4">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-accent"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
