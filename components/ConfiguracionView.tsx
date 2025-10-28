import React, { useRef, useState, useEffect } from 'react';
import Button from './ui/Button';
import { EmpresaInfo } from '../types';

interface ConfiguracionViewProps {
    empresaInfo: EmpresaInfo | null;
    setEmpresaInfo: React.Dispatch<React.SetStateAction<EmpresaInfo | null>>;
}

const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);


const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({ empresaInfo, setEmpresaInfo }) => {
    // FIX: Use separate refs for logo and import file inputs to avoid conflicts.
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);
    const [formState, setFormState] = useState<EmpresaInfo>({
        nombre: '',
        direccion: '',
        correo: '',
        telefono: '',
        detallesServicio: '',
        logoUrl: '',
    });

    useEffect(() => {
        if (empresaInfo) {
            setFormState(empresaInfo);
        }
    }, [empresaInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setFormState(prev => ({ ...prev, logoUrl: '' }));
         if (logoFileInputRef.current) {
            logoFileInputRef.current.value = '';
        }
    };

    const handleSaveEmpresaInfo = (e: React.FormEvent) => {
        e.preventDefault();
        setEmpresaInfo(formState);
        alert('Información de la empresa guardada.');
    };

    const handleExport = () => {
        try {
            const dataToExport: Record<string, unknown> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !key.startsWith('firebase:')) { // Avoid exporting firebase session data
                    dataToExport[key] = JSON.parse(localStorage.getItem(key)!);
                }
            }
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const companyName = empresaInfo?.nombre?.replace(/\s/g, '_') || 'bocadillopro';
            a.download = `${companyName}_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Hubo un error al exportar los datos.");
        }
    };

    const handleImportClick = () => {
        importFileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not a text file.");
                const data = JSON.parse(text);

                if (window.confirm("¿Seguro que quieres importar estos datos? Se sobrescribirán los datos actuales.")) {
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    });
                    alert("Datos importados con éxito. La página se recargará.");
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error importing data:", error);
                alert("El archivo de respaldo no es válido o está corrupto.");
            }
        };
        reader.readAsText(file);
        if(event.target) event.target.value = '';
    };

    const handleReset = () => {
        if (window.confirm("¡ADVERTENCIA! Esta acción es irreversible. ¿Estás seguro de que quieres eliminar TODOS los datos de la aplicación?")) {
            localStorage.clear();
            alert("Todos los datos han sido eliminados. La página se recargará.");
            window.location.reload();
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">Configuración</h2>
            <div className="space-y-8 max-w-2xl mx-auto">
                <form onSubmit={handleSaveEmpresaInfo} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="font-semibold text-lg">Información de la Empresa</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Estos datos aparecerán en los presupuestos generados.</p>
                    
                    <div>
                        <label className="label-style">Logo de la Empresa</label>
                        <div className="mt-1 flex items-center gap-4">
                            {formState.logoUrl ? (
                                <img src={formState.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-md bg-slate-100 dark:bg-slate-700 p-1" />
                            ) : (
                                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-slate-400">
                                    <ImageIcon className="w-8 h-8"/>
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                                 <input
                                    type="file"
                                    id="logo-upload"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/svg+xml"
                                    onChange={handleLogoChange}
                                    ref={logoFileInputRef}
                                />
                                <Button type="button" variant="secondary" onClick={() => logoFileInputRef.current?.click()}>
                                    Cambiar Logo
                                </Button>
                                {formState.logoUrl && (
                                    <button type="button" onClick={handleRemoveLogo} className="text-sm text-red-600 hover:underline">
                                        Quitar Logo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="nombre" className="label-style">Nombre de la Empresa</label>
                        <input id="nombre" name="nombre" type="text" value={formState.nombre} onChange={handleChange} className="input-style w-full" />
                    </div>
                    <div>
                        <label htmlFor="direccion" className="label-style">Dirección</label>
                        <input id="direccion" name="direccion" type="text" value={formState.direccion} onChange={handleChange} className="input-style w-full" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="correo" className="label-style">Correo Electrónico</label>
                            <input id="correo" name="correo" type="email" value={formState.correo} onChange={handleChange} className="input-style w-full" />
                        </div>
                        <div>
                            <label htmlFor="telefono" className="label-style">Teléfono</label>
                            <input id="telefono" name="telefono" type="tel" value={formState.telefono} onChange={handleChange} className="input-style w-full" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="detallesServicio" className="label-style">Detalles y Especificaciones del Servicio</label>
                        <textarea id="detallesServicio" name="detallesServicio" value={formState.detallesServicio} onChange={handleChange} rows={4} className="input-style w-full" placeholder="Ej: Validez de la cotización, métodos de pago, políticas de cancelación, etc."></textarea>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Guardar Información</Button>
                    </div>
                </form>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-6">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <h3 className="font-semibold text-lg">Copia de Seguridad</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Guarda todos tus datos en un archivo JSON o restaura desde una copia de seguridad.</p>
                        <div className="flex gap-4">
                            <Button onClick={handleExport}>Exportar Datos</Button>
                            <Button onClick={handleImportClick} variant="secondary">Importar Datos</Button>
                            <input
                                type="file"
                                ref={importFileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <h3 className="font-semibold text-lg text-red-800 dark:text-red-300">Zona de Peligro</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">Esta acción eliminará permanentemente todos tus insumos, proveedores, bocadillos y presupuestos.</p>
                        <Button onClick={handleReset} className="bg-red-600 hover:bg-red-700 focus:ring-red-500 border-transparent text-white">
                            Eliminar Todos los Datos
                        </Button>
                    </div>
                </div>
            </div>
            <style>{`.input-style { @apply mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm; } .label-style { @apply block text-sm font-medium text-slate-700 dark:text-slate-300; }`}</style>
        </div>
    );
};

export default ConfiguracionView;