import React from 'react';
import { Presupuesto, Bocadillo, EmpresaInfo } from '../types';

interface PrintablePresupuestoProps {
    presupuesto: Presupuesto;
    bocadillosMap: Map<string, Bocadillo>;
    empresaInfo: EmpresaInfo | null;
}

export const PrintablePresupuesto = React.forwardRef<HTMLDivElement, PrintablePresupuestoProps>(({ presupuesto, bocadillosMap, empresaInfo }, ref) => {
    return (
        <div ref={ref} className="p-8 font-sans bg-white text-black">
            <header className="flex justify-between items-start pb-4 border-b">
                <div className="flex items-start gap-4">
                    {empresaInfo?.logoUrl && (
                        <img src={empresaInfo.logoUrl} alt="Logo de la empresa" className="h-16 w-auto max-w-xs object-contain" />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-sky-700">{empresaInfo?.nombre || 'BocadilloPro'}</h1>
                        {empresaInfo?.direccion && <p className="text-slate-600 mt-1">{empresaInfo.direccion}</p>}
                        <div className="mt-1">
                            {empresaInfo?.correo && <p className="text-slate-600">{empresaInfo.correo}</p>}
                            {empresaInfo?.telefono && <p className="text-slate-600">{empresaInfo.telefono}</p>}
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xl font-semibold">Presupuesto</p>
                    <p><strong>Fecha:</strong> {new Date(presupuesto.fecha).toLocaleDateString()}</p>
                    {presupuesto.fechaVencimiento && <p><strong>Válido hasta:</strong> {new Date(presupuesto.fechaVencimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</p>}
                    <p><strong>ID:</strong> {presupuesto.id.substring(0, 8)}</p>
                </div>
            </header>

            <section className="my-6">
                <h2 className="text-xl font-semibold">Cliente: {presupuesto.nombreCliente}</h2>
            </section>

            <section>
                <table className="w-full text-left">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-2">Producto</th>
                            <th className="p-2 text-center">Cantidad</th>
                            <th className="p-2 text-right">Precio Unitario</th>
                            <th className="p-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {presupuesto.items.map(item => {
                            const bocadillo = bocadillosMap.get(item.bocadilloId);
                            return (
                                <tr key={item.bocadilloId} className="border-b">
                                    <td className="p-2">{bocadillo?.nombre || 'Producto no encontrado'}</td>
                                    <td className="p-2 text-center">{item.cantidad}</td>
                                    <td className="p-2 text-right">${item.precioUnitario.toFixed(2)}</td>
                                    <td className="p-2 text-right">${(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            <section className="mt-6 flex justify-end">
                <div className="w-1/3">
                    <div className="flex justify-between font-bold text-xl bg-slate-100 p-2 rounded">
                        <span>Total:</span>
                        <span>${presupuesto.total.toFixed(2)}</span>
                    </div>
                </div>
            </section>

            <footer className="mt-12 pt-4 border-t text-xs text-slate-500">
                 {presupuesto.detallesServicio && (
                    <div className="text-left mb-6 whitespace-pre-wrap">
                        <h4 className="font-semibold text-sm mb-1 text-slate-700">Detalles y Especificaciones:</h4>
                        <p>{presupuesto.detallesServicio}</p>
                    </div>
                )}
                <div className="text-center">
                    <p>Gracias por su preferencia.</p>
                    <p>Presupuesto generado con {empresaInfo?.nombre || 'BocadilloPro'}</p>
                </div>
            </footer>
        </div>
    );
});

PrintablePresupuesto.displayName = 'PrintablePresupuesto';