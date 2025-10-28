import React, { useState, useMemo, useEffect } from 'react';
import { Insumo, GroupBy, Proveedor } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

// A smaller, focused form for creating a new provider quickly.
export const ProveedorQuickForm: React.FC<{ onSubmit: (proveedor: Omit<Proveedor, 'id'>) => void }> = ({ onSubmit }) => {
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [direccion, setDireccion] = useState('');
    const [paginaWeb, setPaginaWeb] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');
    const [ubicacionUrl, setUbicacionUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ nombre, telefono, correo, direccion, paginaWeb, fotoUrl, ubicacionUrl });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="input-style w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                    <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className="input-style w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electrónico</label>
                    <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} className="input-style w-full" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
                <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} className="input-style w-full" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Página Web</label>
                <input type="url" value={paginaWeb} onChange={e => setPaginaWeb(e.target.value)} className="input-style w-full" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL de la Foto</label>
                <input type="url" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} className="input-style w-full" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ubicación (Enlace de Maps)</label>
                <input type="url" value={ubicacionUrl} onChange={e => setUbicacionUrl(e.target.value)} className="input-style w-full" />
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">Crear Proveedor</Button>
            </div>
        </form>
    );
};

export const InsumoForm: React.FC<{
    onSubmit: (insumo: Omit<Insumo, 'id'>) => void;
    initialData?: Insumo | null;
    proveedores: Proveedor[];
    onAddNewProveedor: () => void;
    newlyCreatedProveedorId?: string | null;
}> = ({ onSubmit, initialData, proveedores, onAddNewProveedor, newlyCreatedProveedorId }) => {
    const [nombre, setNombre] = useState(initialData?.nombre || '');
    const [proveedorId, setProveedorId] = useState(initialData?.proveedorId || (proveedores[0]?.id || ''));
    const [costo, setCosto] = useState(initialData?.costo || 0);
    const [cantidadMedida, setCantidadMedida] = useState(initialData?.cantidadMedida || 1);
    const [unidadMedida, setUnidadMedida] = useState(initialData?.unidadMedida || 'pza');

    useEffect(() => {
        if (newlyCreatedProveedorId) {
            setProveedorId(newlyCreatedProveedorId);
        }
    }, [newlyCreatedProveedorId]);
    
    useEffect(() => {
       // Ensure a provider is selected if the list is not empty and none is chosen
       if (!proveedorId && proveedores.length > 0) {
           setProveedorId(proveedores[0].id);
       }
    }, [proveedores, proveedorId]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ nombre, proveedorId, costo, cantidadMedida, unidadMedida });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Insumo</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className="mt-1 block w-full input-style" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Proveedor</label>
                <div className="flex items-center gap-2 mt-1">
                    <select value={proveedorId} onChange={e => setProveedorId(e.target.value)} required className="block w-full input-style">
                        {proveedores.length === 0 && <option disabled>Crea un proveedor primero</option>}
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <Button type="button" variant="secondary" onClick={onAddNewProveedor} className="!p-2">
                        <PlusIcon className="w-5 h-5"/>
                    </Button>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Costo</label>
                    <input type="number" value={costo} onChange={e => setCosto(parseFloat(e.target.value))} required min="0" step="0.01" className="mt-1 block w-full input-style" placeholder="$0.00"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Medida de Compra</label>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="number" value={cantidadMedida} onChange={e => setCantidadMedida(parseFloat(e.target.value))} required min="0.001" step="any" className="block w-1/2 input-style" />
                        <select value={unidadMedida} onChange={e => setUnidadMedida(e.target.value)} required className="block w-1/2 input-style">
                            <option value="pza">pza</option>
                            <option value="unidad">unidad</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="ml">ml</option>
                        </select>
                    </div>
                </div>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Ejemplo: Costo ${costo || '50'} por una medida de {cantidadMedida || '1'} {unidadMedida || 'kg'}.</p>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={!proveedorId}>{initialData ? 'Actualizar' : 'Crear'} Insumo</Button>
            </div>
        </form>
    );
};

interface InsumosViewProps {
    insumos: Insumo[];
    setInsumos: React.Dispatch<React.SetStateAction<Insumo[]>>;
    proveedores: Proveedor[];
    setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
}

