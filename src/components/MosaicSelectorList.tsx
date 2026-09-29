import React from 'react';
import { MosaicPattern, PalletDimensions } from '../types/pallet';
import { ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';

interface MosaicSelectorListProps {
  mosaics: MosaicPattern[];
  selectedMosaic: MosaicPattern;
  onSelectMosaic: (mosaic: MosaicPattern) => void;
  pallet: PalletDimensions;
}

export const MosaicSelectorList: React.FC<MosaicSelectorListProps> = ({
  mosaics,
  selectedMosaic,
  onSelectMosaic,
  pallet,
}) => {
  if (mosaics.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          No se encontraron mosaicos válidos para estas dimensiones
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          La caja es mayor que la superficie del {pallet.name} ({pallet.length}×{pallet.width} mm). Por favor reduce el tamaño de la caja o selecciona un palet más grande.
        </p>
      </div>
    );
  }

  const maxBoxes = mosaics[0].boxesPerLayer;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Posibles Mosaicos Calculados:
          </span>
          <span className="text-xs font-bold text-[#007A3D] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {mosaics.length} variantes
          </span>
        </div>
        <span className="text-xs text-slate-500">
          Máximo por capa: <strong className="text-slate-800 font-mono">{maxBoxes} cajas</strong> (sin salientes / 0 mm overhang)
        </span>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {mosaics.map((mosaic) => {
          const isSelected = selectedMosaic.id === mosaic.id;
          const isMaxCapacity = mosaic.boxesPerLayer === maxBoxes;

          return (
            <div
              key={mosaic.id}
              onClick={() => onSelectMosaic(mosaic)}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative bg-white flex flex-col justify-between ${
                isSelected
                  ? 'border-[#007A3D] bg-emerald-50/20 ring-2 ring-[#007A3D]/20 shadow-sm'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#007A3D] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3" />
                </div>
              )}

              {/* Header with name and optimal badge */}
              <div>
                <div className="flex items-center gap-1.5 mb-1 pr-6">
                  {isMaxCapacity && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#FFC700] text-[#005c2e] px-1.5 py-0.5 rounded">
                      Máx Cajas
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {mosaic.name.replace('⭐ ', '')}
                  </span>
                </div>

                {/* Mini SVG Preview */}
                <div className="my-2 bg-[#F6F8F7] p-2 rounded-lg border border-slate-100 flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${pallet.length} ${pallet.width}`}
                    className="w-full h-24 stroke-slate-400 stroke-1"
                  >
                    {/* Pallet wood border */}
                    <rect
                      x="0"
                      y="0"
                      width={pallet.length}
                      height={pallet.width}
                      fill="#e2d6b5"
                      stroke="#8c7750"
                      strokeWidth="6"
                    />
                    {/* Boxes */}
                    {mosaic.layerA.map((b) => (
                      <g key={b.id}>
                        <rect
                          x={b.x + 3}
                          y={b.y + 3}
                          width={b.w - 6}
                          height={b.h - 6}
                          fill={b.rotated ? '#C5E1A5' : '#81C784'}
                          stroke="#2E7D32"
                          strokeWidth="3"
                          rx="4"
                        />
                        <text
                          x={b.x + b.w / 2}
                          y={b.y + b.h / 2}
                          fontSize={b.h > 150 ? 55 : 40}
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#1B5E20"
                        >
                          {b.id}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Metrics footer */}
              <div className="mt-1 pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cajas por capa:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {mosaic.boxesPerLayer} u.
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Aprovechamiento:</span>
                  <span className="font-mono font-semibold text-[#007A3D]">
                    {mosaic.areaEfficiency}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Capitulado (Traba):</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      mosaic.stabilityScore >= 70
                        ? 'text-emerald-700'
                        : mosaic.stabilityScore >= 40
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {mosaic.interlockStability}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-slate-100">
                  <span className="text-slate-400">Entrada cartesiana:</span>
                  <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    {mosaic.cartesianGroupsA.length} lotes / {mosaic.chimneyHolesA.length > 0 ? 'Chimenea central' : 'Perímetro sellado'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
