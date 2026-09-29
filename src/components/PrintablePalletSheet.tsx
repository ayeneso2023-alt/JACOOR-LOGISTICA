import React, { useState } from 'react';
import { PalletCalculationResult, BoxPlacement } from '../types/pallet';
import { Printer, ArrowLeft, CheckSquare, Boxes, ShieldCheck, Download, Loader2, CheckCircle2, Compass, Activity, ArrowDownUp, Bot } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface PrintablePalletSheetProps {
  metrics: PalletCalculationResult;
  onBack: () => void;
}

export const PrintablePalletSheet: React.FC<PrintablePalletSheetProps> = ({
  metrics,
  onBack,
}) => {
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
  } = metrics;

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  // Toggle option requested by user: whether to include cartesian sequence in printable sheet / PDF
  const [includeCartesianSequence, setIncludeCartesianSequence] = useState<boolean>(true);

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Helper to extract front façade boxes (facing camera at y = PW)
  const getFrontFaçadeBoxes = (layer: BoxPlacement[]) => {
    const maxFar = Math.max(...layer.map(b => b.y + b.h));
    const front = layer.filter(b => Math.abs(b.y + b.h - maxFar) < 8).sort((a, b) => a.x - b.x);
    return front.length > 0 ? front : layer;
  };

  // Helper to extract side façade boxes (facing camera at x = 0)
  const getSideFaçadeBoxes = (layer: BoxPlacement[]) => {
    const minNear = Math.min(...layer.map(b => b.x));
    const side = layer.filter(b => Math.abs(b.x - minNear) < 8).sort((a, b) => a.y - b.y);
    return side.length > 0 ? side : layer;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const docElement = document.getElementById('pallet-sheet-document');
    if (!docElement) return;

    try {
      setIsGeneratingPdf(true);
      setDownloadSuccess(false);

      // Render the HTML element to a high-resolution canvas (scale: 2 for sharp text and SVGs)
      const canvas = await html2canvas(docElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: docElement.scrollWidth,
      });

      // A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const contentWidth = pageWidth - margin * 2; // 194 mm
      const totalPdfContentHeight = (canvas.height * contentWidth) / canvas.width;

      // Set PDF metadata
      pdf.setProperties({
        title: `Ficha de Carga - JACOOR LOGÍSTICA - ${pallet.name}`,
        subject: `Informe de Paletizado, Mosaicos, Estabilidad, Alzados y Pesos`,
        author: 'JACOOR LOGÍSTICA',
        keywords: 'paletizado, logistica, jacoor, estabilidad, mosaico, alzado',
        creator: 'JACOOR LOGÍSTICA Optimizador de Paletizado',
      });

      if (totalPdfContentHeight <= pageHeight - margin * 2) {
        // Fits on a single A4 page
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, totalPdfContentHeight, undefined, 'FAST');
      } else {
        // Multi-page automatic slicing
        const pageCanvasHeight = (canvas.width * (pageHeight - margin * 2)) / contentWidth;
        let remainingHeight = canvas.height;
        let positionY = 0;
        let pageIdx = 0;

        while (remainingHeight > 0) {
          if (pageIdx > 0) {
            pdf.addPage();
          }

          const sliceHeight = Math.min(pageCanvasHeight, remainingHeight);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const sliceCtx = sliceCanvas.getContext('2d');

          if (sliceCtx) {
            sliceCtx.drawImage(
              canvas,
              0,
              positionY,
              canvas.width,
              sliceHeight,
              0,
              0,
              canvas.width,
              sliceHeight
            );

            const sliceData = sliceCanvas.toDataURL('image/png');
            const slicePdfHeight = (sliceHeight * contentWidth) / canvas.width;
            pdf.addImage(sliceData, 'PNG', margin, margin, contentWidth, slicePdfHeight, undefined, 'FAST');
          }

          remainingHeight -= sliceHeight;
          positionY += sliceHeight;
          pageIdx++;
        }
      }

      const cleanFileName = `Ficha_Paletizado_JACOOR_${pallet.type}_${box.length}x${box.width}x${box.height}mm_${layersCount}pisos_${totalBoxes}cajas.pdf`;
      pdf.save(cleanFileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Puedes utilizar el botón "Imprimir en Papel" como alternativa.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden on print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Visualizadores
          </button>

          {/* Toggle Option: Include or exclude Cartesian Sequence on print/export */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              Opciones de Ficha:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={includeCartesianSequence}
                onChange={e => setIncludeCartesianSequence(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#007A3D] accent-[#007A3D] cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-[#007A3D]" />
                Secuencia Cartesiana de Entrada
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {downloadSuccess && (
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>PDF descargado correctamente</span>
            </div>
          )}

          {/* Primary PDF Export Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-5 py-2 text-xs font-bold text-[#005c2e] bg-[#FFC700] hover:bg-[#ffd100] active:scale-95 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#005c2e]" />
                <span>Generando PDF Oficial...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#005c2e]" />
                <span>Descargar PDF Almacén</span>
              </>
            )}
          </button>

          {/* Browser Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-[#007A3D] hover:bg-[#006331] rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir en Papel</span>
          </button>
        </div>
      </div>

      {/* Official JACOOR LOGÍSTICA Printable Logistics Document */}
      <div
        id="pallet-sheet-document"
        className="bg-white p-7 sm:p-9 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto space-y-5 text-slate-900"
      >
        {/* Header Document */}
        <div className="border-b-2 border-[#007A3D] pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#007A3D] flex items-center justify-center text-white font-black text-xl shadow-xs">
              JL
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-black text-[#007A3D] font-['Ubuntu'] tracking-tight">
                  JACOOR LOGÍSTICA
                </h1>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                  Logística & Cargas
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold">
                Ficha Técnica Oficial de Paletizado, Mosaicos, Estabilidad y Pesos
              </p>
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5 font-mono">
            <div className="font-bold text-slate-800">EXPEDICIÓN / REF: JCR-PLT-{pallet.type.toUpperCase()}-{layersCount}P</div>
            <div className="text-slate-500">Fecha emisión: {today}</div>
            <div className="text-emerald-700 font-semibold">Norma UNE-EN 13698 · 0 mm Saliente</div>
          </div>
        </div>

        {/* Technical Data Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">1. Base de Palet</span>
            <strong className="text-sm text-slate-900 block mt-0.5">{pallet.name}</strong>
            <span className="text-slate-600 font-mono">{pallet.length} × {pallet.width} × {pallet.baseHeight} mm</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">2. Medidas Caja</span>
            <strong className="text-sm text-slate-900 block mt-0.5">{box.length} × {box.width} × {box.height} mm</strong>
            <span className="text-slate-600 font-mono">Peso: {box.weight} kg/caja</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">3. Distribución</span>
            <strong className="text-sm text-[#007A3D] block mt-0.5">{selectedMosaic.boxesPerLayer} cajas / piso</strong>
            <span className="text-slate-600 font-mono">{layersCount} pisos = {totalBoxes} cajas totales</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">4. Altura y Peso Total</span>
            <strong className="text-sm text-[#007A3D] block mt-0.5">{totalHeightMm} mm ({(totalHeightMm/1000).toFixed(2)} m)</strong>
            <span className="text-slate-600 font-mono">Peso bruto: {totalWeightKg} kg</span>
          </div>
        </div>

        {/* Weight & Height Accounting Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#007A3D] text-white">
              <tr>
                <th className="py-2 px-3">Concepto Logístico</th>
                <th className="py-2 px-3">Detalle de Medidas / Cajas</th>
                <th className="py-2 px-3 text-right">Altura (mm)</th>
                <th className="py-2 px-3 text-right">Peso (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3 font-semibold">Palet de Madera Vacío</td>
                <td className="py-2 px-3 text-slate-600">{pallet.fullName}</td>
                <td className="py-2 px-3 text-right font-mono">{pallet.baseHeight} mm</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-amber-800">{tareWeightKg} kg (Tara)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold">Mercancía ({layersCount} Pisos)</td>
                <td className="py-2 px-3 text-slate-600">{totalBoxes} cajas de {box.weight} kg</td>
                <td className="py-2 px-3 text-right font-mono">{boxHeightTotalMm} mm</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{netWeightKg} kg (Neto)</td>
              </tr>
              <tr className="bg-emerald-50/80 font-bold text-[#007A3D]">
                <td className="py-2.5 px-3">TOTAL PALET CONSOLIDADO</td>
                <td className="py-2.5 px-3">{totalBoxes} cajas / {selectedMosaic.areaEfficiency}% superficie aprovechada</td>
                <td className="py-2.5 px-3 text-right font-mono text-sm">{totalHeightMm} mm ({(totalHeightMm/1000).toFixed(2)} m)</td>
                <td className="py-2.5 px-3 text-right font-mono text-sm">{totalWeightKg} kg</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION: Stability and Center of Gravity (Critical for Warehouse & Road Safety) */}
        <div className="border border-emerald-200 rounded-lg p-3.5 bg-emerald-50/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase text-[11px]">
              <Compass className="w-4 h-4 text-[#007A3D]" />
              <span>Análisis de Estabilidad y Centro de Gravedad (CdG):</span>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
              stability.stabilityIndexScore >= 70
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : stability.stabilityIndexScore >= 50
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              Índice: {stability.stabilityIndexScore}/100 ({stability.stabilityLevel})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block">Altura Centro Gravedad:</span>
              <strong className="text-slate-900 font-mono text-xs">{stability.centerOfGravityHeightMm} mm</strong>
              <span className="text-[10px] text-slate-400 block font-mono">{stability.centerOfGravityRatio}% de altura total</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block">Relación de Esbeltez (&lambda;):</span>
              <strong className="text-slate-900 font-mono text-xs">{stability.slendernessRatio}</strong>
              <span className="text-[10px] text-slate-400 block">H / Ancho base</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block">Ángulo Crítico Vuelco:</span>
              <strong className="text-slate-900 font-mono text-xs">{stability.staticTippingAngleDeg}&deg;</strong>
              <span className="text-[10px] text-slate-400 block">&theta; estático límite</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block">Traba Capitulado:</span>
              <strong className="text-emerald-800 font-mono text-xs">{selectedMosaic.stabilityScore}%</strong>
              <span className="text-[10px] text-slate-400 block">{selectedMosaic.interlockStability}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-emerald-200/60 flex items-start gap-1.5">
            <span className="font-bold text-emerald-900 shrink-0">Prescripción de Seguridad:</span>
            <span>{stability.recommendation}</span>
          </div>
        </div>

        {/* Layer Diagrams Side by Side: Capa A and Capa B */}
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Esquema de Mosaicos en Planta (Vista Superior 2D)</span>
            <span className="text-[#007A3D] font-semibold text-[11px]">
              Traba / Capitulado: {selectedMosaic.interlockStability} ({selectedMosaic.stabilityScore}%)
            </span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Capa A */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
              <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between px-1">
                <span>CAPA A (Pisos Impares: 1, 3, 5...)</span>
                <span className="text-[11px] font-mono font-semibold text-[#007A3D]">{selectedMosaic.boxesPerLayer} cajas</span>
              </div>
              <svg
                viewBox={`0 0 ${pallet.length} ${pallet.width}`}
                className="w-full h-36 bg-white border border-slate-200 rounded"
              >
                <rect x="0" y="0" width={pallet.length} height={pallet.width} fill="#E2D7BA" />
                {selectedMosaic.layerA.map(b => (
                  <g key={`print-a-${b.id}`}>
                    <rect
                      x={b.x + 2}
                      y={b.y + 2}
                      width={b.w - 4}
                      height={b.h - 4}
                      fill={b.rotated ? '#C8E6C9' : '#A5D6A7'}
                      stroke="#2E7D32"
                      strokeWidth="2"
                    />
                    <text
                      x={b.x + b.w / 2}
                      y={b.y + b.h / 2}
                      fontSize={b.h > 150 ? 55 : 38}
                      fontWeight="bold"
                      fill="#1B5E20"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      A{b.id}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {selectedMosaic.boxesPerLayer} cajas por capa ({pallet.length}×{pallet.width} mm) · 0 mm saliente
              </div>
            </div>

            {/* Capa B */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
              <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between px-1">
                <span>CAPA B (Pisos Pares: 2, 4, 6... - Capitulada)</span>
                <span className="text-[11px] font-mono font-semibold text-emerald-800">{selectedMosaic.boxesPerLayer} cajas</span>
              </div>
              <svg
                viewBox={`0 0 ${pallet.length} ${pallet.width}`}
                className="w-full h-36 bg-white border border-slate-200 rounded"
              >
                <rect x="0" y="0" width={pallet.length} height={pallet.width} fill="#E2D7BA" />
                {selectedMosaic.layerB.map(b => (
                  <g key={`print-b-${b.id}`}>
                    <rect
                      x={b.x + 2}
                      y={b.y + 2}
                      width={b.w - 4}
                      height={b.h - 4}
                      fill={b.rotated ? '#B2DFDB' : '#80CBC4'}
                      stroke="#00695C"
                      strokeWidth="2"
                    />
                    <text
                      x={b.x + b.w / 2}
                      y={b.y + b.h / 2}
                      fontSize={b.h > 150 ? 55 : 38}
                      fontWeight="bold"
                      fill="#004D40"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      B{b.id}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Capitulado contrapeado para máxima resistencia dinámica
              </div>
            </div>
          </div>
        </div>

        {/* PERSPECTIVAS FRONTALES EN ALZADO: Frontal (Parte Larga) y Frontal Giro 90° (Parte Corta) */}
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Perfil de Traba Capitulada en Alzado (Perspectivas Frontales)</span>
            <span className="text-[#007A3D] font-semibold text-[11px]">
              {layersCount} pisos apilados · Altura total: {totalHeightMm} mm ({(totalHeightMm/1000).toFixed(2)} m)
            </span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* 1. Vista Frontal (Parte Larga) */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
              <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between px-1">
                <span>Perfil de traba capitulada en la parte larga ({pallet.length} mm)</span>
                <span className="text-[11px] font-mono font-semibold text-[#007A3D]">
                  {totalHeightMm} mm de altura
                </span>
              </div>
              <svg
                viewBox={`0 0 ${pallet.length + 130} ${totalHeightMm + 90}`}
                className="w-full h-44 bg-white border border-slate-200 rounded"
              >
                <defs>
                  <marker id="frontDimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                  </marker>
                </defs>
                {(() => {
                  const offX = 65;
                  const baseY = totalHeightMm + 45;
                  const palH = pallet.baseHeight;
                  const palTopY = baseY - palH;
                  const stackTopY = palTopY - layersCount * box.height;

                  return (
                    <g>
                      {/* Height dimension line on left */}
                      <line x1="28" y1={baseY} x2="28" y2={stackTopY} stroke="#475569" strokeWidth="2.5" markerStart="url(#frontDimArrow)" markerEnd="url(#frontDimArrow)" />
                      <line x1="16" y1={baseY} x2="40" y2={baseY} stroke="#94A3B8" strokeWidth="1.5" />
                      <line x1="16" y1={stackTopY} x2="40" y2={stackTopY} stroke="#94A3B8" strokeWidth="1.5" />
                      <text x="20" y={(baseY + stackTopY) / 2} fontSize="22" fontWeight="bold" fill="#0F172A" textAnchor="middle" transform={`rotate(-90, 20, ${(baseY + stackTopY) / 2})`}>
                        {totalHeightMm} mm
                      </text>

                      {/* Pallet base */}
                      <rect x={offX} y={palTopY} width={pallet.length} height={palH} fill="#D7C49E" stroke="#7A623D" strokeWidth="2.5" rx="2" />
                      {/* Forklift openings */}
                      <rect x={offX + 150} y={palTopY + 20} width="300" height={palH - 36} fill="#453420" rx="3" />
                      <rect x={offX + 750} y={palTopY + 20} width="300" height={palH - 36} fill="#453420" rx="3" />
                      <text x={offX + pallet.length / 2} y={palTopY + palH / 2 + 5} fontSize="20" fontWeight="bold" fill="#3D2E1D" textAnchor="middle">
                        Base {pallet.name} ({palH} mm)
                      </text>

                      {/* Stack layers */}
                      {Array.from({ length: layersCount }).map((_, idx) => {
                        const floorNum = idx + 1;
                        const isEven = floorNum % 2 === 0;
                        const layerPlacements = isEven ? selectedMosaic.layerB : selectedMosaic.layerA;
                        const frontBoxes = getFrontFaçadeBoxes(layerPlacements);
                        const floorTopY = palTopY - floorNum * box.height;

                        return (
                          <g key={`front-elev-${floorNum}`}>
                            {frontBoxes.map(b => (
                              <rect
                                key={`fe-b-${floorNum}-${b.id}`}
                                x={offX + b.x + 1}
                                y={floorTopY + 1}
                                width={b.w - 2}
                                height={box.height - 2}
                                fill={isEven ? '#B2DFDB' : '#C8E6C9'}
                                stroke={isEven ? '#004D40' : '#1B5E20'}
                                strokeWidth="2"
                                rx="2"
                              />
                            ))}
                            {/* Floor label on right side */}
                            <text
                              x={offX + pallet.length + 8}
                              y={floorTopY + box.height / 2 + 4}
                              fontSize="14"
                              fontWeight="bold"
                              fontFamily="monospace"
                              fill="#475569"
                            >
                              P{floorNum} ({isEven ? 'Capa B' : 'Capa A'})
                            </text>
                          </g>
                        );
                      })}

                      {/* Bottom width cota */}
                      <line x1={offX} y1={baseY + 24} x2={offX + pallet.length} y2={baseY + 24} stroke="#475569" strokeWidth="2" markerStart="url(#frontDimArrow)" markerEnd="url(#frontDimArrow)" />
                      <text x={offX + pallet.length / 2} y={baseY + 44} fontSize="20" fontWeight="bold" fontFamily="monospace" fill="#0F172A" textAnchor="middle">
                        Largo Base: {pallet.length} mm
                      </text>
                    </g>
                  );
                })()}
              </svg>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Perfil de traba capitulada en la parte larga ({pallet.length} mm)
              </div>
            </div>

            {/* 2. Vista Frontal (Parte Corta) */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center">
              <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between px-1">
                <span>Perfil de traba capitulada en la parte corta ({pallet.width} mm)</span>
                <span className="text-[11px] font-mono font-semibold text-emerald-800">
                  {totalHeightMm} mm de altura
                </span>
              </div>
              <svg
                viewBox={`0 0 ${pallet.width + 130} ${totalHeightMm + 90}`}
                className="w-full h-44 bg-white border border-slate-200 rounded"
              >
                <defs>
                  <marker id="sideDimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                  </marker>
                </defs>
                {(() => {
                  const offX = 65;
                  const baseY = totalHeightMm + 45;
                  const palH = pallet.baseHeight;
                  const palTopY = baseY - palH;
                  const stackTopY = palTopY - layersCount * box.height;

                  return (
                    <g>
                      {/* Height dimension line on left */}
                      <line x1="28" y1={baseY} x2="28" y2={stackTopY} stroke="#475569" strokeWidth="2.5" markerStart="url(#sideDimArrow)" markerEnd="url(#sideDimArrow)" />
                      <line x1="16" y1={baseY} x2="40" y2={baseY} stroke="#94A3B8" strokeWidth="1.5" />
                      <line x1="16" y1={stackTopY} x2="40" y2={stackTopY} stroke="#94A3B8" strokeWidth="1.5" />
                      <text x="20" y={(baseY + stackTopY) / 2} fontSize="22" fontWeight="bold" fill="#0F172A" textAnchor="middle" transform={`rotate(-90, 20, ${(baseY + stackTopY) / 2})`}>
                        {totalHeightMm} mm
                      </text>

                      {/* Pallet base (short side with 3 blocks and entries) */}
                      <rect x={offX} y={palTopY} width={pallet.width} height={palH} fill="#D7C49E" stroke="#7A623D" strokeWidth="2.5" rx="2" />
                      {/* 2 fork cutouts between 3 blocks */}
                      <rect x={offX + 145} y={palTopY + 20} width="175" height={palH - 36} fill="#453420" rx="3" />
                      <rect x={offX + 475} y={palTopY + 20} width="175" height={palH - 36} fill="#453420" rx="3" />
                      <text x={offX + pallet.width / 2} y={palTopY + palH / 2 + 5} fontSize="20" fontWeight="bold" fill="#3D2E1D" textAnchor="middle">
                        Parte Corta ({pallet.width} mm)
                      </text>

                      {/* Stack layers */}
                      {Array.from({ length: layersCount }).map((_, idx) => {
                        const floorNum = idx + 1;
                        const isEven = floorNum % 2 === 0;
                        const layerPlacements = isEven ? selectedMosaic.layerB : selectedMosaic.layerA;
                        const sideBoxes = getSideFaçadeBoxes(layerPlacements);
                        const floorTopY = palTopY - floorNum * box.height;

                        return (
                          <g key={`side-elev-${floorNum}`}>
                            {sideBoxes.map(b => (
                              <rect
                                key={`se-b-${floorNum}-${b.id}`}
                                x={offX + b.y + 1}
                                y={floorTopY + 1}
                                width={b.h - 2}
                                height={box.height - 2}
                                fill={isEven ? '#B2DFDB' : '#C8E6C9'}
                                stroke={isEven ? '#004D40' : '#1B5E20'}
                                strokeWidth="2"
                                rx="2"
                              />
                            ))}
                            {/* Floor label on right side */}
                            <text
                              x={offX + pallet.width + 8}
                              y={floorTopY + box.height / 2 + 4}
                              fontSize="14"
                              fontWeight="bold"
                              fontFamily="monospace"
                              fill="#475569"
                            >
                              P{floorNum} ({isEven ? 'B' : 'A'})
                            </text>
                          </g>
                        );
                      })}

                      {/* Bottom width cota */}
                      <line x1={offX} y1={baseY + 24} x2={offX + pallet.width} y2={baseY + 24} stroke="#475569" strokeWidth="2" markerStart="url(#sideDimArrow)" markerEnd="url(#sideDimArrow)" />
                      <text x={offX + pallet.width / 2} y={baseY + 44} fontSize="20" fontWeight="bold" fontFamily="monospace" fill="#0F172A" textAnchor="middle">
                        Ancho Base: {pallet.width} mm
                      </text>
                    </g>
                  );
                })()}
              </svg>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Perfil de traba capitulada en la parte corta ({pallet.width} mm)
              </div>
            </div>
          </div>
        </div>

        {/* Optional Cartesian Infeed Summary on printable sheet (User can toggle on or off) */}
        {includeCartesianSequence && (
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[11px]">
                Secuencia Automatizada de Entrada Cartesiana (Robot X-Y-Z):
              </span>
              <span className="text-[11px] font-mono text-emerald-800">
                {selectedMosaic.cartesianGroupsA.length} lotes de entrada · Perímetro exterior 100% enrasado
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {selectedMosaic.cartesianGroupsA.map(grp => (
                <div key={grp.step} className="bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold text-emerald-800 block">P{grp.step}: {grp.side}</span>
                  <span className="text-slate-600 font-mono">{grp.boxesCount} cajas · {grp.entryAxis}</span>
                  <div className="text-[10px] text-slate-400 truncate">{grp.depositRange}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality and Transport Checklist */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Requisitos de Calidad y Expedición JACOOR LOGÍSTICA
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#007A3D] shrink-0" />
              <span>Ninguna caja sobresale del perímetro (0 mm overhang).</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#007A3D] shrink-0" />
              <span>Capas capituladas para evitar efecto columna.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#007A3D] shrink-0" />
              <span>Fleje vertical/horizontal o film estirable homologado.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#007A3D] shrink-0" />
              <span>Gálibo total &le; 2.000 mm conforme a muelles de descarga.</span>
            </div>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <span className="block font-semibold">Responsable de Logística / Carga:</span>
            <div className="h-10 border-b border-dashed border-slate-300 mt-2" />
            <span className="text-[10px] text-slate-400 mt-1 block">Firma y Sello del Proveedor</span>
          </div>
          <div>
            <span className="block font-semibold">Recepción en Bloque Logístico:</span>
            <div className="h-10 border-b border-dashed border-slate-300 mt-2" />
            <span className="text-[10px] text-slate-400 mt-1 block">Control de Calidad JACOOR LOGÍSTICA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
