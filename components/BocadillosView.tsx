import React, { useState, useMemo, useEffect } from 'react';
import { Bocadillo, Insumo, BocadilloInsumo, SnackIdea, Proveedor } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { generateSnackIdeas } from '../services/geminiService';
import { InsumoForm, ProveedorQuickForm } from './InsumosView';

// --- Unit Conversion Logic ---
const CONVERSIONS: Record<string, number> = {
    'kg': 1000, 'g': 1, 'mg': 0.001,
    'L': 1000, 'ml': 1,
};
const UNIT_TYPES: Record<string, string> = {
    'kg': 'weight', 'g': 'weight', 'mg': 'weight',
    'L': 'volume', 'ml': 'volume',
};
const getCompatibleUnits = (unit: string): string[] => {
    const type = UNIT_TYPES[unit];
    if (!type) return [unit]; // For units like 'pza', 'unidad'
    return Object.keys(UNIT_TYPES).filter(u => UNIT_TYPES[u] === type);
};
const convertUnits = (value: number, fromUnit: string, toUnit: string): number | null => {
    if (fromUnit === toUnit) return value;
    const fromType = UNIT_TYPES[fromUnit];
    const toType = UNIT_TYPES[toUnit];
    if (!fromType || fromType !== toType) return null; // Incompatible units
    const fromBase = CONVERSIONS[fromUnit];
    const toBase = CONVERSIONS[toUnit];
    return (value * fromBase) / toBase;
};
// --- End Unit Conversion Logic ---

