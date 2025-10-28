export interface Insumo {
    id: string;
    nombre: string;
    proveedorId: string;
    costo: number;
    cantidadMedida: number; // The quantity the cost applies to, e.g., 1, 500
    unidadMedida: string;   // The unit for that quantity, e.g., kg, g, L, ml, pza
}

export interface Proveedor {
    id: string;
    nombre: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    paginaWeb?: string;
    fotoUrl?: string;
    ubicacionUrl?: string;
}

export interface BocadilloInsumo {
    insumoId: string;
    cantidad: number;
    unidad: string; // The unit for the quantity used in the recipe
}

export interface Bocadillo {
    id:string;
    nombre: string;
    precioVenta: number; // Price per unit
    insumos: BocadilloInsumo[];
    cantidadReceta: number; // How many items the recipe yields
    porcentajeGanancia: number; // Stored profit percentage
}

export interface PresupuestoItem {
    bocadilloId: string;
    cantidad: number;
    precioUnitario: number;
}

export interface Presupuesto {
    id: string;
    nombreCliente: string;
    items: PresupuestoItem[];
    total: number;
    fecha: string;
    fechaVencimiento?: string;
    detallesServicio?: string;
    isLocked: boolean;
}

export type View = 'insumos' | 'bocadillos' | 'presupuestos' | 'proveedores' | 'configuracion';

export type GroupBy = 'proveedor' | 'nombre';

export interface SnackIdea {
    snackName: string;
    ingredients: string[];
}

export interface EmpresaInfo {
    nombre: string;
    direccion: string;
    correo: string;
    telefono: string;
    detallesServicio: string;
    logoUrl?: string;
}