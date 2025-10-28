import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Presupuesto, Bocadillo, Insumo, PresupuestoItem, Proveedor, BocadilloInsumo, EmpresaInfo } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PrintIcon } from './icons/PrintIcon';
import { DuplicateIcon } from './icons/DuplicateIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { LockOpenIcon } from './icons/LockOpenIcon';
import { PrintablePresupuesto } from './PrintablePresupuesto';
import { BocadilloForm } from './BocadillosView';
import { InsumoForm, ProveedorQuickForm } from './InsumosView';

// --- Unit Conversion Logic (Copied from BocadillosView for reuse) ---
const CONVERSIONS: Record<string, number> = {
    'kg': 1000, 'g': 1, 'mg': 0.001, 'L': 1000, 'ml': 1,
};
const UNIT_TYPES: Record<string, string> = {
    'kg': 'weight', 'g': 'weight', 'mg': 'weight', 'L': 'volume', 'ml': 'volume',
};
const convertUnits = (value: number, fromUnit: string, toUnit: string): number | null => {
    if (fromUnit === toUnit) return value;
    const fromType = UNIT_TYPES[fromUnit];
    const toType = UNIT_TYPES[toUnit];
    if (!fromType || fromType !== toType) return null;
    const fromBase = CONVERSIONS[fromUnit];
    const toBase = CONVERSIONS[toUnit];
    return (value * fromBase) / toBase;
};
// --- End Unit Conversion Logic ---