export const BocadilloForm: React.FC<{
    onSubmit: (bocadillo: Omit<Bocadillo, 'id'>) => void;
    initialData?: Bocadillo | null;
    insumos: Insumo[];
    onAddNewInsumo: () => void;
}> = ({ onSubmit, initialData, insumos, onAddNewInsumo }) => {
    const [nombre, setNombre] = useState(initialData?.nombre || '');
    const [cantidadReceta, setCantidadReceta] = useState(initialData?.cantidadReceta || 1);
    const [precioVenta, setPrecioVenta] = useState(initialData?.precioVenta || 0);
    const [selectedInsumos, setSelectedInsumos] = useState<BocadilloInsumo[]>(initialData?.insumos || []);
    const [porcentajeGanancia, setPorcentajeGanancia] = useState(initialData?.porcentajeGanancia?.toString() || '');
    const [insumoToAdd, setInsumoToAdd] = useState('');

    const insumosMap = useMemo(() => new Map(insumos.map(i => [i.id, i])), [insumos]);

    const availableInsumos = useMemo(() => {
        const selectedIds = new Set(selectedInsumos.map(i => i.insumoId));
        return insumos.filter(i => !selectedIds.has(i.id)).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [insumos, selectedInsumos]);

    const handleAddInsumoToList = () => {
        if (!insumoToAdd) return;
        const insumo = insumosMap.get(insumoToAdd);
        if (insumo) {
            setSelectedInsumos([...selectedInsumos, {
                insumoId: insumo.id,
                cantidad: 1,
                unidad: insumo.unidadMedida
            }]);
            setInsumoToAdd(''); // Reset dropdown
        }
    };
    
    const handleRemoveInsumo = (insumoId: string) => {
        setSelectedInsumos(selectedInsumos.filter(i => i.insumoId !== insumoId));
    };
    
    const handleSelectedInsumoChange = (insumoId: string, field: 'cantidad' | 'unidad', value: string | number) => {
        setSelectedInsumos(selectedInsumos.map(i =>
            i.insumoId === insumoId ? { ...i, [field]: value } : i
        ));
    };

    const costoTotal = useMemo(() => {
        return selectedInsumos.reduce((acc, item) => {
            const insumo = insumosMap.get(item.insumoId);
            if (!insumo || insumo.cantidadMedida === 0) return acc;

            const costPerBaseUnit = insumo.costo / insumo.cantidadMedida;
            const convertedQuantity = convertUnits(item.cantidad, item.unidad, insumo.unidadMedida);

            if (convertedQuantity === null) return acc; 

            return acc + (costPerBaseUnit * convertedQuantity);
        }, 0);
    }, [selectedInsumos, insumosMap]);
    
    const costoPorUnidad = useMemo(() => (
        cantidadReceta > 0 ? costoTotal / cantidadReceta : 0
    ), [costoTotal, cantidadReceta]);
    
    const handlePorcentajeChange = (value: string) => {
        setPorcentajeGanancia(value);
        const percentage = parseFloat(value);
        if (!isNaN(percentage) && costoPorUnidad >= 0) {
            const newPrice = costoPorUnidad * (1 + percentage / 100);
            setPrecioVenta(parseFloat(newPrice.toFixed(2)));
        }
    };
    
    const handlePrecioVentaChange = (value: number) => {
        setPrecioVenta(value);
        if (costoPorUnidad > 0) {
            const newPercentage = ((value / costoPorUnidad) - 1) * 100;
            setPorcentajeGanancia(newPercentage.toFixed(2));
        } else {
            setPorcentajeGanancia('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ 
            nombre, 
            precioVenta, 
            insumos: selectedInsumos, 
            cantidadReceta, 
            porcentajeGanancia: parseFloat(porcentajeGanancia) || 0 
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className="label-style">Nombre del Bocadillo</label>
                    <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="input-style w-full" />
                </div>
                 <div>
                    <label className="label-style">Rinde (pzas)</label>
                    <input 
                        type="number" 
                        value={cantidadReceta} 
                        onChange={e => setCantidadReceta(Math.max(1, parseInt(e.target.value, 10)) || 1)} 
                        required 
                        min="1" 
                        step="1" 
                        className="input-style w-full" 
                    />
                </div>
            </div>
            
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="label-style">Insumos de la Receta</h4>
                    <Button type="button" variant="secondary" onClick={onAddNewInsumo} className="!p-2" title="Crear nuevo insumo en el inventario">
                        <PlusIcon className="w-5 h-5"/>
                    </Button>
                </div>
                <div className="space-y-3">
                    {selectedInsumos.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-700/50 rounded-md">Añade insumos a tu receta.</p>
                    )}
                    {selectedInsumos.map(item => {
                        const insumo = insumosMap.get(item.insumoId);
                        if (!insumo) return null;
                        const compatibleUnits = getCompatibleUnits(insumo.unidadMedida);
                        return (
                            <div key={item.insumoId} className="grid grid-cols-12 gap-2 items-center">
                                <span className="text-sm truncate col-span-5">{insumo.nombre}</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.cantidad}
                                    placeholder="Cant."
                                    onChange={e => handleSelectedInsumoChange(item.insumoId, 'cantidad', parseFloat(e.target.value) || 0)}
                                    className="input-style w-full col-span-3"
                                />
                                 <select
                                    value={item.unidad}
                                    onChange={e => handleSelectedInsumoChange(item.insumoId, 'unidad', e.target.value)}
                                    className="input-style w-full col-span-3"
                                    disabled={compatibleUnits.length <= 1}
                                >
                                    {compatibleUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                </select>
                                <button type="button" onClick={() => handleRemoveInsumo(item.insumoId)} className="p-2 text-slate-400 hover:text-red-500 col-span-1 justify-self-end">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="label-style mb-1">Añadir Insumo del Inventario</label>
                    <div className="flex items-center gap-2">
                        <select value={insumoToAdd} onChange={e => setInsumoToAdd(e.target.value)} className="input-style flex-grow">
                            <option value="" disabled>Selecciona un insumo...</option>
                            {availableInsumos.map(i => (
                                <option key={i.id} value={i.id}>{i.nombre}</option>
                            ))}
                        </select>
                        <Button type="button" variant="secondary" onClick={handleAddInsumoToList} disabled={!insumoToAdd || availableInsumos.length === 0}>
                            Añadir
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="label-style">Costo de Producción (Total)</label>
                        <p className="font-semibold text-lg">${costoTotal.toFixed(2)}</p>
                        {cantidadReceta > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">(${(costoPorUnidad).toFixed(2)} por unidad)</p>}
                    </div>
                    <div>
                        <label className="label-style">Porcentaje de Ganancia (%)</label>
                        <input 
                            type="number" 
                            value={porcentajeGanancia} 
                            onChange={e => handlePorcentajeChange(e.target.value)}
                            step="0.1" 
                            className="input-style w-full"
                            placeholder="Ej. 50"
                        />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                     <div>
                        <label className="label-style">Precio de Venta (por unidad)</label>
                        <input 
                            type="number" 
                            value={precioVenta} 
                            onChange={e => handlePrecioVentaChange(parseFloat(e.target.value) || 0)} 
                            required 
                            min="0"
                            step="0.01" 
                            className="input-style w-full" 
                        />
                    </div>
                     <div>
                        <label className="label-style">Precio Venta (paquete de {cantidadReceta})</label>
                        <div className="input-style w-full bg-slate-100 dark:bg-slate-700 flex items-center h-[38px]">
                           ${(precioVenta * cantidadReceta).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Actualizar' : 'Crear'} Bocadillo</Button>
            </div>
        </form>
    );
};

interface BocadillosViewProps {
    bocadillos: Bocadillo[];
    setBocadillos: React.Dispatch<React.SetStateAction<Bocadillo[]>>;
    insumos: Insumo[];
    setInsumos: React.Dispatch<React.SetStateAction<Insumo[]>>;
    proveedores: Proveedor[];
    setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
}

const BocadillosView: React.FC<BocadillosViewProps> = ({ bocadillos, setBocadillos, insumos, setInsumos, proveedores, setProveedores }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBocadillo, setEditingBocadillo] = useState<Bocadillo | null>(null);
    const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [snackIdeas, setSnackIdeas] = useState<SnackIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isNewInsumoModalOpen, setIsNewInsumoModalOpen] = useState(false);
    const [isNewProveedorModalOpen, setIsNewProveedorModalOpen] = useState(false);
    const [newlyCreatedProveedorId, setNewlyCreatedProveedorId] = useState<string | null>(null);


    const insumosMap = useMemo(() => new Map(insumos.map(i => [i.id, i])), [insumos]);

    const calculateCosto = (bocadilloInsumos: BocadilloInsumo[]): number => {
        return bocadilloInsumos.reduce((acc, item) => {
            const insumo = insumosMap.get(item.insumoId);
            if (!insumo || insumo.cantidadMedida === 0) return acc;
            
            const costPerBaseUnit = insumo.costo / insumo.cantidadMedida;
            const convertedQuantity = convertUnits(item.cantidad, item.unidad, insumo.unidadMedida);

            if (convertedQuantity === null) {
                console.warn(`Could not convert ${item.unidad} to ${insumo.unidadMedida} for insumo ${insumo.nombre}`);
                return acc;
            }

            return acc + (convertedQuantity * costPerBaseUnit);
        }, 0);
    };
    
    useEffect(() => {
        // Automatically update snack prices when insumos change, preserving profit margin
        setBocadillos(prevBocadillos => {
            const currentInsumosMap = new Map(insumos.map(i => [i.id, i]));

            const calculateCostoWithMap = (bocadilloInsumos: BocadilloInsumo[]): number => {
                 return bocadilloInsumos.reduce((acc, item) => {
                    const insumo = currentInsumosMap.get(item.insumoId);
                    if (!insumo || insumo.cantidadMedida === 0) return acc;
                    const costPerBaseUnit = insumo.costo / insumo.cantidadMedida;
                    const convertedQuantity = convertUnits(item.cantidad, item.unidad, insumo.unidadMedida);
                    if (convertedQuantity === null) return acc;
                    return acc + (convertedQuantity * costPerBaseUnit);
                }, 0);
            }

            const updatedBocadillos = prevBocadillos.map(b => {
                const costoTotal = calculateCostoWithMap(b.insumos);
                const costoPorUnidad = b.cantidadReceta > 0 ? costoTotal / b.cantidadReceta : 0;
                const newPrecioVenta = costoPorUnidad * (1 + (b.porcentajeGanancia || 0) / 100);
                if (Math.abs(b.precioVenta - newPrecioVenta) > 0.001) {
                    return {
                        ...b,
                        precioVenta: parseFloat(newPrecioVenta.toFixed(2))
                    };
                }
                return b;
            });
            
            if (JSON.stringify(prevBocadillos) !== JSON.stringify(updatedBocadillos)) {
                return updatedBocadillos;
            }
            return prevBocadillos;
        });
    }, [insumos, setBocadillos]);


    const handleAdd = (data: Omit<Bocadillo, 'id'>) => {
        const newBocadillo: Bocadillo = { id: crypto.randomUUID(), ...data };
        setBocadillos(prev => [...prev, newBocadillo]);
        setIsModalOpen(false);
    };

    const handleEdit = (data: Omit<Bocadillo, 'id'>) => {
        if (!editingBocadillo) return;
        setBocadillos(prev => prev.map(b => b.id === editingBocadillo.id ? { ...editingBocadillo, ...data } : b));
        setEditingBocadillo(null);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este bocadillo?')) {
            setBocadillos(prev => prev.filter(b => b.id !== id));
        }
    };
    
    const handleGenerateIdeas = async () => {
        setIsLoadingIdeas(true);
        setError(null);
        setSnackIdeas([]);
        try {
            const ingredientNames = insumos.map(i => i.nombre);
            if (ingredientNames.length === 0) {
                setError("Añade algunos insumos primero para generar ideas.");
                setIsLoadingIdeas(false);
                return;
            }
            const ideas = await generateSnackIdeas(ingredientNames);
            setSnackIdeas(ideas);
            setIsIdeaModalOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocurrió un error desconocido.");
        } finally {
            setIsLoadingIdeas(false);
        }
    };

    const handleAddInsumo = (insumoData: Omit<Insumo, 'id'>) => {
        const newInsumo: Insumo = { id: crypto.randomUUID(), ...insumoData };
        setInsumos(prev => [...prev, newInsumo]);
        setIsNewInsumoModalOpen(false);
    };

    const handleAddProveedor = (proveedorData: Omit<Proveedor, 'id'>) => {
        const newProveedor: Proveedor = { id: crypto.randomUUID(), ...proveedorData };
        setProveedores(prev => [...prev, newProveedor]);
        setNewlyCreatedProveedorId(newProveedor.id);
        setIsNewProveedorModalOpen(false);
    };


    const openEditModal = (bocadillo: Bocadillo) => {
        setEditingBocadillo(bocadillo);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingBocadillo(null);
        setIsModalOpen(true);
    };
    
    const openAddNewInsumoModal = () => {
        setNewlyCreatedProveedorId(null);
        setIsNewInsumoModalOpen(true);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gestión de Bocadillos</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
                     <Button onClick={handleGenerateIdeas} variant="secondary" disabled={isLoadingIdeas || insumos.length === 0} title={insumos.length === 0 ? "Añade insumos primero" : "Generar ideas con IA"}>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoadingIdeas ? 'Generando...' : 'Generar Ideas (IA)'}
                    </Button>
                    <Button onClick={openAddModal}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nuevo Bocadillo
                    </Button>
                </div>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            {bocadillos.length === 0 ? (
                 <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No has creado bocadillos</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Crea tu primer bocadillo o usa el generador de ideas.</p>
                    <div className="mt-6">
                        <Button onClick={openAddModal}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Crear Bocadillo
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bocadillos.map(bocadillo => {
                        const costoTotal = calculateCosto(bocadillo.insumos);
                        const costoPorUnidad = bocadillo.cantidadReceta > 0 ? costoTotal / bocadillo.cantidadReceta : 0;
                        return (
                            <div key={bocadillo.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col justify-between animate-slide-in-up">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{bocadillo.nombre}</h4>
                                    <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-2">${bocadillo.precioVenta.toFixed(2)}</p>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        <span>Costo: ${costoPorUnidad.toFixed(2)}</span>
                                        <span className="mx-2">|</span>
                                        <span className={bocadillo.porcentajeGanancia >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                            Ganancia: {bocadillo.porcentajeGanancia.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-2">
                                        <h5 className="text-sm font-semibold mb-1">Insumos ({bocadillo.insumos.length}):</h5>
                                        <ul className="text-xs list-disc list-inside text-slate-600 dark:text-slate-300 max-h-20 overflow-y-auto">
                                            {bocadillo.insumos.map(bi => (
                                                <li key={bi.insumoId}>{insumosMap.get(bi.insumoId)?.nombre || 'Insumo no encontrado'}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button onClick={() => openEditModal(bocadillo)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(bocadillo.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBocadillo ? 'Editar Bocadillo' : 'Nuevo Bocadillo'}>
                <BocadilloForm
                    onSubmit={editingBocadillo ? handleEdit : handleAdd}
                    initialData={editingBocadillo}
                    insumos={insumos}
                    onAddNewInsumo={openAddNewInsumoModal}
                />
            </Modal>

            <Modal isOpen={isIdeaModalOpen} onClose={() => setIsIdeaModalOpen(false)} title="Ideas para Bocadillos (IA)">
                {snackIdeas.length > 0 ? (
                    <div className="space-y-4">
                        {snackIdeas.map((idea, index) => (
                            <div key={index} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <h4 className="font-semibold text-sky-700 dark:text-sky-400">{idea.snackName}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Ingredientes: {idea.ingredients.join(', ')}</p>
                            </div>
                        ))}
                    </div>
                ) : <p>No se generaron ideas. Intenta de nuevo.</p>}
            </Modal>
            
            <Modal isOpen={isNewInsumoModalOpen} onClose={() => setIsNewInsumoModalOpen(false)} title="Nuevo Insumo">
                <InsumoForm 
                    onSubmit={handleAddInsumo}
                    proveedores={proveedores}
                    onAddNewProveedor={() => setIsNewProveedorModalOpen(true)}
                    newlyCreatedProveedorId={newlyCreatedProveedorId}
                />
            </Modal>
            
            <Modal isOpen={isNewProveedorModalOpen} onClose={() => setIsNewProveedorModalOpen(false)} title="Nuevo Proveedor">
                <ProveedorQuickForm onSubmit={handleAddProveedor} />
            </Modal>

            <style>{`.input-style { @apply mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm; } .label-style { @apply block text-sm font-medium text-slate-700 dark:text-slate-300; }`}</style>
        </div>
    );
};

export default BocadillosView;