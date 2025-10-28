
import React from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import InsumosView from './components/InsumosView';
import BocadillosView from './components/BocadillosView';
import PresupuestosView from './components/PresupuestosView';
import ProveedoresView from './components/ProveedoresView';
import ConfiguracionView from './components/ConfiguracionView';
import { Insumo, Proveedor, Bocadillo, Presupuesto, View, EmpresaInfo, BocadilloInsumo } from './types';

// --- Unit Conversion Logic (for migrations) ---
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

// --- START SEED DATA ---
// This data will be loaded only if the local storage is empty.
const SEED_PROVEEDORES: Proveedor[] = [
    { id: 'prov1', nombre: 'Distribuidora La Canasta', telefono: '55-1234-5678', correo: 'ventas@lacanasta.com', ubicacionUrl: 'https://maps.app.goo.gl/K9g3t7Z1X6Y2Q8A8A' },
    { id: 'prov2', nombre: 'Harinas del Centro', telefono: '55-8765-4321', correo: 'contacto@harinascentro.com' },
    { id: 'prov3', nombre: 'Mercado Fresco Local', telefono: '55-5555-5555', correo: 'pedidos@mercadolocal.com', ubicacionUrl: 'https://maps.app.goo.gl/E5n3c7Y8X2Z9W1B1A' },
];

const SEED_INSUMOS: Insumo[] = [
    { id: 'ins1', nombre: 'Harina de Trigo', proveedorId: 'prov2', costo: 20, cantidadMedida: 1, unidadMedida: 'kg' },
    { id: 'ins2', nombre: 'Azúcar Blanca', proveedorId: 'prov1', costo: 25, cantidadMedida: 1, unidadMedida: 'kg' },
    { id: 'ins3', nombre: 'Chispas de Chocolate', proveedorId: 'prov1', costo: 80, cantidadMedida: 500, unidadMedida: 'g' },
    { id: 'ins4', nombre: 'Mantequilla sin Sal', proveedorId: 'prov1', costo: 40, cantidadMedida: 250, unidadMedida: 'g' },
    { id: 'ins5', nombre: 'Huevo', proveedorId: 'prov3', costo: 3, cantidadMedida: 1, unidadMedida: 'pza' },
    { id: 'ins6', nombre: 'Fresas Frescas', proveedorId: 'prov3', costo: 60, cantidadMedida: 1, unidadMedida: 'kg' },
    { id: 'ins7', nombre: 'Leche Entera', proveedorId: 'prov1', costo: 25, cantidadMedida: 1, unidadMedida: 'L' },
    { id: 'ins8', nombre: 'Polvo para Hornear', proveedorId: 'prov2', costo: 15, cantidadMedida: 100, unidadMedida: 'g' },
];

const SEED_BOCADILLOS: Bocadillo[] = [
    {
        id: 'boc1',
        nombre: 'Galletas de Chispas de Chocolate',
        precioVenta: 5.70,
        insumos: [
            { insumoId: 'ins1', cantidad: 250, unidad: 'g' },
            { insumoId: 'ins2', cantidad: 150, unidad: 'g' },
            { insumoId: 'ins4', cantidad: 100, unidad: 'g' },
            { insumoId: 'ins5', cantidad: 2, unidad: 'pza' },
            { insumoId: 'ins3', cantidad: 150, unidad: 'g' },
        ],
        cantidadReceta: 24,
        porcentajeGanancia: 150,
    },
    {
        id: 'boc2',
        nombre: 'Pastelitos de Fresa',
        precioVenta: 13.90,
        insumos: [
            { insumoId: 'ins1', cantidad: 100, unidad: 'g' },
            { insumoId: 'ins2', cantidad: 80, unidad: 'g' },
            { insumoId: 'ins4', cantidad: 50, unidad: 'g' },
            { insumoId: 'ins5', cantidad: 1, unidad: 'pza' },
            { insumoId: 'ins7', cantidad: 120, unidad: 'ml' },
            { insumoId: 'ins6', cantidad: 150, unidad: 'g' },
            { insumoId: 'ins8', cantidad: 5, unidad: 'g' },
        ],
        cantidadReceta: 6,
        porcentajeGanancia: 200,
    },
];

const getFutureDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const SEED_PRESUPUESTOS: Presupuesto[] = [
    {
        id: 'pre1',
        nombreCliente: 'Fiesta Infantil Pérez',
        items: [
            { bocadilloId: 'boc1', cantidad: 48, precioUnitario: 5.70 },
            { bocadilloId: 'boc2', cantidad: 12, precioUnitario: 13.90 },
        ],
        total: 440.40,
        fecha: new Date().toISOString(),
        fechaVencimiento: getFutureDate(15),
        detallesServicio: 'Se requiere un anticipo del 50% para confirmar el pedido. Liquidación contra entrega.',
        isLocked: true,
    },
    {
        id: 'pre2',
        nombreCliente: 'Reunión Corporativa Acme',
        items: [
            { bocadilloId: 'boc1', cantidad: 100, precioUnitario: 5.70 },
        ],
        total: 570.00,
        fecha: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        fechaVencimiento: getFutureDate(7),
        isLocked: false,
    },
];
// --- END SEED DATA ---


function App() {
  const [insumos, setInsumos] = useLocalStorage<Insumo[]>('insumos', SEED_INSUMOS);
  const [proveedores, setProveedores] = useLocalStorage<Proveedor[]>('proveedores', SEED_PROVEEDORES);
  const [bocadillos, setBocadillos] = useLocalStorage<Bocadillo[]>('bocadillos', SEED_BOCADILLOS);
  const [presupuestos, setPresupuestos] = useLocalStorage<Presupuesto[]>('presupuestos', SEED_PRESUPUESTOS);
  const [currentView, setCurrentView] = useLocalStorage<View>('currentView', 'presupuestos');
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('darkMode', false);
  const [empresaInfo, setEmpresaInfo] = useLocalStorage<EmpresaInfo | null>('empresaInfo', {
    nombre: 'BocadilloPro',
    direccion: 'Av. Siempre Viva 742',
    correo: 'contacto@bocadillopro.com',
    telefono: '55-1234-5678',
    detallesServicio: 'Gracias por su preferencia. Los precios están sujetos a cambios sin previo aviso.',
    logoUrl: ''
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    // One-time data migration for unit changes
    const migrationKey = 'data-migration-units-v1';
    if (!localStorage.getItem(migrationKey)) {
        try {
            const oldInsumos: any[] = JSON.parse(localStorage.getItem('insumos') || '[]');
            if (oldInsumos.length > 0 && oldInsumos[0].hasOwnProperty('unidad')) {
                const newInsumos = oldInsumos.map(insumo => {
                    const { unidad, ...rest } = insumo;
                    return {
                        ...rest,
                        cantidadMedida: 1,
                        unidadMedida: unidad,
                    };
                });
                setInsumos(newInsumos as Insumo[]);

                const oldBocadillos: any[] = JSON.parse(localStorage.getItem('bocadillos') || '[]');
                // FIX: Made the check for bocadillo insumos safer to prevent errors if `insumos` is empty.
                if (oldBocadillos.length > 0 && oldBocadillos[0].insumos?.length > 0 && !oldBocadillos[0].insumos[0].hasOwnProperty('unidad')) {
                     const insumosMap = new Map(newInsumos.map(i => [i.id, i]));
                     const newBocadillos = oldBocadillos.map(bocadillo => ({
                         ...bocadillo,
                         // FIX: Safely handle cases where bocadillo.insumos might be null or undefined during migration.
                         insumos: (bocadillo.insumos || []).map((bi: any) => {
                             const relatedInsumo = insumosMap.get(bi.insumoId);
                             return {
                                 ...bi,
                                 // Assume the old quantity was in the insumo's base unit
                                 unidad: relatedInsumo ? relatedInsumo.unidadMedida : 'pza'
                             };
                         })
                     }));
                     setBocadillos(newBocadillos as Bocadillo[]);
                }
                 localStorage.setItem(migrationKey, 'true');
            } else if (oldInsumos.length === 0 || !oldInsumos[0].hasOwnProperty('unidad')) {
                // No migration needed, but still set the key to avoid re-running
                localStorage.setItem(migrationKey, 'true');
            }
        } catch (error) {
            console.error("Failed to migrate data:", error);
            // If migration fails, still set the key to avoid re-running a failing migration.
            localStorage.setItem(migrationKey, 'true');
        }
    }
  }, [setInsumos, setBocadillos]);

  React.useEffect(() => {
    // One-time data migration for recipe yield
    const migrationKey = 'data-migration-recipe-yield-v1';
    if (localStorage.getItem(migrationKey)) return;

    try {
        const currentBocadillos: any[] = JSON.parse(localStorage.getItem('bocadillos') || '[]');
        if (currentBocadillos.length > 0 && !currentBocadillos[0].hasOwnProperty('cantidadReceta')) {
            const updatedBocadillos = currentBocadillos.map(bocadillo => ({
                ...bocadillo,
                cantidadReceta: 1,
            }));
            setBocadillos(updatedBocadillos as Bocadillo[]);
        }
    } catch (error) {
        console.error("Failed to migrate bocadillos for recipe yield:", error);
    } finally {
        localStorage.setItem(migrationKey, 'true');
    }
  }, [setBocadillos]);

  React.useEffect(() => {
    // One-time data migration for storing profit percentage in bocadillos
    const migrationKey = 'data-migration-profit-percentage-v1';
    if (localStorage.getItem(migrationKey)) return;

    try {
        const currentBocadillos: any[] = JSON.parse(localStorage.getItem('bocadillos') || '[]');
        const currentInsumos: Insumo[] = JSON.parse(localStorage.getItem('insumos') || '[]');
        
        if (currentBocadillos.length > 0 && currentBocadillos[0].hasOwnProperty('precioVenta') && !currentBocadillos[0].hasOwnProperty('porcentajeGanancia')) {
            const insumosMap = new Map(currentInsumos.map(i => [i.id, i]));
            
            const calculateCosto = (bocadilloInsumos: BocadilloInsumo[]): number => {
                return bocadilloInsumos.reduce((acc, item) => {
                    const insumo = insumosMap.get(item.insumoId);
                    if (!insumo || insumo.cantidadMedida === 0) return acc;
                    
                    const costPerBaseUnit = insumo.costo / insumo.cantidadMedida;
                    const convertedQuantity = convertUnits(item.cantidad, item.unidad, insumo.unidadMedida);

                    if (convertedQuantity === null) return acc;

                    return acc + (convertedQuantity * costPerBaseUnit);
                }, 0);
            };

            const updatedBocadillos = currentBocadillos.map(bocadillo => {
                const costoTotal = calculateCosto(bocadillo.insumos);
                const costoPorUnidad = bocadillo.cantidadReceta > 0 ? costoTotal / bocadillo.cantidadReceta : 0;
                let porcentajeGanancia = 0;
                if (costoPorUnidad > 0) {
                    porcentajeGanancia = ((bocadillo.precioVenta / costoPorUnidad) - 1) * 100;
                }
                return {
                    ...bocadillo,
                    porcentajeGanancia: isFinite(porcentajeGanancia) ? porcentajeGanancia : 0,
                };
            });
            setBocadillos(updatedBocadillos as Bocadillo[]);
        }
    } catch (error) {
        console.error("Failed to migrate bocadillos for profit percentage:", error);
    } finally {
        localStorage.setItem(migrationKey, 'true');
    }
  }, [setBocadillos]);

  React.useEffect(() => {
    // One-time data migration to add isLocked to Presupuestos
    const migrationKey = 'data-migration-presupuesto-locked-v1';
    if (localStorage.getItem(migrationKey)) return;

    try {
        const currentPresupuestos: any[] = JSON.parse(localStorage.getItem('presupuestos') || '[]');
        if (currentPresupuestos.length > 0 && !currentPresupuestos[0].hasOwnProperty('isLocked')) {
            const updatedPresupuestos = currentPresupuestos.map(p => ({
                ...p,
                isLocked: true, // Default all existing to locked
            }));
            setPresupuestos(updatedPresupuestos as Presupuesto[]);
        }
    } catch (error) {
        console.error("Failed to migrate presupuestos for isLocked:", error);
    } finally {
        localStorage.setItem(migrationKey, 'true');
    }
  }, [setPresupuestos]);

  React.useEffect(() => {
    // One-time data migration to add logoUrl to EmpresaInfo
    const migrationKey = 'data-migration-empresa-logo-v1';
    if (localStorage.getItem(migrationKey)) return;

    try {
        const currentInfo: any = JSON.parse(localStorage.getItem('empresaInfo') || 'null');
        if (currentInfo && !currentInfo.hasOwnProperty('logoUrl')) {
            const updatedInfo = {
                ...currentInfo,
                logoUrl: '',
            };
            setEmpresaInfo(updatedInfo as EmpresaInfo);
        }
    } catch (error) {
        console.error("Failed to migrate empresaInfo for logoUrl:", error);
    } finally {
        localStorage.setItem(migrationKey, 'true');
    }
  }, [setEmpresaInfo]);

  React.useEffect(() => {
    // One-time data migration to add ubicacionUrl to Proveedores
    const migrationKey = 'data-migration-proveedor-ubicacion-v1';
    if (localStorage.getItem(migrationKey)) return;

    try {
        const currentProveedores: any[] = JSON.parse(localStorage.getItem('proveedores') || '[]');
        if (currentProveedores.length > 0 && !currentProveedores[0].hasOwnProperty('ubicacionUrl')) {
            const updatedProveedores = currentProveedores.map(p => ({
                ...p,
                ubicacionUrl: '',
            }));
            setProveedores(updatedProveedores as Proveedor[]);
        }
    } catch (error) {
        console.error("Failed to migrate proveedores for ubicacionUrl:", error);
    } finally {
        localStorage.setItem(migrationKey, 'true');
    }
  }, [setProveedores]);


  const renderView = () => {
    switch (currentView) {
      case 'insumos':
        return <InsumosView insumos={insumos} setInsumos={setInsumos} proveedores={proveedores} setProveedores={setProveedores} />;
      case 'bocadillos':
        return <BocadillosView 
            bocadillos={bocadillos} 
            setBocadillos={setBocadillos} 
            insumos={insumos} 
            setInsumos={setInsumos}
            proveedores={proveedores}
            setProveedores={setProveedores}
        />;
      case 'presupuestos':
        return <PresupuestosView 
            presupuestos={presupuestos} 
            setPresupuestos={setPresupuestos} 
            bocadillos={bocadillos} 
            setBocadillos={setBocadillos}
            insumos={insumos}
            setInsumos={setInsumos}
            proveedores={proveedores}
            setProveedores={setProveedores}
            empresaInfo={empresaInfo}
        />;
      case 'proveedores':
        return <ProveedoresView proveedores={proveedores} setProveedores={setProveedores} />;
      case 'configuracion':
        return <ConfiguracionView empresaInfo={empresaInfo} setEmpresaInfo={setEmpresaInfo} />;
      default:
        return <InsumosView insumos={insumos} setInsumos={setInsumos} proveedores={proveedores} setProveedores={setProveedores} />;
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 font-sans">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
}

export default App;