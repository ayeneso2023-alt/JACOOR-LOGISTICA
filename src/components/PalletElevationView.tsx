import React from 'react';
import { MosaicPattern, PalletDimensions, BoxDimensions } from '../types/pallet';
import { Layers, ArrowRight, AlertTriangle, CheckCircle, Truck } from 'lucide-react';

interface PalletElevationViewProps {
  mosaic: MosaicPattern;
  pallet: PalletDimensions;
  box: BoxDimensions;
  layersCount: number;
}

export const PalletElevationView: React.FC<PalletElevationViewProps> = ({
  mosaic,
  pallet,
  box,
  layersCount,
}) => {
  const BH = box.height;
  const palH = pallet.baseHeight;
  const totalHeightMm = layersCount * BH + palH;

  // Max truck standard heights
  const truckLimitMm = 2000;
  const isOverTrailer = totalHeightMm > truckLimitMm;

  // Scaled height for drawing
  const viewH = Math.max(500, layersCount * 45 + 160);
  const viewW = 760;

  // Bottom baseline Y coordinate
  const groundY = viewH - 50;

  // Visual scale factor (pixels per mm)
  const pxPerMm = (viewH - 120) / Math.max(totalHeightMm, 1800);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#007A3D]" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Alzado Técnico y Desglose de Pisos
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            Altura Total: <strong className="text-[#007A3D] font-mono text-sm">{totalHeightMm} mm</strong> ({(totalHeightMm / 1000).toFixed(2)} m)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left: Graphic Technical Elevation Diagram */}
        <div className="lg:col-span-7 bg-[#F8FAF9] p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
          <svg
            viewBox={`0 0 ${viewW} ${viewH}`}
            className="w-full max-w-[580px] drop-shadow-xs select-none"
          >
            <defs>
              <marker
                id="elevArrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
              </marker>
            </defs>

            {/* Ground Line */}
            <line
              x1="40"
              y1={groundY}
              x2={viewW - 140}
              y2={groundY}
              stroke="#94A3B8"
              strokeWidth="2"
            />
            <text x="50" y={groundY + 20} fontSize="12" fill="#64748B" fontWeight="600">
              Suelo del Almacén / Nivel 0.00 mm
            </text>

            {/* 1. Base Palet Madera */}
            {(() => {
              const palTopY = groundY - palH * pxPerMm;
              const palWidthPx = 360;
              const palLeftX = 140;

              return (
                <g>
                  {/* Wood pallet rectangle */}
                  <rect
                    x={palLeftX}
                    y={palTopY}
                    width={palWidthPx}
                    height={palH * pxPerMm}
                    fill="#D7C49E"
                    stroke="#8C7350"
                    strokeWidth="2"
                    rx="2"
                  />
                  {/* Pallet blocks */}
                  <rect
                    x={palLeftX + 30}
                    y={palTopY + 8}
                    width="60"
                    height={palH * pxPerMm - 14}
                    fill="#5A472E"
                    rx="2"
                  />
                  <rect
                    x={palLeftX + palWidthPx / 2 - 30}
                    y={palTopY + 8}
                    width="60"
                    height={palH * pxPerMm - 14}
                    fill="#5A472E"
                    rx="2"
                  />
                  <rect
                    x={palLeftX + palWidthPx - 90}
                    y={palTopY + 8}
                    width="60"
                    height={palH * pxPerMm - 14}
                    fill="#5A472E"
                    rx="2"
                  />
                  <text
                    x={palLeftX + palWidthPx / 2}
                    y={palTopY + (palH * pxPerMm) / 2 + 4}
                    fontSize="13"
                    fontWeight="bold"
                    fill="#3D2E1D"
                    textAnchor="middle"
                  >
                    Base {pallet.name} ({palH} mm)
                  </text>
                </g>
              );
            })()}

            {/* 2. Floors / Pisos stacked */}
            {(() => {
              const palWidthPx = 360;
              const palLeftX = 140;
              const nodes: React.ReactNode[] = [];

              let accumulatedH = palH;

              for (let i = 1; i <= layersCount; i++) {
                const floorBottomY = groundY - accumulatedH * pxPerMm;
                const floorTopY = groundY - (accumulatedH + BH) * pxPerMm;
                const floorHeightPx = BH * pxPerMm;
                const isEven = i % 2 === 0;

                nodes.push(
                  <g key={`floor-diagram-${i}`}>
                    {/* Floor Layer Box */}
                    <rect
                      x={palLeftX}
                      y={floorTopY}
                      width={palWidthPx}
                      height={floorHeightPx}
                      fill={isEven ? '#E8F5E9' : '#C8E6C9'}
                      stroke={isEven ? '#388E3C' : '#2E7D32'}
                      strokeWidth="1.5"
                    />

                    {/* Floor Label inside */}
                    <text
                      x={palLeftX + 20}
                      y={floorTopY + floorHeightPx / 2 + 4}
                      fontSize="12"
                      fontWeight="bold"
                      fill="#1B5E20"
                    >
                      PISO #{i} {isEven ? '(Capa B - Capitulada)' : '(Capa A)'}
                    </text>

                    <text
                      x={palLeftX + palWidthPx - 20}
                      y={floorTopY + floorHeightPx / 2 + 4}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="end"
                      fill="#2E7D32"
                    >
                      {BH} mm (Acum: {accumulatedH + BH} mm)
                    </text>

                    {/* Left floor marker tick */}
                    <line
                      x1={palLeftX - 10}
                      y1={floorTopY}
                      x2={palLeftX}
                      y2={floorTopY}
                      stroke="#64748B"
                      strokeWidth="1"
                    />
                    <text
                      x={palLeftX - 15}
                      y={floorTopY + 4}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                      fill="#475569"
                    >
                      +{accumulatedH + BH} mm
                    </text>
                  </g>
                );

                accumulatedH += BH;
              }

              return nodes;
            })()}

            {/* 3. Overall Height Dimension Line on Right */}
            {(() => {
              const palWidthPx = 360;
              const palLeftX = 140;
              const cotaX = palLeftX + palWidthPx + 50;
              const topY = groundY - totalHeightMm * pxPerMm;

              return (
                <g>
                  {/* Extension lines */}
                  <line
                    x1={palLeftX + palWidthPx}
                    y1={groundY}
                    x2={cotaX + 25}
                    y2={groundY}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  <line
                    x1={palLeftX + palWidthPx}
                    y1={topY}
                    x2={cotaX + 25}
                    y2={topY}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />

                  {/* Vertical dimension line with arrows */}
                  <line
                    x1={cotaX}
                    y1={groundY}
                    x2={cotaX}
                    y2={topY}
                    stroke="#007A3D"
                    strokeWidth="3"
                    markerStart="url(#elevArrow)"
                    markerEnd="url(#elevArrow)"
                  />

                  {/* Dimension text */}
                  <text
                    x={cotaX + 15}
                    y={(groundY + topY) / 2 - 10}
                    fontSize="16"
                    fontWeight="800"
                    fontFamily="monospace"
                    fill="#007A3D"
                  >
                    {totalHeightMm} mm
                  </text>
                  <text
                    x={cotaX + 15}
                    y={(groundY + topY) / 2 + 10}
                    fontSize="12"
                    fontWeight="bold"
                    fill="#64748B"
                  >
                    ({(totalHeightMm / 1000).toFixed(2)} metros)
                  </text>
                  <text
                    x={cotaX + 15}
                    y={(groundY + topY) / 2 + 26}
                    fontSize="10"
                    fill="#94A3B8"
                  >
                    ALTURA TOTAL
                  </text>
                </g>
              );
            })()}

            {/* Standard Truck Ceiling limit line if within viewport */}
            {truckLimitMm * pxPerMm <= groundY - 20 && (
              <g>
                <line
                  x1="100"
                  y1={groundY - truckLimitMm * pxPerMm}
                  x2={viewW - 100}
                  y2={groundY - truckLimitMm * pxPerMm}
                  stroke="#E11D48"
                  strokeWidth="1.5"
                  strokeDasharray="6,4"
                />
                <text
                  x={viewW - 110}
                  y={groundY - truckLimitMm * pxPerMm - 6}
                  fontSize="11"
                  fontWeight="bold"
                  fill="#E11D48"
                  textAnchor="end"
                >
                  Límite estándar remolque: 2.000 mm
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right: Technical Breakdown Table */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Desglose Técnico de Alturas
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-600">Base Palet Madera ({pallet.type === 'europeo' ? 'Europalet' : 'Americano'}):</span>
                <span className="font-mono font-bold text-slate-800">+{palH} mm</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-600">Altura de cada caja:</span>
                <span className="font-mono font-bold text-slate-800">{BH} mm</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-600">Cantidad de pisos:</span>
                <span className="font-mono font-bold text-[#007A3D]">{layersCount} alturas</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-600">Altura neta de mercancía:</span>
                <span className="font-mono font-bold text-slate-800">{layersCount * BH} mm</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <strong className="text-sm text-[#007A3D]">ALTURA TOTAL PALET:</strong>
                <span className="font-mono text-base font-extrabold text-[#007A3D]">
                  {totalHeightMm} mm
                </span>
              </div>
            </div>
          </div>

          {/* Table of floors */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 flex justify-between">
              <span>Piso / Nivel</span>
              <span>Esquema</span>
              <span>Cajas Acum.</span>
              <span>Cota Superior</span>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {Array.from({ length: layersCount }).map((_, idx) => {
                const floorNum = idx + 1;
                const isEven = floorNum % 2 === 0;
                const topElevation = palH + floorNum * BH;

                return (
                  <div
                    key={`row-floor-${floorNum}`}
                    className="px-3 py-2 flex items-center justify-between hover:bg-emerald-50/40 transition-colors"
                  >
                    <span className="font-bold text-slate-800">
                      Piso #{floorNum}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isEven ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    }`}>
                      {isEven ? 'Capa B (Capitulada)' : 'Capa A (Base)'}
                    </span>
                    <span className="font-mono text-slate-600">
                      {floorNum * mosaic.boxesPerLayer} u.
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {topElevation} mm
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vehicle status card */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
            isOverTrailer
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
          }`}>
            <Truck className="w-5 h-5 shrink-0 mt-0.5 text-[#007A3D]" />
            <div>
              <strong className="block font-bold">
                {isOverTrailer
                  ? 'Aviso de Altura para Transporte'
                  : 'Apto para Flota de Camiones Estándar'}
              </strong>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                {isOverTrailer
                  ? `La altura total de ${totalHeightMm} mm excede los 2.000 mm recomendados para semirremolques de carga seca o frigorífica estándar. Considera reducir 1 piso para facilitar el estibado.`
                  : `La altura total de ${totalHeightMm} mm (${(totalHeightMm / 1000).toFixed(2)} m) cumple con las especificaciones de gálibo para muelles y camiones de distribución JACOOR LOGÍSTICA.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
