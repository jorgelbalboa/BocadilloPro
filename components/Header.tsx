import React from 'react';
import Toggle from './ui/Toggle';
import { View } from '../types';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
}

const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
);

const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);

const NavLink: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => {
    const activeClasses = "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400";
    const inactiveClasses = "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300";
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? activeClasses : inactiveClasses}`}
        >
            {children}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, isDarkMode, setIsDarkMode }) => {
    return (
        <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                           <h1 className="text-xl font-bold text-sky-600 dark:text-sky-400">BocadilloPro</h1>
                        </div>
                        <nav className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                <NavLink isActive={currentView === 'insumos'} onClick={() => setCurrentView('insumos')}>Insumos</NavLink>
                                <NavLink isActive={currentView === 'bocadillos'} onClick={() => setCurrentView('bocadillos')}>Bocadillos</NavLink>
                                <NavLink isActive={currentView === 'presupuestos'} onClick={() => setCurrentView('presupuestos')}>Presupuestos</NavLink>
                                <NavLink isActive={currentView === 'proveedores'} onClick={() => setCurrentView('proveedores')}>Proveedores</NavLink>
                                <NavLink isActive={currentView === 'configuracion'} onClick={() => setCurrentView('configuracion')}>Configuración</NavLink>
                            </div>
                        </nav>
                    </div>
                    <div className="flex items-center">
                         <div className="flex items-center space-x-2">
                            <SunIcon className={`w-6 h-6 ${isDarkMode ? 'text-slate-400' : 'text-yellow-500'}`} />
                            <Toggle isEnabled={isDarkMode} onToggle={setIsDarkMode} />
                            <MoonIcon className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-slate-400'}`} />
                        </div>
                    </div>
                </div>
                 {/* Mobile Nav */}
                <nav className="md:hidden py-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-baseline justify-center flex-wrap gap-x-2 gap-y-1">
                         <NavLink isActive={currentView === 'insumos'} onClick={() => setCurrentView('insumos')}>Insumos</NavLink>
                        <NavLink isActive={currentView === 'bocadillos'} onClick={() => setCurrentView('bocadillos')}>Bocadillos</NavLink>
                        <NavLink isActive={currentView === 'presupuestos'} onClick={() => setCurrentView('presupuestos')}>Presupuestos</NavLink>
                        <NavLink isActive={currentView === 'proveedores'} onClick={() => setCurrentView('proveedores')}>Proveedores</NavLink>
                        <NavLink isActive={currentView === 'configuracion'} onClick={() => setCurrentView('configuracion')}>Configuración</NavLink>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;