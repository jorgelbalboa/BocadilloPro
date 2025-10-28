import React, { useState } from 'react';
import { Proveedor } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { LinkIcon } from './icons/LinkIcon';
import { MapPinIcon } from './icons/MapPinIcon';

const ProveedorForm: React.FC<{
    onSubmit: (proveedor: Omit<Proveedor, 'id'>) => void;
    initialData?: Proveedor | null;
}> = ({ onSubmit, initialData }) => {
    const [nombre, setNombre] = useState(initialData?.nombre || '');
    const [telefono, setTelefono] = useState(initialData?.telefono || '');
    const [correo, setCorreo] = useState(initialData?.correo || '');
    const [direccion, setDireccion] = useState(initialData?.direccion || '');
    const [paginaWeb, setPaginaWeb] = useState(initialData?.paginaWeb || '');
    const [fotoUrl, setFotoUrl] = useState(initialData?.fotoUrl || '');
    const [ubicacionUrl, setUbicacionUrl] = useState(initialData?.ubicacionUrl || '');

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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ubicación (Enlace de Maps)</label>
                <input type="url" value={ubicacionUrl} onChange={e => setUbicacionUrl(e.target.value)} className="input-style w-full" placeholder="https://maps.app.goo.gl/..."/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Página Web</label>
                <input type="url" value={paginaWeb} onChange={e => setPaginaWeb(e.target.value)} className="input-style w-full" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL de la Foto</label>
                <input type="url" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} className="input-style w-full" />
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit">{initialData ? 'Actualizar' : 'Crear'} Proveedor</Button>
            </div>
        </form>
    );
};

interface ProveedoresViewProps {
    proveedores: Proveedor[];
    setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
}

const ProveedoresView: React.FC<ProveedoresViewProps> = ({ proveedores, setProveedores }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

    const handleAdd = (data: Omit<Proveedor, 'id'>) => {
        const newProveedor: Proveedor = { id: crypto.randomUUID(), ...data };
        setProveedores(prev => [...prev, newProveedor].sort((a,b) => a.nombre.localeCompare(b.nombre)));
        setIsModalOpen(false);
    };

    const handleEdit = (data: Omit<Proveedor, 'id'>) => {
        if (!editingProveedor) return;
        setProveedores(prev => prev.map(p => p.id === editingProveedor.id ? { ...editingProveedor, ...data } : p));
        setEditingProveedor(null);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este proveedor? Esto podría afectar a los insumos asociados.')) {
            setProveedores(prev => prev.filter(p => p.id !== id));
        }
    };

    const openEditModal = (proveedor: Proveedor) => {
        setEditingProveedor(proveedor);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingProveedor(null);
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gestión de Proveedores</h2>
                <Button onClick={openAddModal}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            {proveedores.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No hay proveedores</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Añade tu primer proveedor para asociarlo a tus insumos.</p>
                    <div className="mt-6">
                        <Button onClick={openAddModal}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Añadir Proveedor
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proveedores.map(proveedor => (
                        <div key={proveedor.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col animate-slide-in-up overflow-hidden">
                            <div className="h-32 bg-slate-200 dark:bg-slate-700">
                                {proveedor.fotoUrl && <img src={proveedor.fotoUrl} alt={proveedor.nombre} className="w-full h-full object-cover" />}
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{proveedor.nombre}</h3>
                                <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400 flex-grow">
                                    {proveedor.direccion && <p className="text-xs">{proveedor.direccion}</p>}
                                </div>
                                 <div className="flex justify-between items-center mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                                    <div className="flex space-x-2">
                                        {proveedor.ubicacionUrl && <a href={proveedor.ubicacionUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400" title="Ver en Mapa"><MapPinIcon className="w-5 h-5" /></a>}
                                        {proveedor.telefono && <a href={`tel:${proveedor.telefono}`} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400" title="Llamar"><PhoneIcon className="w-5 h-5" /></a>}
                                        {proveedor.correo && <a href={`mailto:${proveedor.correo}`} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400" title="Enviar Correo"><EnvelopeIcon className="w-5 h-5" /></a>}
                                        {proveedor.paginaWeb && <a href={proveedor.paginaWeb} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400" title="Visitar Sitio Web"><LinkIcon className="w-5 h-5" /></a>}
                                    </div>
                                    <div className="flex space-x-1">
                                        <button onClick={() => openEditModal(proveedor)} className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(proveedor.id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
                <ProveedorForm
                    onSubmit={editingProveedor ? handleEdit : handleAdd}
                    initialData={editingProveedor}
                />
            </Modal>
             <style>{`.input-style { @apply mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm; }`}</style>
        </div>
    );
};

export default ProveedoresView;