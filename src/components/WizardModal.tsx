import React, { useState, useEffect } from 'react';
import { PalletType, BoxDimensions, JACOOR_BOX_PRESETS, BoxPreset, PALLET_CONFIGS } from '../types/pallet';
import { Check, ChevronRight, ChevronLeft, Package, Sparkles, Scale, Layers, AlertCircle, X } from 'lucide-react';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPalletType: PalletType;
  initialBox: BoxDimensions;
  initialLayers: number;
  onComplete: (palletType: PalletType, box: BoxDimensions, layers: number) => void;
}

export const WizardModal: React.FC<WizardModalProps> = ({
  isOpen,
  onClose,
  initialPalletType,
  initialBox,
  initialLayers,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPallet, setSelectedPallet] = useState<PalletType>(initialPalletType);
  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({ ...initialBox });
  const [layersCount, setLayersCount] = useState<number>(initialLayers);

  // String buffers so user can delete and type without values freezing or resetting to 10
  const [lenStr, setLenStr] = useState(String(initialBox.length));
  const [widStr, setWidStr] = useState(String(initialBox.width));
  const [hgtStr, setHgtStr] = useState(String(initialBox.height));
  const [wgtStr, setWgtStr] = useState(String(initialBox.weight));

  useEffect(() => {
    setLenStr(String(boxDimensions.length));
    setWidStr(String(boxDimensions.width));
    setHgtStr(String(boxDimensions.height));
    setWgtStr(String(boxDimensions.weight));
  }, [boxDimensions.length, boxDimensions.width, boxDimensions.height, boxDimensions.weight]);

  if (!isOpen) return null;

  const currentPalletConfig = PALLET_CONFIGS[selectedPallet];

  // Quick estimation for live preview in step 3
  const estBoxesPerLayer = Math.max(
    1,
    Math.floor((currentPalletConfig.length * currentPalletConfig.width) / (boxDimensions.length * boxDimensions.width))
  );
  const estTotalBoxes = estBoxesPerLayer * layersCount;
  const estTotalWeight = Math.round(estTotalBoxes * boxDimensions.weight + currentPalletConfig.tareWeight);
  const estTotalHeight = layersCount * boxDimensions.height + currentPalletConfig.baseHeight;

  const handleApplyPreset = (preset: BoxPreset) => {
    setBoxDimensions({
      length: preset.length,
      width: preset.width,
      height: preset.height,
      weight: preset.weight,
    });
  };

  const handleFinish = () => {
    onComplete(selectedPallet, boxDimensions, layersCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#007A3D] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 flex items-center justify-center border border-emerald-500/40">
              <Package className="w-4 h-4 text-[#FFC700]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Ubuntu']">
                Nuevo Cálculo de Paletizado JACOOR LOGÍSTICA
              </h2>
              <p className="text-xs text-emerald-100">
                Asistente paso a paso para configurar palet, cajas y alturas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-emerald-50/60 border-b border-emerald-100 px-6 py-3 flex items-center justify-between text-xs font-semibold">
          <div
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 1 ? 'text-[#007A3D]' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 1
                  ? 'bg-[#007A3D] text-white'
                  : step > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step > 1 ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span>1. Tipo de Palet</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 2 ? 'text-[#007A3D]' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 2
                  ? 'bg-[#007A3D] text-white'
                  : step > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step > 2 ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span>2. Medidas y Peso Caja</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div
            onClick={() => setStep(3)}
            className={`flex items-center gap-2 cursor-pointer ${
              step === 3 ? 'text-[#007A3D]' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 3 ? 'bg-[#007A3D] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span>3. Capas y Alturas</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: Tipo de Palet */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Selecciona el tipo de palet a utilizar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Elige la base logística sobre la que se organizará el mosaico sin que ninguna caja sobresalga.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Palet Europeo */}
                <div
                  onClick={() => setSelectedPallet('europeo')}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPallet === 'europeo'
                      ? 'border-[#007A3D] bg-emerald-50/40 ring-2 ring-[#007A3D]/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {selectedPallet === 'europeo' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#007A3D] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#007A3D] bg-emerald-100/80 px-2 py-0.5 rounded">
                      Estándar JACOOR LOGÍSTICA
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 font-['Ubuntu']">
                    Palet Europeo (EPAL)
                  </h4>
                  <div className="text-2xl font-black text-[#007A3D] mt-1 font-mono">
                    1200 × 800 <span className="text-xs font-semibold text-slate-500">mm</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Tara palet vacío:</span>
                      <strong className="text-slate-800 font-mono">25 kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Altura madera:</span>
                      <span className="font-mono">145 mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Superficie útil:</span>
                      <span className="font-mono">0,96 m²</span>
                    </div>
                  </div>
                </div>

                {/* Palet Americano */}
                <div
                  onClick={() => setSelectedPallet('americano')}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPallet === 'americano'
                      ? 'border-[#007A3D] bg-emerald-50/40 ring-2 ring-[#007A3D]/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {selectedPallet === 'americano' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#007A3D] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                      Universal / ISO
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 font-['Ubuntu']">
                    Palet Americano (Universal)
                  </h4>
                  <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
                    1200 × 1000 <span className="text-xs font-semibold text-slate-500">mm</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Tara palet vacío:</span>
                      <strong className="text-slate-800 font-mono">30 kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Altura madera:</span>
                      <span className="font-mono">150 mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Superficie útil:</span>
                      <span className="font-mono">1,20 m²</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Medidas y Peso de la Caja */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Medidas y Peso de una Caja
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Indica las medidas en milímetros (mm) y el peso neto en kilogramos (kg).
                  </p>
                </div>
              </div>

              {/* Presets dropdown/chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Cajas frecuentes en la red JACOOR LOGÍSTICA:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {JACOOR_BOX_PRESETS.slice(0, 4).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="text-xs px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 transition-colors cursor-pointer"
                    >
                      {p.name.split('(')[0]} ({p.length}×{p.width} mm)
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Largo (L)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={lenStr}
                      onChange={e => {
                        const v = e.target.value;
                        setLenStr(v);
                        const n = parseFloat(v);
                        if (!isNaN(n) && n > 0) {
                          setBoxDimensions(prev => ({ ...prev, length: n }));
                        }
                      }}
                      onBlur={() => {
                        const n = parseFloat(lenStr);
                        if (isNaN(n) || n <= 0) setLenStr(String(boxDimensions.length));
                      }}
                      placeholder="400"
                      className="w-full font-mono text-base font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-2 focus:ring-[#007A3D] focus:outline-hidden"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-medium text-slate-400">
                      mm
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Ancho (W)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={widStr}
                      onChange={e => {
                        const v = e.target.value;
                        setWidStr(v);
                        const n = parseFloat(v);
                        if (!isNaN(n) && n > 0) {
                          setBoxDimensions(prev => ({ ...prev, width: n }));
                        }
                      }}
                      onBlur={() => {
                        const n = parseFloat(widStr);
                        if (isNaN(n) || n <= 0) setWidStr(String(boxDimensions.width));
                      }}
                      placeholder="300"
                      className="w-full font-mono text-base font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-2 focus:ring-[#007A3D] focus:outline-hidden"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-medium text-slate-400">
                      mm
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Alto (H)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hgtStr}
                      onChange={e => {
                        const v = e.target.value;
                        setHgtStr(v);
                        const n = parseFloat(v);
                        if (!isNaN(n) && n > 0) {
                          setBoxDimensions(prev => ({ ...prev, height: n }));
                        }
                      }}
                      onBlur={() => {
                        const n = parseFloat(hgtStr);
                        if (isNaN(n) || n <= 0) setHgtStr(String(boxDimensions.height));
                      }}
                      placeholder="180"
                      className="w-full font-mono text-base font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-2 focus:ring-[#007A3D] focus:outline-hidden"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-medium text-slate-400">
                      mm
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Peso por caja
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={wgtStr}
                      onChange={e => {
                        const v = e.target.value;
                        setWgtStr(v);
                        const n = parseFloat(v);
                        if (!isNaN(n) && n > 0) {
                          setBoxDimensions(prev => ({ ...prev, weight: n }));
                        }
                      }}
                      onBlur={() => {
                        const n = parseFloat(wgtStr);
                        if (isNaN(n) || n <= 0) setWgtStr(String(boxDimensions.weight));
                      }}
                      placeholder="8.5"
                      className="w-full font-mono text-base font-bold bg-white border border-amber-300 rounded px-2.5 py-1.5 text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-medium text-amber-600">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Overhang check hint */}
              {(boxDimensions.length > currentPalletConfig.length ||
                boxDimensions.width > currentPalletConfig.width) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atención:</strong> Las dimensiones de la caja ({boxDimensions.length}×{boxDimensions.width} mm) exceden el perímetro del palet seleccionado ({currentPalletConfig.length}×{currentPalletConfig.width} mm).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Capas / Alturas del Palet */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Cantidad de Capas / Alturas del Palet
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define cuántos pisos de cajas se apilarán en vertical para calcular la altura y peso total.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    Número de alturas (pisos de cajas):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLayersCount(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-xl font-extrabold text-[#007A3D] w-12 text-center">
                      {layersCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLayersCount(prev => Math.min(16, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={1}
                  max={14}
                  value={layersCount}
                  onChange={e => setLayersCount(Number(e.target.value))}
                  className="w-full accent-[#007A3D] cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>1 piso</span>
                  <span>5 pisos</span>
                  <span>10 pisos</span>
                  <span>14 pisos</span>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Base del palet ({currentPalletConfig.name}):</span>
                  <span className="font-mono font-medium">{currentPalletConfig.baseHeight} mm ({currentPalletConfig.tareWeight} kg tara)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Altura total de cajas ({layersCount} capas × {boxDimensions.height} mm):</span>
                  <span className="font-mono font-medium">{layersCount * boxDimensions.height} mm</span>
                </div>
                <div className="border-t border-emerald-200/80 pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#007A3D]">Altura Total Estimada del Palet:</span>
                  <span className="font-mono text-lg font-extrabold text-[#007A3D]">
                    {estTotalHeight} mm <span className="text-xs font-normal text-slate-500">({(estTotalHeight / 1000).toFixed(2)} m)</span>
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs pt-1 border-t border-emerald-100">
                  <span className="text-slate-600">Peso Total Estimado (Cajas + Palet {currentPalletConfig.tareWeight}kg):</span>
                  <span className="font-mono font-bold text-slate-800">
                    ~{estTotalWeight} kg
                  </span>
                </div>

                {estTotalHeight > 1950 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Aviso: La altura supera 1.950 mm. Verifica el gálibo del camión o remolque de reparto.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev: 1 | 2 | 3) => (prev - 1) as 1 | 2 | 3)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev: 1 | 2 | 3) => (prev + 1) as 1 | 2 | 3)}
              className="px-5 py-2 text-xs font-bold text-white bg-[#007A3D] hover:bg-[#006331] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 text-xs font-extrabold text-[#005c2e] bg-[#FFC700] hover:bg-[#ffd100] active:scale-95 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Calcular Mosaicos del Palet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

