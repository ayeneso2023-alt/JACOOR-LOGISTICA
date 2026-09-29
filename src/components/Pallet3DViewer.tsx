import React, { useState, useMemo } from 'react';
import { MosaicPattern, PalletDimensions, BoxDimensions, BoxPlacement } from '../types/pallet';
import { Layers, RotateCcw, Eye, ShieldCheck, ArrowUpRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Pallet3DViewerProps {
  mosaic: MosaicPattern;
  pallet: PalletDimensions;
  box: BoxDimensions;
  layersCount: number;
}

export const Pallet3DViewer: React.FC<Pallet3DViewerProps> = ({
  mosaic,
  pallet,
  box,
  layersCount,
}) => {
  const [explosionGap, setExplosionGap] = useState<number>(0); // 0 to 60 mm separation between layers
  const [activeViewAngle, setActiveViewAngle] = useState<'iso1' | 'iso2' | 'front' | 'front90'>('iso1');
  const [highlightedLayer, setHighlightedLayer] = useState<number | null>(null);
  const [manualZoom, setManualZoom] = useState<number>(1);

  const PL = pallet.length; // 1200
  const PW = pallet.width;  // 800 or 1000
  const BH = box.height;    // e.g. 180 or 200

  // 3D Isometric projection constants
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  // Raw projection function (unit scale, centered at origin)
  function rawProject(x: number, y: number, z: number, angle: 'iso1' | 'iso2' | 'front' | 'front90') {
    if (angle === 'iso2') {
      // Rotated 90 degrees clockwise around Z:
      // Transformed coordinates: rx = y (spans 0 to PW), ry = PL - x (spans 0 to PL)
      const rx = y;
      const ry = PL - x;
      return {
        x: (rx - ry) * cos30,
        y: (rx + ry) * sin30 * 0.7 - z,
      };
    } else if (angle === 'front') {
      // Frontal elevation perspective: looking along Y towards 0 (facing the 1200 mm long side)
      return {
        x: (x - PL / 2) * 0.95,
        y: (y - PW) * 0.16 - z,
      };
    } else if (angle === 'front90') {
      // Frontal 90° elevation perspective: looking along X from 0 towards PL (facing the short side PW = 800/1000 mm)
      // Horizontal on screen: Y axis centered at PW / 2
      // Depth into screen: X axis (0 is in front closest to camera, PL is in the back)
      return {
        x: (y - PW / 2) * 0.95,
        y: -x * 0.16 - z,
      };
    } else {
      // Default isometric 1
      return {
        x: (x - y) * cos30,
        y: (x + y) * sin30 * 0.7 - z,
      };
    }
  }

  // Calculate dynamic bounding box of all 8 extreme corners of the pallet stack
  const { fitScale, centerRawX, centerRawY, totalStackZ } = useMemo(() => {
    const totalZ = pallet.baseHeight + layersCount * BH + Math.max(0, layersCount - 1) * explosionGap;

    const corners = [
      { x: 0, y: 0, z: 0 },
      { x: PL, y: 0, z: 0 },
      { x: PL, y: PW, z: 0 },
      { x: 0, y: PW, z: 0 },
      { x: 0, y: 0, z: totalZ },
      { x: PL, y: 0, z: totalZ },
      { x: PL, y: PW, z: totalZ },
      { x: 0, y: PW, z: totalZ },
    ];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    corners.forEach(c => {
      const p = rawProject(c.x, c.y, c.z, activeViewAngle);
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    // Canvas size is 800 x 660 px.
    const availW = 800 - 140; // 660 px
    const availH = 660 - 140; // 520 px

    // Auto-fit scale to ensure entire pallet with all 5+ floors fits completely
    const calculatedScale = Math.min(availW / spanX, availH / spanY) * 0.94;

    return {
      fitScale: calculatedScale,
      centerRawX: (minX + maxX) / 2,
      centerRawY: (minY + maxY) / 2,
      totalStackZ: totalZ,
    };
  }, [PL, PW, BH, pallet.baseHeight, layersCount, explosionGap, activeViewAngle]);

  const finalScale = fitScale * manualZoom;

  // Final projection to 2D SVG canvas coordinates (800x660)
  function project(x: number, y: number, z: number) {
    const raw = rawProject(x, y, z, activeViewAngle);
    return {
      x: (raw.x - centerRawX) * finalScale + 400,
      y: (raw.y - centerRawY) * finalScale + 330,
    };
  }

  // Draw 3D Box with Top face and strictly FRONT-FACING visible vertical walls
  // This solves the bug where boxes appeared "open / inside-out" when rotated 90 degrees.
  function render3DBox(
    b: BoxPlacement,
    layerIdx: number,
    baseZ: number,
    boxH: number,
    isEvenLayer: boolean
  ) {
    const x0 = b.x;
    const x1 = b.x + b.w;
    const y0 = b.y;
    const y1 = b.y + b.h;
    const z0 = baseZ;
    const z1 = baseZ + boxH;

    // 8 vertices in 3D
    const p000 = project(x0, y0, z0);
    const p100 = project(x1, y0, z0);
    const p110 = project(x1, y1, z0);
    const p010 = project(x0, y1, z0);

    const p001 = project(x0, y0, z1);
    const p101 = project(x1, y0, z1);
    const p111 = project(x1, y1, z1);
    const p011 = project(x0, y1, z1);

    const isLayerHighlighted = highlightedLayer === layerIdx;

    // Cardboard colors
    const topFill = isLayerHighlighted
      ? '#FDE047'
      : isEvenLayer
      ? '#D5C4A1'
      : '#C4B28E';
    const side1Fill = isLayerHighlighted
      ? '#EAB308'
      : isEvenLayer
      ? '#B5A27F'
      : '#A6926F';
    const side2Fill = isLayerHighlighted
      ? '#CA8A04'
      : isEvenLayer
      ? '#9B8764'
      : '#8B7754';

    const strokeColor = isLayerHighlighted ? '#854D0E' : '#695738';

    return (
      <g
        key={`l${layerIdx}-b${b.id}`}
        onMouseEnter={() => setHighlightedLayer(layerIdx)}
        onMouseLeave={() => setHighlightedLayer(null)}
        className="cursor-pointer transition-colors"
      >
        {/* Top face (always visible from above) */}
        <polygon
          points={`${p001.x},${p001.y} ${p101.x},${p101.y} ${p111.x},${p111.y} ${p011.x},${p011.y}`}
          fill={topFill}
          stroke={strokeColor}
          strokeWidth="0.8"
        />

        {/* Vertical Face 1: Front-Y face (y = y1) - visible in iso1, iso2, and front */}
        {activeViewAngle !== 'front90' && (
          <polygon
            points={`${p010.x},${p010.y} ${p110.x},${p110.y} ${p111.x},${p111.y} ${p011.x},${p011.y}`}
            fill={side1Fill}
            stroke={strokeColor}
            strokeWidth="0.8"
          />
        )}

        {/* Vertical Face 2:
            - In default iso1: Right-X face (x = x1) faces camera.
            - In rotated iso2 (90°): Left-X face (x = x0) faces camera.
            - In front90 (90° short side): Left-X face (x = x0) faces camera.
            - In front: only Front-Y face is front-on. */}
        {activeViewAngle === 'iso2' || activeViewAngle === 'front90' ? (
          <polygon
            points={`${p000.x},${p000.y} ${p010.x},${p010.y} ${p011.x},${p011.y} ${p001.x},${p001.y}`}
            fill={activeViewAngle === 'front90' ? side1Fill : side2Fill}
            stroke={strokeColor}
            strokeWidth="0.8"
          />
        ) : activeViewAngle === 'iso1' ? (
          <polygon
            points={`${p100.x},${p100.y} ${p110.x},${p110.y} ${p111.x},${p111.y} ${p101.x},${p101.y}`}
            fill={side2Fill}
            stroke={strokeColor}
            strokeWidth="0.8"
          />
        ) : null}

        {/* Packing tape line indicator on top */}
        {b.w > 200 && b.h > 150 && (
          <line
            x1={(p001.x + p101.x) / 2}
            y1={(p001.y + p101.y) / 2}
            x2={(p011.x + p111.x) / 2}
            y2={(p011.y + p111.y) / 2}
            stroke="#5C4728"
            strokeWidth="1.2"
            strokeDasharray="4,2"
            opacity="0.35"
          />
        )}
      </g>
    );
  }

  // Draw 3D Wooden Pallet Base with correct front faces for the active angle
  function render3DPalletWood() {
    const palH = pallet.baseHeight;
    const corner000 = project(0, 0, 0);
    const corner100 = project(PL, 0, 0);
    const corner110 = project(PL, PW, 0);
    const corner010 = project(0, PW, 0);

    const corner001 = project(0, 0, palH);
    const corner101 = project(PL, 0, palH);
    const corner111 = project(PL, PW, palH);
    const corner011 = project(0, PW, palH);

    return (
      <g>
        {/* Top wood surface (rendered first so front faces cap it) */}
        <polygon
          points={`${corner001.x},${corner001.y} ${corner101.x},${corner101.y} ${corner111.x},${corner111.y} ${corner011.x},${corner011.y}`}
          fill="#BFA67D"
          stroke="#735C3A"
          strokeWidth="1"
        />

        {/* Wooden pallet front face:
            - In front, iso1, iso2: Front-Y face (y = PW)
            - In front90: Left-X face (x = 0) facing short side (PW = 800/1000) */}
        {activeViewAngle === 'front90' ? (
          <polygon
            points={`${corner000.x},${corner000.y} ${corner010.x},${corner010.y} ${corner011.x},${corner011.y} ${corner001.x},${corner001.y}`}
            fill="#8C7350"
            stroke="#5C4728"
            strokeWidth="1"
          />
        ) : (
          <polygon
            points={`${corner010.x},${corner010.y} ${corner110.x},${corner110.y} ${corner111.x},${corner111.y} ${corner011.x},${corner011.y}`}
            fill="#8C7350"
            stroke="#5C4728"
            strokeWidth="1"
          />
        )}

        {/* Side wood face in isometric */}
        {activeViewAngle === 'iso2' ? (
          <polygon
            points={`${corner000.x},${corner000.y} ${corner010.x},${corner010.y} ${corner011.x},${corner011.y} ${corner001.x},${corner001.y}`}
            fill="#6E5637"
            stroke="#4A3720"
            strokeWidth="1"
          />
        ) : activeViewAngle === 'iso1' ? (
          <polygon
            points={`${corner100.x},${corner100.y} ${corner110.x},${corner110.y} ${corner111.x},${corner111.y} ${corner101.x},${corner101.y}`}
            fill="#6E5637"
            stroke="#4A3720"
            strokeWidth="1"
          />
        ) : null}

        {/* Forklift openings on the front wood face (y = PW) in front and isometric views */}
        {activeViewAngle !== 'front90' && (
          <>
            <polygon
              points={`${project(150, PW, 25).x},${project(150, PW, 25).y} ${project(450, PW, 25).x},${project(450, PW, 25).y} ${project(450, PW, palH - 25).x},${project(450, PW, palH - 25).y} ${project(150, PW, palH - 25).x},${project(150, PW, palH - 25).y}`}
              fill="#3B2A18"
            />
            <polygon
              points={`${project(750, PW, 25).x},${project(750, PW, 25).y} ${project(1050, PW, 25).x},${project(1050, PW, 25).y} ${project(1050, PW, palH - 25).x},${project(1050, PW, palH - 25).y} ${project(750, PW, palH - 25).x},${project(750, PW, palH - 25).y}`}
              fill="#3B2A18"
            />
          </>
        )}

        {/* Forklift entry openings on the short side (x = 0) in front90 */}
        {activeViewAngle === 'front90' && (
          <>
            <polygon
              points={`${project(0, 150, 25).x},${project(0, 150, 25).y} ${project(0, 320, 25).x},${project(0, 320, 25).y} ${project(0, 320, palH - 25).x},${project(0, 320, palH - 25).y} ${project(0, 150, palH - 25).x},${project(0, 150, palH - 25).y}`}
              fill="#3B2A18"
            />
            <polygon
              points={`${project(0, 480, 25).x},${project(0, 480, 25).y} ${project(0, 650, 25).x},${project(0, 650, 25).y} ${project(0, 650, palH - 25).x},${project(0, 650, palH - 25).y} ${project(0, 480, palH - 25).x},${project(0, 480, palH - 25).y}`}
              fill="#3B2A18"
            />
          </>
        )}

        {/* Forklift notch opening on side face in iso2 (x = 0) */}
        {activeViewAngle === 'iso2' && (
          <polygon
            points={`${project(0, 200, 30).x},${project(0, 200, 30).y} ${project(0, 600, 30).x},${project(0, 600, 30).y} ${project(0, 600, palH - 30).x},${project(0, 600, palH - 30).y} ${project(0, 200, palH - 30).x},${project(0, 200, palH - 30).y}`}
            fill="#3B2A18"
          />
        )}
      </g>
    );
  }

  // Pre-calculate heights and render layers from bottom (layer 1) to top (layer N)
  const renderedLayers: React.ReactNode[] = [];
  let currentZ = pallet.baseHeight;

  for (let l = 1; l <= layersCount; l++) {
    const isEven = l % 2 === 0;
    // Layer pattern: alternate between Layer A and Layer B (Capitulado)
    const currentLayerPlacements = isEven ? mosaic.layerB : mosaic.layerA;

    const layerBaseZ = currentZ;

    // Sort boxes for painter's algorithm:
    // In iso1: depth increases with (x + y). Smallest (x + y) drawn first.
    // In iso2 (rotated 90°): depth increases with y - x (since rx = y, ry = PL - x). Smallest (y - x) drawn first!
    // In front: depth increases with y. Smallest y (furthest back) drawn first.
    // In front90: depth increases with x. Largest x (furthest back) drawn first, smallest x (in front) drawn last.
    const sortedBoxes = [...currentLayerPlacements].sort((a, b) => {
      if (activeViewAngle === 'iso2') {
        return (a.y - a.x) - (b.y - b.x);
      } else if (activeViewAngle === 'front') {
        return (a.y - b.y) || (a.x - b.x);
      } else if (activeViewAngle === 'front90') {
        return (b.x - a.x) || (a.y - b.y);
      }
      return (a.x + a.y) - (b.x + b.y);
    });

    const layerNode = (
      <g key={`layer-group-${l}`}>
        {sortedBoxes.map(b => render3DBox(b, l, layerBaseZ, BH, isEven))}
      </g>
    );

    renderedLayers.push(layerNode);
    currentZ += BH + explosionGap;
  }

  // Center point on the floor for the shadow
  const shadowCenter = project(PL / 2, PW / 2, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* 3D Header Controls */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Perspectiva 3D con Pisos Capitulados:
          </span>
          <span className="text-xs font-semibold text-[#007A3D] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {layersCount} pisos apilados ({Math.round(totalStackZ)} mm altura total)
          </span>
        </div>

        {/* View Angle Selector (iso1, iso2, front, front90) */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 flex-wrap">
          <button
            onClick={() => setActiveViewAngle('iso1')}
            className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeViewAngle === 'iso1'
                ? 'bg-[#007A3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Isométrica A
          </button>
          <button
            onClick={() => setActiveViewAngle('iso2')}
            className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeViewAngle === 'iso2'
                ? 'bg-[#007A3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Isométrica B (Giro 90°)
          </button>
          <button
            onClick={() => setActiveViewAngle('front')}
            className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeViewAngle === 'front'
                ? 'bg-[#007A3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Frontal ({PL} mm)
          </button>
          <button
            onClick={() => setActiveViewAngle('front90')}
            className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
              activeViewAngle === 'front90'
                ? 'bg-[#007A3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Frontal (Giro 90° - {PW} mm)
          </button>
        </div>

        {/* Zoom & Exploded view slider */}
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <button
              onClick={() => setManualZoom(z => Math.max(0.6, z - 0.1))}
              title="Reducir tamaño del dibujo"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-slate-700 px-1 font-semibold text-[11px]">
              {Math.round(manualZoom * 100)}%
            </span>
            <button
              onClick={() => setManualZoom(z => Math.min(1.6, z + 0.1))}
              title="Aumentar tamaño del dibujo"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setManualZoom(1)}
              title="Ajustar dibujo automáticamente para que quepa todo"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer border-l border-slate-200 pl-1.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Exploded view slider */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500 font-medium">Separar pisos:</span>
            <input
              type="range"
              min={0}
              max={60}
              value={explosionGap}
              onChange={e => setExplosionGap(Number(e.target.value))}
              className="w-20 accent-[#007A3D] cursor-pointer"
            />
            <span className="font-mono text-slate-700 w-8">{explosionGap}mm</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="p-4 sm:p-6 bg-[#F4F6F5] flex-1 flex flex-col items-center justify-center min-h-[480px] overflow-hidden relative">
        <svg
          viewBox="0 0 800 660"
          className="w-[760px] max-w-full drop-shadow-md select-none"
        >
          {/* Ground shadow positioned dynamically beneath pallet base */}
          <ellipse
            cx={shadowCenter.x}
            cy={shadowCenter.y + 12}
            rx={Math.max(120, (PL + PW) * 0.28 * finalScale)}
            ry={Math.max(40, PW * 0.22 * finalScale)}
            fill="#CBD5E1"
            opacity="0.5"
          />

          {/* Wooden Pallet Base */}
          {render3DPalletWood()}

          {/* Render All Layers in 3D */}
          {renderedLayers}
        </svg>

        {/* Active Layer Indicator & Height Info */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg p-2.5 shadow-sm text-xs space-y-1.5 pointer-events-none sm:pointer-events-auto">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Esquema Capas ({layersCount} Pisos):</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#C4B28E] border border-[#695738]" />
            <span>Pisos Impares: <strong>Capa A</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#D5C4A1] border border-[#854D0E]" />
            <span>Pisos Pares: <strong>Capa B (Capitulada)</strong></span>
          </div>
          <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px] text-slate-600">
            <span>Piso Superior (#{layersCount}):</span>
            <span className="font-mono font-bold text-emerald-800">Cota {Math.round(totalStackZ)} mm</span>
          </div>
          {highlightedLayer && (
            <div className="font-bold text-[#007A3D] text-[11px]">
              Inspeccionando Piso #{highlightedLayer}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#007A3D]" />
          <span>
            {activeViewAngle === 'front90'
              ? `Perspectiva Frontal (Giro 90°): Vista directa de la parte corta del palet (${PW} mm). Muestra el perfil de traba entre pisos y tacos.`
              : activeViewAngle === 'front'
              ? `Perspectiva Frontal: Vista directa del lado largo del palet (${PL} mm) con gálibo total y aberturas de horquillas.`
              : activeViewAngle === 'iso2'
              ? 'Perspectiva Isométrica B (Giro 90°): Caras frontales y orden de profundidad corregidos. Cajas sólidas y cerradas.'
              : 'Escala adaptativa automática: Todos los pisos apilados se muestran completos sin cortes en la imagen.'}
          </span>
        </div>
        <span className="font-mono text-slate-500">
          {layersCount} pisos × {mosaic.boxesPerLayer} cajas = {layersCount * mosaic.boxesPerLayer} cajas totales
        </span>
      </div>
    </div>
  );
};