const InsumosView: React.FC<InsumosViewProps> = ({ insumos, setInsumos, proveedores, setProveedores }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewProveedorModalOpen, setIsNewProveedorModalOpen] = useState(false);
    const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
    const [groupBy, setGroupBy] = useState<GroupBy>('proveedor');
    const [newlyCreatedProveedorId, setNewlyCreatedProveedorId] = useState<string | null>(null);

    const proveedoresMap = useMemo(() => new Map(proveedores.map(p => [p.id, p])), [proveedores]);

    const handleAddInsumo = (insumoData: Omit<Insumo, 'id'>) => {
        const newInsumo: Insumo = { id: crypto.randomUUID(), ...insumoData };
        setInsumos(prev => [...prev, newInsumo]);
        setIsModalOpen(false);
    };

    const handleEditInsumo = (insumoData: Omit<Insumo, 'id'>) => {
        if (!editingInsumo) return;
        setInsumos(prev => prev.map(i => i.id === editingInsumo.id ? { ...i, ...insumoData } : i));
        setEditingInsumo(null);
        setIsModalOpen(false);
    };

    const handleDeleteInsumo = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este insumo?')) {
            setInsumos(prev => prev.filter(i => i.id !== id));
        }
    };
    
    const handleAddProveedor = (proveedorData: Omit<Proveedor, 'id'>) => {
        const newProveedor: Proveedor = { id: crypto.randomUUID(), ...proveedorData };
        setProveedores(prev => [...prev, newProveedor]);
        setNewlyCreatedProveedorId(newProveedor.id);
        setIsNewProveedorModalOpen(false);
    };

    const openEditModal = (insumo: Insumo) => {
        setEditingInsumo(insumo);
        setIsModalOpen(true);
    };
    
    const openAddModal = () => {
        setEditingInsumo(null);
        setNewlyCreatedProveedorId(null);
        setIsModalOpen(true);
    }

    const groupedInsumos = useMemo(() => {
        return insumos.reduce((acc, insumo) => {
            const key = groupBy === 'nombre' 
                ? insumo.nombre.toLowerCase().split(' ')[0] 
                : (proveedoresMap.get(insumo.proveedorId)?.nombre || 'Sin Proveedor');
            if (!acc[key]) acc[key] = [];
            acc[key].push(insumo);
            return acc;
        }, {} as Record<string, Insumo[]>);
    }, [insumos, groupBy, proveedoresMap]);

    return (
        <div className="animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gestión de Insumos</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
                    <div className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                        <span className="text-sm font-medium px-2 text-slate-600 dark:text-slate-300">Agrupar por:</span>
                        <button onClick={() => setGroupBy('proveedor')} className={`px-3 py-1 text-sm rounded-md ${groupBy === 'proveedor' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>Proveedor</button>
                        <button onClick={() => setGroupBy('nombre')} className={`px-3 py-1 text-sm rounded-md ${groupBy === 'nombre' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>Insumo</button>
                    </div>
                    <Button onClick={openAddModal}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nuevo Insumo
                    </Button>
                </div>
            </div>

            {insumos.length === 0 ? (
                 <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No hay insumos todavía</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">¡Añade tu primer insumo para empezar a crear bocadillos!</p>
                    <div className="mt-6">
                        <Button onClick={openAddModal}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Añadir Insumo
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.keys(groupedInsumos).sort((a, b) => a.localeCompare(b)).map(group => (
                        <div key={group}>
                            <h3 className="text-lg font-semibold mb-2 text-sky-700 dark:text-sky-400 capitalize border-b-2 border-sky-200 dark:border-sky-800 pb-1">{group}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {groupedInsumos[group].map(insumo => (
                                    <div key={insumo.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col justify-between animate-slide-in-up">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{insumo.nombre}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{proveedoresMap.get(insumo.proveedorId)?.nombre || 'N/A'}</p>
                                            <p className="text-xl font-semibold text-green-600 dark:text-green-400 mt-2">${insumo.costo.toFixed(2)} / {insumo.cantidadMedida} {insumo.unidadMedida}</p>
                                        </div>
                                        <div className="flex justify-end space-x-2 mt-4">
                                            <button onClick={() => openEditModal(insumo)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteInsumo(insumo.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}>
                <InsumoForm 
                    onSubmit={editingInsumo ? handleEditInsumo : handleAddInsumo} 
                    initialData={editingInsumo}
                    proveedores={proveedores}
                    onAddNewProveedor={() => setIsNewProveedorModalOpen(true)}
                    newlyCreatedProveedorId={newlyCreatedProveedorId}
                />
            </Modal>
            
            <Modal isOpen={isNewProveedorModalOpen} onClose={() => setIsNewProveedorModalOpen(false)} title="Nuevo Proveedor">
                <ProveedorQuickForm onSubmit={handleAddProveedor} />
            </Modal>
            <style>{`.input-style { @apply mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm; }`}</style>
        </div>
    );
};

export default InsumosView;