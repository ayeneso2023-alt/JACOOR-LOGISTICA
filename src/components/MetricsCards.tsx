import React from 'react';
import { PalletCalculationResult } from '../types/pallet';
import { Package, Layers, Scale, Maximize2, ShieldCheck, AlertCircle, Compass, Activity, ArrowDownUp, CheckCircle2 } from 'lucide-react';
import { StabilityMetricTooltip } from './StabilityMetricTooltip';

interface MetricsCardsProps {
  metrics: PalletCalculationResult;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  const {
    pallet,
    box,
    layersCount,
    selectedMosaic,
    totalBoxes,
    netWeightKg,
    tareWeightKg,
    totalWeightKg,
    boxHeightTotalMm,
    totalHeightMm,
    stability,
    isOverheightWarning,
    isOverweightWarning,
  } = metrics;

  // Determine badge colors based on stability score
  const isHighStability = stability.stabilityIndexScore >= 75;
  const isModerateStability = stability.stabilityIndexScore >= 50 && stability.stabilityIndexScore < 75;
  const isLowStability = stability.stabilityIndexScore < 50;

  return (
    <div className="space-y-4">
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cajas Totales y Cajas/Capa */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Cajas Palet
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#007A3D] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalBoxes}
            </span>
            <span className="text-xs font-semibold text-slate-500">cajas</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Por capa:</span>
            <strong className="text-[#007A3D] font-mono">
              {selectedMosaic.boxesPerLayer} cajas / piso
            </strong>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Capas apiladas:</span>
            <span className="font-mono">{layersCount} alturas</span>
          </div>
        </div>

        {/* 2. Altura Total del Palet */}
        <div className={`bg-white rounded-xl border p-4 shadow-xs transition-colors ${
          isOverheightWarning ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200/90 hover:border-emerald-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Altura Total Palet
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#007A3D] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#007A3D] font-mono tracking-tight">
              {totalHeightMm}
            </span>
            <span className="text-xs font-semibold text-slate-500">mm</span>
            <span className="text-xs font-mono text-slate-400">
              ({(totalHeightMm / 1000).toFixed(2)} m)
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Cajas ({layersCount}×{box.height}mm):</span>
            <span className="font-mono">{boxHeightTotalMm} mm</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Base palet madera:</span>
            <span className="font-mono">+{pallet.baseHeight} mm</span>
          </div>
        </div>

        {/* 3. Peso Total del Palet (Cajas + Palet vacío) */}
        <div className={`bg-white rounded-xl border p-4 shadow-xs transition-colors ${
          isOverweightWarning ? 'border-red-300 bg-red-50/20' : 'border-slate-200/90 hover:border-emerald-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Peso Total Palet
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalWeightKg.toLocaleString('es-ES')}
            </span>
            <span className="text-xs font-semibold text-slate-500">kg</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Carga neta ({totalBoxes}×{box.weight}kg):</span>
            <span className="font-mono">{netWeightKg.toLocaleString('es-ES')} kg</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Tara palet vacío ({pallet.name.includes('Europeo') ? 'Europalet' : 'Americano'}):</span>
            <span className="font-mono font-bold text-amber-700">+{tareWeightKg} kg</span>
          </div>
        </div>

        {/* 4. Aprovechamiento de Superficie & Traba */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ocupación & Traba
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#007A3D] flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {selectedMosaic.areaEfficiency}%
            </span>
            <span className="text-xs font-semibold text-slate-500">superficie</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Estabilidad Capitulado:</span>
            <span className={`font-semibold flex items-center gap-1 ${
              selectedMosaic.stabilityScore >= 60 ? 'text-[#007A3D]' : 'text-amber-700'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 inline" />
              {selectedMosaic.interlockStability}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Holgura sobrante:</span>
            <span className="font-mono">
              {selectedMosaic.remainingMarginX} mm (L) × {selectedMosaic.remainingMarginY} mm (A)
            </span>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Stability Index and Center of Gravity (CdG) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#007A3D] flex items-center justify-center border border-emerald-200/80">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-['Ubuntu']">
                  Índice de Estabilidad Física & Centro de Gravedad (CdG)
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isHighStability
                    ? 'bg-emerald-100 text-[#007A3D]'
                    : isModerateStability
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {stability.stabilityLevel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Evaluación cinemática basada en altura acumulada, masa del palet, ángulo de vuelco estático y traba entre capas
              </p>
            </div>
          </div>

          {/* Composite score pill */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg">
            <span className="text-xs text-slate-500 font-medium">Índice Global:</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-extrabold font-mono ${
                isHighStability ? 'text-[#007A3D]' : isModerateStability ? 'text-amber-600' : 'text-red-600'
              }`}>
                {stability.stabilityIndexScore}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* 4 Detail Metrics of Stability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* 1. Centro de Gravedad (CdG) */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Altura CdG (Z_cdg):</span>
              <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              {stability.centerOfGravityHeightMm} <span className="text-xs font-normal text-slate-500">mm</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Posición relativa:</span>
              <span className="font-mono font-semibold text-[#007A3D]">{stability.centerOfGravityRatio}% de la altura</span>
            </div>
            {/* Visual bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#007A3D] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, stability.centerOfGravityRatio)}%` }}
              />
            </div>
          </div>

          {/* 2. Ángulo Crítico de Vuelco */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Ángulo Vuelco (θ_crit):</span>
                <StabilityMetricTooltip
                  type="angulo_vuelco"
                  currentValue={`${stability.staticTippingAngleDeg}° (${stability.staticTippingAngleDeg >= 28 ? 'Bueno' : stability.staticTippingAngleDeg >= 22 ? 'Medio' : 'Malo'})`}
                />
              </div>
              <Compass className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              {stability.staticTippingAngleDeg}° <span className="text-xs font-normal text-slate-500">estático</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Límite seguro:</span>
              <span className="font-mono font-semibold text-slate-700">&ge; 28.0°</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stability.staticTippingAngleDeg >= 28 ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (stability.staticTippingAngleDeg / 40) * 100)}%` }}
              />
            </div>
          </div>

          {/* 3. Relación de Esbeltez (λ) */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Relación Esbeltez (λ):</span>
                <StabilityMetricTooltip
                  type="esbeltez"
                  currentValue={`λ = ${stability.slendernessRatio} (${stability.slendernessRatio <= 1.4 ? 'Bueno / Compacto' : stability.slendernessRatio <= 1.85 ? 'Medio' : 'Malo / Torre'})`}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400">H / Ancho min</span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">
              {stability.slendernessRatio} <span className="text-xs font-normal text-slate-500">: 1</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Clasificación:</span>
              <span className={`font-semibold ${
                stability.slendernessRatio <= 1.4 ? 'text-emerald-700' : stability.slendernessRatio <= 1.9 ? 'text-amber-700' : 'text-red-700'
              }`}>
                {stability.slendernessRatio <= 1.4 ? 'Compacto' : stability.slendernessRatio <= 1.9 ? 'Medio' : 'Muy Esbelto'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stability.slendernessRatio <= 1.4 ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (stability.slendernessRatio / 2.5) * 100)}%` }}
              />
            </div>
          </div>

          {/* 4. Solidez del Capitulado */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Traba Capitulado:</span>
                <StabilityMetricTooltip
                  type="traba_capitulado"
                  currentValue={`${selectedMosaic.stabilityScore}% (${selectedMosaic.stabilityScore >= 60 ? 'Bueno' : selectedMosaic.stabilityScore >= 30 ? 'Medio' : 'Malo'})`}
                />
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-extrabold text-[#007A3D] font-mono">
              {selectedMosaic.stabilityScore}% <span className="text-xs font-normal text-slate-500">solape</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Efecto columna:</span>
              <span className="font-semibold text-emerald-800">
                {selectedMosaic.stabilityScore >= 50 ? 'Bloqueado (Seguro)' : 'Parcial'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#007A3D] h-full rounded-full transition-all"
                style={{ width: `${selectedMosaic.stabilityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Operational Recommendation Callout */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-[#007A3D] shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold block">Protocolo de Enfardado y Estiba Recomendado:</strong>
            <p className="mt-0.5 leading-relaxed">{stability.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

