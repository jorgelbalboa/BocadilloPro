import React, { useState, useMemo, useEffect } from 'react';
import { Bocadillo, Insumo, Proveedor, BocadilloInsumo, SnackIdea } from '../types';
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

const calculateCostoTotalReceta = (bocadilloInsumos: BocadilloInsumo[], insumosMap: Map<string, Insumo>): number => {
    return bocadilloInsumos.reduce((acc, item) => {
        const insumo = insumosMap.get(item.insumoId);
        if (!insumo || insumo.cantidadMedida === 0) return acc;
        
        const costPerBaseUnit = insumo.costo / insumo.cantidadMedida;
        const convertedQuantity = convertUnits(item.cantidad, item.unidad, insumo.unidadMedida);

        if (convertedQuantity === null) {
            console.warn(`Could not convert ${item.unidad} to ${insumo.unidadMedida} for insumo ${insumo.nombre}`);
            return acc; // Skip if units are incompatible
        }

        return acc + (convertedQuantity * costPerBaseUnit);
    }, 0);
};

export const BocadilloForm: React.FC<{
    onSubmit: (bocadillo: Omit<Bocadillo, 'id'>) => void;
    initialData?: Bocadillo | null;
    insumos: Insumo[];
    onAddNewInsumo: () => void;
    snackIdea?: SnackIdea | null;
}> = ({ onSubmit, initialData, insumos, onAddNewInsumo, snackIdea }) => {
    const [nombre, setNombre] = useState(initialData?.nombre || '');
    const [cantidadReceta, setCantidadReceta] = useState(initialData?.cantidadReceta || 1);
    const [porcentajeGanancia, setPorcentajeGanancia] = useState(initialData?.porcentajeGanancia || 100);
    const [formInsumos, setFormInsumos] = useState<BocadilloInsumo[]>(initialData?.insumos || []);
    const [insumoToAdd, setInsumoToAdd] = useState('');
    
    const insumosMap = useMemo(() => new Map(insumos.map(i => [i.id, i])), [insumos]);

    useEffect(() => {
        if (snackIdea) {
            setNombre(snackIdea.snackName);
            // This is a simple mapping. A more complex one could try to match ingredients to existing insumos.
            setFormInsumos([]); 
        }
    }, [snackIdea]);
    
    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre);
            setCantidadReceta(initialData.cantidadReceta);
            setPorcentajeGanancia(initialData.porcentajeGanancia);
            setFormInsumos(initialData.insumos);
        }
    }, [initialData]);

    const costoTotal = useMemo(() => calculateCostoTotalReceta(formInsumos, insumosMap), [formInsumos, insumosMap]);
    const costoPorUnidad = cantidadReceta > 0 ? costoTotal / cantidadReceta : 0;
    const precioVenta = costoPorUnidad * (1 + porcentajeGanancia / 100);

    const availableInsumos = useMemo(() => {
        const selectedIds = new Set(formInsumos.map(i => i.insumoId));
        return insumos.filter(i => !selectedIds.has(i.id)).sort((a,b) => a.nombre.localeCompare(b.nombre));
    }, [insumos, formInsumos]);

    const handleAddInsumoToList = () => {
        const insumo = insumosMap.get(insumoToAdd);
        if (insumo) {
            setFormInsumos(prev => [...prev, {
                insumoId: insumo.id,
                cantidad: 1,
                unidad: insumo.unidadMedida
            }]);
            setInsumoToAdd('');
        }
    };

    const handleRemoveInsumo = (insumoId: string) => {
        setFormInsumos(prev => prev.filter(i => i.insumoId !== insumoId));
    };

    const handleInsumoChange = (insumoId: string, field: 'cantidad' | 'unidad', value: string | number) => {
        setFormInsumos(prev => prev.map(i => 
            i.insumoId === insumoId ? { ...i, [field]: field === 'cantidad' ? parseFloat(value as string) || 0 : value } : i
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            nombre,
            precioVenta: isFinite(precioVenta) ? precioVenta : 0,
            insumos: formInsumos,
            cantidadReceta,
            porcentajeGanancia,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="label-style">Nombre del Bocadillo</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="input-style w-full" />
            </div>
            
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="label-style">Ingredientes (Insumos)</h4>
                     <Button type="button" variant="secondary" onClick={onAddNewInsumo} className="!p-2" title="Añadir nuevo insumo">
                        <PlusIcon className="w-5 h-5"/>
                    </Button>
                </div>
                <div className="space-y-2">
                    {formInsumos.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-700/50 rounded-md">Añade insumos a la receta.</p>}
                    {formInsumos.map(item => {
                        const insumo = insumosMap.get(item.insumoId);
                        if (!insumo) return null;
                        return (
                             <div key={item.insumoId} className="grid grid-cols-12 gap-2 items-center">
                                <span className="text-sm truncate col-span-11 sm:col-span-5" title={insumo.nombre}>{insumo.nombre}</span>
                                <input type="number" min="0" step="any" value={item.cantidad} onChange={e => handleInsumoChange(item.insumoId, 'cantidad', e.target.value)} className="input-style w-full col-span-5 sm:col-span-3" />
                                <select value={item.unidad} onChange={e => handleInsumoChange(item.insumoId, 'unidad', e.target.value)} className="input-style w-full col-span-6 sm:col-span-3">
                                    <option value="pza">pza</option>
                                    <option value="unidad">unidad</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                </select>
                                <button type="button" onClick={() => handleRemoveInsumo(item.insumoId)} className="p-2 text-slate-400 hover:text-red-500 col-span-1 justify-self-end">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        )
                    })}
                </div>
                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="label-style mb-1">Añadir Insumo a la Receta</label>
                    <div className="flex items-center gap-2">
                        <select value={insumoToAdd} onChange={e => setInsumoToAdd(e.target.value)} className="input-style flex-grow">
                             <option value="" disabled>Selecciona un insumo...</option>
                             {availableInsumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                        </select>
                        <Button type="button" variant="secondary" onClick={handleAddInsumoToList} disabled={!insumoToAdd || availableInsumos.length === 0}>
                            Añadir
                        </Button>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="label-style">Rendimiento de la Receta</label>
                    <input type="number" value={cantidadReceta} onChange={e => setCantidadReceta(parseInt(e.target.value) || 1)} required min="1" step="1" className="input-style w-full" placeholder="Unidades por receta"/>
                </div>
                <div>
                    <label className="label-style">Porcentaje de Ganancia</label>
                     <div className="relative">
                        <input type="number" value={porcentajeGanancia} onChange={e => setPorcentajeGanancia(parseFloat(e.target.value) || 0)} required min="0" step="1" className="input-style w-full" placeholder="Ej: 150"/>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-sm">%</span>
                    </div>
                </div>
            </div>

             <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Costo por Unidad</p>
                    <p className="font-semibold text-lg">${costoPorUnidad.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Precio de Venta Sugerido</p>
                    <p className="font-bold text-xl text-sky-600 dark:text-sky-400">${precioVenta.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={formInsumos.length === 0}>{initialData ? 'Actualizar' : 'Crear'} Bocadillo</Button>
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
    const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
    const [ideas, setIdeas] = useState<SnackIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [selectedIdea, setSelectedIdea] = useState<SnackIdea | null>(null);

    // State for nested modals
    const [isNewInsumoModalOpen, setIsNewInsumoModalOpen] = useState(false);
    const [isNewProveedorModalOpen, setIsNewProveedorModalOpen] = useState(false);
    const [newlyCreatedProveedorId, setNewlyCreatedProveedorId] = useState<string | null>(null);

    const insumosMap = useMemo(() => new Map(insumos.map(i => [i.id, i])), [insumos]);
    
    const handleAddBocadillo = (bocadilloData: Omit<Bocadillo, 'id'>) => {
        const newBocadillo: Bocadillo = { id: crypto.randomUUID(), ...bocadilloData };
        setBocadillos(prev => [...prev, newBocadillo].sort((a,b) => a.nombre.localeCompare(b.nombre)));
        setIsModalOpen(false);
        setSelectedIdea(null);
    };

    const handleEditBocadillo = (bocadilloData: Omit<Bocadillo, 'id'>) => {
        if (!editingBocadillo) return;
        setBocadillos(prev => prev.map(b => b.id === editingBocadillo.id ? { ...b, ...bocadilloData } : b));
        setEditingBocadillo(null);
        setIsModalOpen(false);
    };

    const handleDeleteBocadillo = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este bocadillo?')) {
            setBocadillos(prev => prev.filter(b => b.id !== id));
        }
    };
    
    const handleGenerateIdeas = async () => {
        setIsIdeasModalOpen(true);
        setIsLoadingIdeas(true);
        try {
            const ingredientNames = insumos.map(i => i.nombre);
            const generatedIdeas = await generateSnackIdeas(ingredientNames);
            setIdeas(generatedIdeas);
        } catch (error) {
            console.error(error);
            alert('Hubo un error al generar ideas. Intenta de nuevo.');
        } finally {
            setIsLoadingIdeas(false);
        }
    };

    const handleSelectIdea = (idea: SnackIdea) => {
        setSelectedIdea(idea);
        setIsIdeasModalOpen(false);
        setEditingBocadillo(null);
        setIsModalOpen(true);
    };

    // --- Handlers for nested modals ---
    const handleAddInsumo = (data: Omit<Insumo, 'id'>) => {
        const newInsumo: Insumo = { id: crypto.randomUUID(), ...data };
        setInsumos(prev => [...prev, newInsumo]);
        setIsNewInsumoModalOpen(false);
    };

    const handleAddProveedor = (data: Omit<Proveedor, 'id'>) => {
        const newProveedor: Proveedor = { id: crypto.randomUUID(), ...data };
        setProveedores(prev => [...prev, newProveedor]);
        setNewlyCreatedProveedorId(newProveedor.id);
        setIsNewProveedorModalOpen(false);
    };
    // --- End Handlers for nested modals ---

    const openEditModal = (bocadillo: Bocadillo) => {
        setSelectedIdea(null);
        setEditingBocadillo(bocadillo);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setSelectedIdea(null);
        setEditingBocadillo(null);
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gestión de Bocadillos</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
                    <Button onClick={handleGenerateIdeas} variant="secondary">
                        <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
                        Generar Ideas (IA)
                    </Button>
                    <Button onClick={openAddModal}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nuevo Bocadillo
                    </Button>
                </div>
            </div>

            {bocadillos.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No hay bocadillos creados</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">¡Crea tu primer bocadillo para añadirlo a los presupuestos!</p>
                     <div className="mt-6">
                        <Button onClick={openAddModal}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Crear Bocadillo
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {bocadillos.map(bocadillo => {
                        const costoTotal = calculateCostoTotalReceta(bocadillo.insumos, insumosMap);
                        const costoPorUnidad = bocadillo.cantidadReceta > 0 ? costoTotal / bocadillo.cantidadReceta : 0;
                        return (
                            <div key={bocadillo.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col justify-between animate-slide-in-up">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{bocadillo.nombre}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Rinde {bocadillo.cantidadReceta} pzas.</p>
                                    <div className="flex justify-between items-baseline mt-2">
                                        <p className="text-sm">Costo: <span className="font-semibold">${costoPorUnidad.toFixed(2)}</span></p>
                                        <p className="text-xl font-bold text-sky-600 dark:text-sky-400">${bocadillo.precioVenta.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button onClick={() => openEditModal(bocadillo)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDeleteBocadillo(bocadillo.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            
             <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedIdea(null); }} title={editingBocadillo ? 'Editar Bocadillo' : 'Nuevo Bocadillo'}>
                <BocadilloForm 
                    onSubmit={editingBocadillo ? handleEditBocadillo : handleAddBocadillo}
                    initialData={editingBocadillo}
                    insumos={insumos}
                    onAddNewInsumo={() => setIsNewInsumoModalOpen(true)}
                    snackIdea={selectedIdea}
                />
            </Modal>

            <Modal isOpen={isIdeasModalOpen} onClose={() => setIsIdeasModalOpen(false)} title="Ideas de Bocadillos (IA)">
                {isLoadingIdeas ? (
                    <div className="text-center p-8">
                        <p className="animate-pulse">Generando ideas...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ideas.length === 0 ? <p>No se pudieron generar ideas. Asegúrate de tener insumos agregados.</p> : null}
                        {ideas.map((idea, index) => (
                            <div key={index} className="p-4 rounded-lg bg-slate-100 dark:bg-slate-700">
                                <h4 className="font-semibold">{idea.snackName}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Ingredientes: {idea.ingredients.join(', ')}</p>
                                <div className="text-right mt-2">
                                    <Button variant="secondary" onClick={() => handleSelectIdea(idea)}>Usar esta idea</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