const PresupuestoForm: React.FC<{
    onSubmit: (presupuesto: Omit<Presupuesto, 'id' | 'isLocked' | 'fecha'>) => void;
    initialData?: Presupuesto | null;
    bocadillos: Bocadillo[];
    insumosMap: Map<string, Insumo>;
    onAddNewBocadillo: () => void;
    empresaInfo: EmpresaInfo | null;
}> = ({ onSubmit, initialData, bocadillos, insumosMap, onAddNewBocadillo, empresaInfo }) => {
    const [nombreCliente, setNombreCliente] = useState(initialData?.nombreCliente || '');
    const [fechaVencimiento, setFechaVencimiento] = useState(initialData?.fechaVencimiento || '');
    const [detallesServicio, setDetallesServicio] = useState(initialData?.detallesServicio || empresaInfo?.detallesServicio || '');
    const [bocadilloToAdd, setBocadilloToAdd] = useState('');

    const bocadillosMap = useMemo(() => new Map(bocadillos.map(b => [b.id, b])), [bocadillos]);

    const calculateCostoUnitario = (bocadillo: Bocadillo): number => {
        const costoTotalReceta = bocadillo.insumos.reduce((acc, item) => {
            const insumo = insumosMap.get(item.insumoId);
            if (!insumo || insumo.cantidadMedida === 0) return acc;
            const costPerBaseUnit = insumo.costo / insumo.cantidadMedida;
            const convertedQuantity = convertUnits(item.cantidad, item.unidad, insumo.unidadMedida);
            if (convertedQuantity === null) return acc;
            return acc + (convertedQuantity * costPerBaseUnit);
        }, 0);
        return bocadillo.cantidadReceta > 0 ? costoTotalReceta / bocadillo.cantidadReceta : 0;
    };

    const getProfitPercentage = (precioVenta: number, costo: number): number => {
        if (costo <= 0) return 0;
        return ((precioVenta / costo) - 1) * 100;
    };

    const [formItems, setFormItems] = useState(() => {
        return (initialData?.items || []).map(item => {
            const bocadillo = bocadillos.find(b => b.id === item.bocadilloId);
            if (!bocadillo) return null;

            const costoUnitario = calculateCostoUnitario(bocadillo);
            const profitPercentage = getProfitPercentage(item.precioUnitario, costoUnitario);

            return {
                bocadilloId: item.bocadilloId,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                cantidadStr: item.cantidad.toString(),
                profitStr: profitPercentage.toFixed(2)
            };
        }).filter(Boolean) as (PresupuestoItem & { cantidadStr: string, profitStr: string })[];
    });

    const availableBocadillos = useMemo(() => {
        const selectedIds = new Set(formItems.map(i => i.bocadilloId));
        return bocadillos.filter(b => !selectedIds.has(b.id)).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [bocadillos, formItems]);

    const handleAddItemToList = () => {
        if (!bocadilloToAdd) return;
        const bocadillo = bocadillosMap.get(bocadilloToAdd);
        if (bocadillo) {
            setFormItems(prev => [...prev, {
                bocadilloId: bocadillo.id,
                cantidad: 1,
                precioUnitario: bocadillo.precioVenta,
                cantidadStr: '1',
                profitStr: bocadillo.porcentajeGanancia.toFixed(2)
            }]);
            setBocadilloToAdd('');
        }
    };

    const handleRemoveItem = (bocadilloId: string) => {
        setFormItems(prev => prev.filter(i => i.bocadilloId !== bocadilloId));
    };
    
    const handleItemChange = (bocadilloId: string, field: 'cantidadStr' | 'profitStr', value: string) => {
        setFormItems(prevItems => prevItems.map(item => {
            if (item.bocadilloId !== bocadilloId) {
                return item;
            }

            const updatedItem = { ...item, [field]: value };

            if (field === 'cantidadStr') {
                const newCantidad = parseInt(value, 10);
                updatedItem.cantidad = isNaN(newCantidad) ? 0 : (newCantidad >= 0 ? newCantidad : 0);
            } else if (field === 'profitStr') {
                const bocadillo = bocadillosMap.get(bocadilloId);
                if (bocadillo) {
                    const newProfit = parseFloat(value);
                    const costoUnitario = calculateCostoUnitario(bocadillo);
                    if (!isNaN(newProfit)) {
                        updatedItem.precioUnitario = costoUnitario * (1 + newProfit / 100);
                    }
                }
            }
            return updatedItem;
        }));
    };

    const costoTotalPresupuesto = useMemo(() => {
        return formItems.reduce((acc, item) => {
            const bocadillo = bocadillosMap.get(item.bocadilloId);
            if (!bocadillo) return acc;
            const costoUnitario = calculateCostoUnitario(bocadillo);
            return acc + (costoUnitario * item.cantidad);
        }, 0);
    }, [formItems, bocadillosMap]);

    const precioVentaTotal = useMemo(() => {
        return formItems.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
    }, [formItems]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItems = formItems
            .map(({ bocadilloId, cantidad, precioUnitario }) => ({
                bocadilloId,
                cantidad,
                precioUnitario
            }))
            .filter(item => item.cantidad > 0);

        onSubmit({
            nombreCliente,
            items: finalItems,
            total: precioVentaTotal,
            fechaVencimiento,
            detallesServicio,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="label-style">Nombre del Cliente</label>
                    <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} required className="input-style w-full" />
                </div>
                 <div>
                    <label className="label-style">Fecha de Vencimiento</label>
                    <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} className="input-style w-full" />
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="label-style">Bocadillos</h4>
                     <Button type="button" variant="secondary" onClick={onAddNewBocadillo} className="!p-2" title="Añadir nuevo bocadillo">
                        <PlusIcon className="w-5 h-5"/>
                    </Button>
                </div>
                <div className="space-y-3">
                    {formItems.length === 0 && (
                         <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-700/50 rounded-md">Añade bocadillos a la cotización.</p>
                    )}
                    {formItems.map(item => {
                        const bocadillo = bocadillosMap.get(item.bocadilloId);
                        if (!bocadillo) return null;

                        return (
                            <div key={item.bocadilloId} className="grid grid-cols-12 gap-2 items-center">
                                <span className="text-sm truncate col-span-11 sm:col-span-4">{bocadillo.nombre}</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={item.cantidadStr}
                                    placeholder="Cant."
                                    onChange={e => handleItemChange(item.bocadilloId, 'cantidadStr', e.target.value)}
                                    className="input-style w-full col-span-5 sm:col-span-3"
                                />
                                <div className="relative col-span-6 sm:col-span-4">
                                    <input
                                        type="number"
                                        step="any"
                                        value={item.profitStr}
                                        placeholder="Ganancia %"
                                        onChange={e => handleItemChange(item.bocadilloId, 'profitStr', e.target.value)}
                                        className="input-style w-full pl-2 pr-6"
                                    />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-sm">%</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveItem(item.bocadilloId)} className="p-2 text-slate-400 hover:text-red-500 col-span-1 justify-self-end">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="label-style mb-1">Añadir Bocadillo del Catálogo</label>
                    <div className="flex items-center gap-2">
                        <select value={bocadilloToAdd} onChange={e => setBocadilloToAdd(e.target.value)} className="input-style flex-grow">
                            <option value="" disabled>Selecciona un bocadillo...</option>
                            {availableBocadillos.map(b => (
                                <option key={b.id} value={b.id}>{b.nombre}</option>
                            ))}
                        </select>
                        <Button type="button" variant="secondary" onClick={handleAddItemToList} disabled={!bocadilloToAdd || availableBocadillos.length === 0}>
                            Añadir
                        </Button>
                    </div>
                </div>
            </div>
             <div>
                <label htmlFor="detallesServicio" className="label-style">Detalles y Especificaciones del Servicio</label>
                <textarea id="detallesServicio" name="detallesServicio" value={detallesServicio} onChange={e => setDetallesServicio(e.target.value)} rows={3} className="input-style w-full" placeholder="Ej: Validez de la cotización, métodos de pago, etc."></textarea>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                <div>
                    <label className="label-style">Costo</label>
                    <p className="font-semibold text-xl">${costoTotalPresupuesto.toFixed(2)}</p>
                </div>
                 <div className="text-right">
                    <label className="label-style">Precio de Venta</label>
                    <p className="font-bold text-2xl text-sky-600 dark:text-sky-400">${precioVentaTotal.toFixed(2)}</p>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={formItems.length === 0}>{initialData ? 'Actualizar' : 'Crear'} Presupuesto</Button>
            </div>
        </form>
    );
};

interface PresupuestosViewProps {
    presupuestos: Presupuesto[];
    setPresupuestos: React.Dispatch<React.SetStateAction<Presupuesto[]>>;
    bocadillos: Bocadillo[];
    setBocadillos: React.Dispatch<React.SetStateAction<Bocadillo[]>>;
    insumos: Insumo[];
    setInsumos: React.Dispatch<React.SetStateAction<Insumo[]>>;
    proveedores: Proveedor[];
    setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
    empresaInfo: EmpresaInfo | null;
}

const PresupuestosView: React.FC<PresupuestosViewProps> = ({ presupuestos, setPresupuestos, bocadillos, setBocadillos, insumos, setInsumos, proveedores, setProveedores, empresaInfo }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);
    
    // State for nested modals
    const [isNewBocadilloModalOpen, setIsNewBocadilloModalOpen] = useState(false);
    const [isNewInsumoModalOpen, setIsNewInsumoModalOpen] = useState(false);
    const [isNewProveedorModalOpen, setIsNewProveedorModalOpen] = useState(false);
    const [newlyCreatedProveedorId, setNewlyCreatedProveedorId] = useState<string | null>(null);
    
    const [presupuestoToPrint, setPresupuestoToPrint] = useState<Presupuesto | null>(null);
    const printableComponentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Automatically update unlocked quotes when snack prices change
        setPresupuestos(prevPresupuestos => {
            const newBocadillosMap = new Map(bocadillos.map(b => [b.id, b]));
            let hasAnyChanged = false;

            const updatedPresupuestos = prevPresupuestos.map(p => {
                if (p.isLocked) return p;

                let currentPresupuestoHasChanged = false;

                const newItems = p.items.map(item => {
                    const bocadillo = newBocadillosMap.get(item.bocadilloId);
                    if (!bocadillo) return item;
                    
                    if (item.precioUnitario !== bocadillo.precioVenta) {
                        currentPresupuestoHasChanged = true;
                        return { ...item, precioUnitario: bocadillo.precioVenta };
                    }
                    return item;
                });
                
                const newTotal = newItems.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
                
                if (Math.abs(p.total - newTotal) > 0.001) {
                    currentPresupuestoHasChanged = true;
                }

                if (currentPresupuestoHasChanged) {
                  hasAnyChanged = true;
                  return { ...p, items: newItems, total: newTotal };
                }
                return p;
            });

            if (hasAnyChanged) {
                return updatedPresupuestos;
            }
            return prevPresupuestos;
        });
    }, [bocadillos, setPresupuestos]);

    useEffect(() => {
        if (!presupuestoToPrint || !printableComponentRef.current) return;

        const node = printableComponentRef.current;
        const newWindow = window.open('', '', 'height=800,width=800');
        if (newWindow) {
            newWindow.document.write('<html><head><title>Presupuesto</title>');
             Array.from(document.styleSheets).forEach(styleSheet => {
                 try {
                    if (styleSheet.cssRules) {
                        const css = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
                        const style = newWindow.document.createElement('style');
                        style.appendChild(newWindow.document.createTextNode(css));
                        newWindow.document.head.appendChild(style);
                    }
                } catch (e) {
                     console.warn('Could not copy styles for printing', e);
                }
            });
            newWindow.document.write('</head><body>');
            newWindow.document.write(node.innerHTML);
            newWindow.document.write('</body></html>');
            newWindow.document.close();
            newWindow.focus();
            newWindow.print();
            newWindow.close();
        }
        setPresupuestoToPrint(null); // Reset state after printing
    }, [presupuestoToPrint]);

    const triggerPrint = (presupuesto: Presupuesto) => {
        setPresupuestoToPrint(presupuesto);
    };

    const bocadillosMap = useMemo(() => new Map(bocadillos.map(b => [b.id, b])), [bocadillos]);
    const insumosMap = useMemo(() => new Map(insumos.map(i => [i.id, i])), [insumos]);

    const handleAdd = (data: Omit<Presupuesto, 'id' | 'isLocked' | 'fecha'>) => {
        const newPresupuesto: Presupuesto = { 
            id: crypto.randomUUID(), 
            ...data, 
            fecha: new Date().toISOString(),
            isLocked: true // New quotes are locked by default
        };
        setPresupuestos(prev => [newPresupuesto, ...prev].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
        setIsModalOpen(false);
    };

    const handleEdit = (data: Omit<Presupuesto, 'id' | 'isLocked' | 'fecha'>) => {
        if (!editingPresupuesto) return;
        setPresupuestos(prev => prev.map(p => p.id === editingPresupuesto.id ? { ...editingPresupuesto, ...data, fecha: p.fecha } : p));
        setEditingPresupuesto(null);
        setIsModalOpen(false);
    };

    const handleAddBocadillo = (data: Omit<Bocadillo, 'id'>) => {
        const newBocadillo: Bocadillo = { id: crypto.randomUUID(), ...data };
        setBocadillos(prev => [...prev, newBocadillo]);
        setIsNewBocadilloModalOpen(false);
    };

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
    
    const handleDuplicate = (presupuesto: Presupuesto) => {
         const newPresupuesto: Presupuesto = {
            ...presupuesto,
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            nombreCliente: `${presupuesto.nombreCliente} (Copia)`,
            isLocked: true, // Duplicates are locked by default
         };
         setPresupuestos(prev => [newPresupuesto, ...prev]);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este presupuesto?')) {
            setPresupuestos(prev => prev.filter(p => p.id !== id));
        }
    };
    
    const handleToggleLock = (id: string) => {
        setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, isLocked: !p.isLocked } : p))
    };

    const openEditModal = (presupuesto: Presupuesto) => {
        setEditingPresupuesto(presupuesto);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingPresupuesto(null);
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gestión de Presupuestos</h2>
                <Button onClick={openAddModal}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Presupuesto
                </Button>
            </div>
            
            {presupuestos.length === 0 ? (
                 <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No hay presupuestos guardados</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Crea tu primer presupuesto para un cliente.</p>
                    <div className="mt-6">
                        <Button onClick={openAddModal}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Crear Presupuesto
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {presupuestos.map(presupuesto => (
                        <div key={presupuesto.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 animate-slide-in-up">
                            <div className="flex flex-col sm:flex-row justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{presupuesto.nombreCliente}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3">
                                        <span>Creado: {new Date(presupuesto.fecha).toLocaleDateString()}</span>
                                        {presupuesto.fechaVencimiento && (
                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                Vence: {new Date(presupuesto.fechaVencimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-2 sm:mt-0">${presupuesto.total.toFixed(2)}</p>
                            </div>
                            <div className="flex justify-end items-center space-x-1 mt-4">
                                <button onClick={() => handleToggleLock(presupuesto.id)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors" title={presupuesto.isLocked ? 'Desbloquear para actualizar precios automáticamente' : 'Bloquear para fijar precios actuales'}>
                                   {presupuesto.isLocked ? <LockClosedIcon className="w-5 h-5" /> : <LockOpenIcon className="w-5 h-5" />}
                                </button>
                               <button onClick={() => triggerPrint(presupuesto)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors" title="Imprimir"><PrintIcon className="w-5 h-5" /></button>
                                <button onClick={() => handleDuplicate(presupuesto)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors" title="Duplicar"><DuplicateIcon className="w-5 h-5" /></button>
                                <button onClick={() => openEditModal(presupuesto)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                                <button onClick={() => handleDelete(presupuesto.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}>
                <PresupuestoForm 
                    onSubmit={editingPresupuesto ? handleEdit : handleAdd}
                    initialData={editingPresupuesto}
                    bocadillos={bocadillos}
                    insumosMap={insumosMap}
                    onAddNewBocadillo={() => setIsNewBocadilloModalOpen(true)}
                    empresaInfo={empresaInfo}
                />
            </Modal>

            <Modal isOpen={isNewBocadilloModalOpen} onClose={() => setIsNewBocadilloModalOpen(false)} title="Nuevo Bocadillo">
                <BocadilloForm
                    onSubmit={handleAddBocadillo}
                    insumos={insumos}
                    onAddNewInsumo={() => setIsNewInsumoModalOpen(true)}
                />
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

            <div style={{ display: 'none' }}>
                 {presupuestoToPrint && (
                     <PrintablePresupuesto
                        ref={printableComponentRef}
                        presupuesto={presupuestoToPrint}
                        bocadillosMap={bocadillosMap}
                        empresaInfo={empresaInfo}
                     />
                 )}
            </div>
            <style>{`.input-style { @apply mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm; } .label-style { @apply block text-sm font-medium text-slate-700 dark:text-slate-300; }`}</style>
        </div>
    );
};


export default PresupuestosView;