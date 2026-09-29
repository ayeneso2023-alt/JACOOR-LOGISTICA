import React, { useState, useEffect } from 'react';
import { PalletType, BoxDimensions, PALLET_CONFIGS, JACOOR_BOX_PRESETS, BoxPreset } from '../types/pallet';
import { Layers, Package, Scale, ArrowUpDown, ChevronDown, RefreshCw, AlertTriangle } from 'lucide-react';

interface SidebarControlsProps {
  palletType: PalletType;
  setPalletType: (type: PalletType) => void;
  box: BoxDimensions;
  setBox: React.Dispatch<React.SetStateAction<BoxDimensions>>;
  layers: number;
  setLayers: (layers: number) => void;
  onResetToDefaults: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  palletType,
  setPalletType,
  box,
  setBox,
  layers,
  setLayers,
  onResetToDefaults,
}) => {
  const currentPallet = PALLET_CONFIGS[palletType];

  // String buffers so the user can delete, backspace, and type freely without values snapping back
  const [lenStr, setLenStr] = useState(String(box.length));
  const [widStr, setWidStr] = useState(String(box.width));
  const [hgtStr, setHgtStr] = useState(String(box.height));
  const [wgtStr, setWgtStr] = useState(String(box.weight));

  // Synchronize when box changes externally (presets, reset, or inversion)
  useEffect(() => {
    setLenStr(String(box.length));
    setWidStr(String(box.width));
    setHgtStr(String(box.height));
    setWgtStr(String(box.weight));
  }, [box.length, box.width, box.height, box.weight]);

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLenStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setBox(prev => ({ ...prev, length: parsed }));
    }
  };

  const handleLengthBlur = () => {
    const parsed = parseFloat(lenStr);
    if (isNaN(parsed) || parsed <= 0) {
      setLenStr(String(box.length));
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWidStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setBox(prev => ({ ...prev, width: parsed }));
    }
  };

  const handleWidthBlur = () => {
    const parsed = parseFloat(widStr);
    if (isNaN(parsed) || parsed <= 0) {
      setWidStr(String(box.width));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHgtStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setBox(prev => ({ ...prev, height: parsed }));
    }
  };

  const handleHeightBlur = () => {
    const parsed = parseFloat(hgtStr);
    if (isNaN(parsed) || parsed <= 0) {
      setHgtStr(String(box.height));
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWgtStr(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setBox(prev => ({ ...prev, weight: parsed }));
    }
  };

  const handleWeightBlur = () => {
    const parsed = parseFloat(wgtStr);
    if (isNaN(parsed) || parsed <= 0) {
      setWgtStr(String(box.weight));
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const preset = JACOOR_BOX_PRESETS.find(p => p.id === selectedId);
    if (preset) {
      setBox({
        length: preset.length,
        width: preset.width,
        height: preset.height,
        weight: preset.weight,
      });
    }
  };

  const handleInvertBoxDimensions = () => {
    setBox(prev => ({
      ...prev,
      length: prev.width,
      width: prev.length,
    }));
  };

  const exceedsPallet = box.length > currentPallet.length || box.width > currentPallet.width;

  return (
    <aside className="w-full lg:w-80 bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#007A3D]" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight font-['Ubuntu']">
            Parámetros del Paletizado
          </h2>
        </div>
        <button
          onClick={onResetToDefaults}
          title="Restablecer valores predeterminados"
          className="text-xs text-slate-400 hover:text-[#007A3D] flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="text-[11px]">Por defecto</span>
        </button>
      </div>

      {/* 1. Selector de Tipo de Palet */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
          1. Tipo de Palet
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPalletType('europeo')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              palletType === 'europeo'
                ? 'border-[#007A3D] bg-emerald-50 text-[#007A3D] font-bold shadow-xs ring-1 ring-[#007A3D]'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="text-xs font-bold">Europeo</div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">1200×800 mm</div>
            <div className="text-[10px] text-emerald-800 mt-1 font-semibold">Tara: 25 kg</div>
          </button>

          <button
            type="button"
            onClick={() => setPalletType('americano')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              palletType === 'americano'
                ? 'border-[#007A3D] bg-emerald-50 text-[#007A3D] font-bold shadow-xs ring-1 ring-[#007A3D]'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="text-xs font-bold">Americano</div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">1200×1000 mm</div>
            <div className="text-[10px] text-amber-800 mt-1 font-semibold">Tara: 30 kg</div>
          </button>
        </div>
      </div>

      {/* 2. Presets de JACOOR LOGÍSTICA */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
          Cargar Caja Estándar
        </label>
        <div className="relative">
          <select
            onChange={handlePresetChange}
            defaultValue=""
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pr-8 text-slate-800 focus:ring-2 focus:ring-[#007A3D] focus:outline-hidden appearance-none cursor-pointer"
          >
            <option value="" disabled>Seleccionar caja JACOOR LOGÍSTICA...</option>
            {JACOOR_BOX_PRESETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.length}×{p.width}×{p.height} mm - {p.weight}kg)
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 3. Medidas de la Caja (mm) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Medidas de Caja (mm)
          </label>
          <button
            type="button"
            onClick={handleInvertBoxDimensions}
            title="Intercambiar Largo y Ancho"
            className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3" />
            Invertir L/A
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block mb-1">Largo (L)</span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={lenStr}
                onChange={handleLengthChange}
                onBlur={handleLengthBlur}
                placeholder="400"
                className="w-full font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-[#007A3D]"
              />
              <span className="absolute right-1.5 top-2 text-[10px] text-slate-400">mm</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium block mb-1">Ancho (W)</span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={widStr}
                onChange={handleWidthChange}
                onBlur={handleWidthBlur}
                placeholder="300"
                className="w-full font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-[#007A3D]"
              />
              <span className="absolute right-1.5 top-2 text-[10px] text-slate-400">mm</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium block mb-1">Alto (H)</span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={hgtStr}
                onChange={handleHeightChange}
                onBlur={handleHeightBlur}
                placeholder="180"
                className="w-full font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-[#007A3D]"
              />
              <span className="absolute right-1.5 top-2 text-[10px] text-slate-400">mm</span>
            </div>
          </div>
        </div>

        {exceedsPallet && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
            <span>La caja no puede sobresalir del palet ({currentPallet.length}×{currentPallet.width} mm).</span>
          </div>
        )}
      </div>

      {/* 4. Peso por caja */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
          3. Peso por Caja (kg)
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={wgtStr}
            onChange={handleWeightChange}
            onBlur={handleWeightBlur}
            placeholder="8.5"
            className="w-full font-mono text-xs font-bold bg-amber-50/40 border border-amber-300 rounded-lg px-3 py-2 text-amber-950 focus:ring-2 focus:ring-amber-500"
          />
          <span className="absolute right-3 top-2 text-xs font-semibold text-amber-700">
            kg / unidad
          </span>
        </div>
      </div>

      {/* 5. Cantidad de Capas / Alturas */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            4. Capas / Pisos:
          </label>
          <span className="font-mono text-sm font-extrabold text-[#007A3D] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {layers} {layers === 1 ? 'piso' : 'pisos'}
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={14}
          value={layers}
          onChange={e => setLayers(Number(e.target.value))}
          className="w-full accent-[#007A3D] cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
          <span>1 capa</span>
          <span>7 capas</span>
          <span>14 capas</span>
        </div>
      </div>

      {/* Quick summary box in sidebar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
        <div className="text-[11px] font-bold text-slate-700">Resumen Rápido Base:</div>
        <div className="flex justify-between text-slate-500">
          <span>Superficie Palet:</span>
          <span className="font-mono font-medium text-slate-700">
            {(currentPallet.length * currentPallet.width / 1000000).toFixed(2)} m²
          </span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Tara palet vacío:</span>
          <span className="font-mono font-semibold text-emerald-800">
            {currentPallet.tareWeight} kg
          </span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Base de madera:</span>
          <span className="font-mono font-medium text-slate-700">
            {currentPallet.baseHeight} mm
          </span>
        </div>
      </div>
    </aside>
  );
};

