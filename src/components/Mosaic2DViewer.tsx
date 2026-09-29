import React, { useState, useEffect } from 'react';
import { MosaicPattern, PalletDimensions, BoxDimensions, BoxPlacement, CartesianInfeedGroup, PalletStabilityInfo } from '../types/pallet';
import { ZoomIn, ZoomOut, RotateCcw, Info, Eye, ShieldCheck, CheckCircle2, Play, Pause, SkipForward, SkipBack, Bot, ArrowRight, ArrowDown, ArrowUp, ArrowLeft, Boxes, Check, Sparkles } from 'lucide-react';
import { StabilityMetricTooltip } from './StabilityMetricTooltip';

interface Mosaic2DViewerProps {
  mosaic: MosaicPattern;
  pallet: PalletDimensions;
  box: BoxDimensions;
  stability?: PalletStabilityInfo;
}

export const Mosaic2DViewer: React.FC<Mosaic2DViewerProps> = ({
  mosaic,
  pallet,
  box,
  stability,
}) => {
  const [activeLayer, setActiveLayer] = useState<'layerA' | 'layerB' | 'overlay' | 'cartesian'>('layerA');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredBox, setHoveredBox] = useState<BoxPlacement | null>(null);

  // Cartesian Robot Stepper State
  const [cartesianTargetLayer, setCartesianTargetLayer] = useState<'A' | 'B'>('A');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlayingCartesian, setIsPlayingCartesian] = useState<boolean>(false);

  const PL = pallet.length; // e.g. 1200
  const PW = pallet.width;  // e.g. 800 or 1000

  // Padding around pallet for technical dimension lines (cotas)
  const padL = 95; // left padding for Y dimension
  const padR = 45;
  const padT = 55; // top padding
  const padB = 95; // bottom padding for X dimension
  const svgW = PL + padL + padR;
  const svgH = PW + padT + padB;

  const currentCartesianGroups = cartesianTargetLayer === 'B' ? mosaic.cartesianGroupsB : mosaic.cartesianGroupsA;
  const currentPlacements = activeLayer === 'layerB' || (activeLayer === 'cartesian' && cartesianTargetLayer === 'B')
    ? mosaic.layerB
    : mosaic.layerA;

  const currentChimneyHoles = activeLayer === 'layerB' || (activeLayer === 'cartesian' && cartesianTargetLayer === 'B')
    ? mosaic.chimneyHolesB
    : mosaic.chimneyHolesA;

  // Active group in cartesian mode
  const activeCartesianGroup: CartesianInfeedGroup | undefined = currentCartesianGroups[activeStepIndex];

  // Auto-play Cartesian infeed simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingCartesian && activeLayer === 'cartesian') {
      timer = setInterval(() => {
        setActiveStepIndex(prev => {
          if (prev >= currentCartesianGroups.length - 1) {
            setIsPlayingCartesian(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlayingCartesian, activeLayer, currentCartesianGroups.length]);

  // When switching cartesian target layer or active tab, reset step
  useEffect(() => {
    setActiveStepIndex(0);
    setIsPlayingCartesian(false);
  }, [cartesianTargetLayer, mosaic.id]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Viewer Header with Controls and Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Layer Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg flex-wrap">
          <button
            onClick={() => setActiveLayer('layerA')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeLayer === 'layerA'
                ? 'bg-white text-[#007A3D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Capa A (Impar)
          </button>
          <button
            onClick={() => setActiveLayer('layerB')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeLayer === 'layerB'
                ? 'bg-[#007A3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Capa B (Capitulada)
          </button>
          <button
            onClick={() => setActiveLayer('overlay')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeLayer === 'overlay'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Superposición (Traba A+B)
          </button>
          <button
            onClick={() => {
              setActiveLayer('cartesian');
              setActiveStepIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeLayer === 'cartesian'
                ? 'bg-[#005c2e] text-[#FFC700] shadow-xs font-extrabold ring-1 ring-emerald-700'
                : 'text-slate-700 hover:text-slate-900 bg-white/80'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#FFC700]" />
            <span>Secuencia Cartesiana (Robot X-Y)</span>
          </button>
        </div>

        {/* Stability & Capitulado indicators with info tooltips */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {stability && (
            <>
              {/* 1. Ángulo de vuelco */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] shadow-2xs">
                <span className="text-slate-500 font-medium">Ángulo de vuelco:</span>
                <strong className="font-mono text-slate-900">{stability.staticTippingAngleDeg}°</strong>
                <StabilityMetricTooltip
                  type="angulo_vuelco"
                  currentValue={`${stability.staticTippingAngleDeg}° (${stability.staticTippingAngleDeg >= 28 ? 'Bueno' : stability.staticTippingAngleDeg >= 22 ? 'Medio' : 'Malo'})`}
                />
              </div>

              {/* 2. Relación de esbeltez */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] shadow-2xs">
                <span className="text-slate-500 font-medium">Esbeltez (λ):</span>
                <strong className="font-mono text-slate-900">{stability.slendernessRatio}</strong>
                <StabilityMetricTooltip
                  type="esbeltez"
                  currentValue={`λ = ${stability.slendernessRatio} (${stability.slendernessRatio <= 1.4 ? 'Bueno / Compacto' : stability.slendernessRatio <= 1.85 ? 'Medio' : 'Malo / Torre'})`}
                />
              </div>
            </>
          )}

          {/* 3. Traba capitulado */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] shadow-2xs">
            <span className="text-slate-500 font-medium">Traba capitulado:</span>
            <strong className="font-mono text-[#007A3D]">{mosaic.stabilityScore}%</strong>
            <StabilityMetricTooltip
              type="traba_capitulado"
              currentValue={`${mosaic.stabilityScore}% (${mosaic.stabilityScore >= 60 ? 'Bueno' : mosaic.stabilityScore >= 30 ? 'Medio' : 'Malo'})`}
            />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.15))}
            title="Alejar"
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1.5 font-semibold text-slate-700">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.15))}
            title="Acercar"
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Restablecer zoom"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer border-l border-slate-200 pl-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cartesian Interactive Step Bar (When Cartesian Tab is active) */}
      {activeLayer === 'cartesian' && (
        <div className="bg-emerald-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-emerald-950">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#FFC700] uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              Simulación de Entrada Cartesiana:
            </span>
            <div className="flex bg-emerald-800 rounded-md p-0.5 border border-emerald-700">
              <button
                onClick={() => {
                  setCartesianTargetLayer('A');
                  setActiveStepIndex(0);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  cartesianTargetLayer === 'A' ? 'bg-[#FFC700] text-emerald-950' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Capa A
              </button>
              <button
                onClick={() => {
                  setCartesianTargetLayer('B');
                  setActiveStepIndex(0);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  cartesianTargetLayer === 'B' ? 'bg-[#FFC700] text-emerald-950' : 'text-emerald-200 hover:text-white'
                }`}
              >
                Capa B (Capitulada)
              </button>
            </div>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveStepIndex(p => Math.max(0, p - 1))}
              disabled={activeStepIndex === 0}
              className="p-1 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
              title="Paso anterior"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPlayingCartesian(v => !v)}
              className="px-2.5 py-1 rounded bg-[#FFC700] text-emerald-950 hover:bg-amber-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              {isPlayingCartesian ? (
                <>
                  <Pause className="w-3 h-3 fill-current" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" /> Reproducir
                </>
              )}
            </button>
            <button
              onClick={() => setActiveStepIndex(p => Math.min(currentCartesianGroups.length - 1, p + 1))}
              disabled={activeStepIndex >= currentCartesianGroups.length - 1}
              className="p-1 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
              title="Siguiente paso"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setActiveStepIndex(0);
                setIsPlayingCartesian(false);
              }}
              className="p-1 rounded bg-emerald-800 hover:bg-emerald-700 cursor-pointer ml-1"
              title="Reiniciar secuencia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current step pill indicators */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
            {currentCartesianGroups.map((grp, idx) => (
              <button
                key={grp.step}
                onClick={() => {
                  setActiveStepIndex(idx);
                  setIsPlayingCartesian(false);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  activeStepIndex === idx
                    ? 'bg-[#FFC700] text-emerald-950 ring-2 ring-white'
                    : idx < activeStepIndex
                    ? 'bg-emerald-700 text-emerald-200'
                    : 'bg-emerald-800/80 text-emerald-400 hover:text-white'
                }`}
              >
                P{grp.step}: {grp.boxesCount}c
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SVG Canvas Area */}
      <div className="p-4 sm:p-6 bg-[#F8FAF9] flex-1 flex flex-col items-center justify-center min-h-[440px] overflow-auto">
        <div
          className="transition-transform duration-150 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-[720px] max-w-full drop-shadow-md select-none"
            style={{ minWidth: '500px' }}
          >
            <defs>
              {/* Wood pattern for pallet border */}
              <pattern id="woodPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#E6D7B8" />
                <line x1="0" y1="20" x2="40" y2="20" stroke="#D3BF9A" strokeWidth="1" />
                <line x1="0" y1="0" x2="40" y2="0" stroke="#D3BF9A" strokeWidth="1" />
              </pattern>

              {/* Diagonal hatching for Chimney / Center Void */}
              <pattern id="chimneyHatch" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#E0F2FE" />
                <line x1="0" y1="0" x2="0" y2="16" stroke="#0284C7" strokeWidth="2.5" opacity="0.6" />
              </pattern>

              {/* Marker arrows for dimension lines */}
              <marker
                id="arrowEnd"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
              <marker
                id="arrowStart"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 10 1 L 0 5 L 10 9 z" fill="#475569" />
              </marker>
            </defs>

            {/* Shift content to center according to padding */}
            <g transform={`translate(${padL}, ${padT})`}>
              {/* 1. PALLET BASE SURFACE */}
              <rect
                x="0"
                y="0"
                width={PL}
                height={PW}
                fill="url(#woodPattern)"
                stroke="#8A734D"
                strokeWidth="5"
                rx="4"
              />

              {/* Pallet wood plank gaps */}
              {pallet.type === 'europeo' ? (
                <>
                  <line x1="0" y1={PW * 0.25} x2={PL} y2={PW * 0.25} stroke="#8A734D" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  <line x1="0" y1={PW * 0.5} x2={PL} y2={PW * 0.5} stroke="#8A734D" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  <line x1="0" y1={PW * 0.75} x2={PL} y2={PW * 0.75} stroke="#8A734D" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                </>
              ) : (
                <>
                  <line x1="0" y1={PW * 0.2} x2={PL} y2={PW * 0.2} stroke="#8A734D" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  <line x1="0" y1={PW * 0.4} x2={PL} y2={PW * 0.4} stroke="#8A734D" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  <line x1="0" y1={PW * 0.6} x2={PL} y2={PW * 0.6} stroke="#8A734D" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                  <line x1="0" y1={PW * 0.8} x2={PL} y2={PW * 0.8} stroke="#8A734D" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
                </>
              )}

              {/* Pallet stamp badge */}
              <text
                x="14"
                y="28"
                fontSize="20"
                fontWeight="900"
                fontFamily="Ubuntu, sans-serif"
                fill="#8A734D"
                opacity="0.5"
              >
                {pallet.type === 'europeo' ? 'EPAL / EUR 1200×800' : 'ISO UNIVERSAL 1200×1000'} · 0 mm Saliente
              </text>

              {/* 2. CHIMNEY / CENTRAL VOID CALLOUTS (Huecos en el centro según estándar cartesiano) */}
              {currentChimneyHoles.map((hole, hIdx) => (
                <g key={`chimney-${hIdx}`}>
                  <rect
                    x={hole.x + 2}
                    y={hole.y + 2}
                    width={Math.max(4, hole.width - 4)}
                    height={Math.max(4, hole.height - 4)}
                    fill="url(#chimneyHatch)"
                    stroke="#0284C7"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                    rx="3"
                  />
                  {hole.width >= 70 && hole.height >= 50 && (
                    <g>
                      <rect
                        x={hole.x + hole.width / 2 - 130}
                        y={hole.y + hole.height / 2 - 20}
                        width="260"
                        height="40"
                        fill="white"
                        stroke="#0284C7"
                        strokeWidth="1.5"
                        rx="4"
                        opacity="0.95"
                      />
                      <text
                        x={hole.x + hole.width / 2}
                        y={hole.y + hole.height / 2 - 3}
                        fontSize="15"
                        fontWeight="bold"
                        fill="#0369A1"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        HUECO CENTRAL / CHIMENEA
                      </text>
                      <text
                        x={hole.x + hole.width / 2}
                        y={hole.y + hole.height / 2 + 13}
                        fontSize="13"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill="#0284C7"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {hole.width} × {hole.height} mm (Aireación)
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {/* 3. OVERLAY MODE */}
              {activeLayer === 'overlay' && (
                <>
                  {mosaic.layerA.map(b => (
                    <g key={`ov-a-${b.id}`}>
                      <rect
                        x={b.x + 3}
                        y={b.y + 3}
                        width={b.w - 6}
                        height={b.h - 6}
                        fill="#A5D6A7"
                        stroke="#2E7D32"
                        strokeWidth="2"
                        opacity="0.65"
                        rx="3"
                      />
                      <text
                        x={b.x + b.w / 2}
                        y={b.y + b.h / 2}
                        fontSize="32"
                        fontWeight="bold"
                        fill="#1B5E20"
                        textAnchor="middle"
                        dominantBaseline="central"
                        opacity="0.8"
                      >
                        A{b.id}
                      </text>
                    </g>
                  ))}
                  {mosaic.layerB.map(b => (
                    <g key={`ov-b-${b.id}`}>
                      <rect
                        x={b.x + 4}
                        y={b.y + 4}
                        width={b.w - 8}
                        height={b.h - 8}
                        fill="#FFE082"
                        stroke="#E65100"
                        strokeWidth="3.5"
                        strokeDasharray="10,6"
                        opacity="0.75"
                        rx="3"
                      />
                      <text
                        x={b.x + b.w / 2}
                        y={b.y + b.h / 2}
                        fontSize="36"
                        fontWeight="bold"
                        fill="#BF360C"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        B{b.id}
                      </text>
                    </g>
                  ))}
                </>
              )}

              {/* 4. NORMAL OR CARTESIAN MODE */}
              {activeLayer !== 'overlay' &&
                currentPlacements.map(b => {
                  const isHovered = hoveredBox?.id === b.id;

                  // Cartesian highlight logic
                  let isCurrentCartesianStep = false;
                  let isPastCartesianStep = false;
                  if (activeLayer === 'cartesian') {
                    if (activeCartesianGroup) {
                      isCurrentCartesianStep = activeCartesianGroup.boxIds.includes(b.id);
                    }
                    // Has this box already been placed in an earlier step?
                    for (let s = 0; s < activeStepIndex; s++) {
                      if (currentCartesianGroups[s]?.boxIds.includes(b.id)) {
                        isPastCartesianStep = true;
                        break;
                      }
                    }
                  }

                  let boxFill = activeLayer === 'layerB'
                    ? b.rotated ? '#4DB6AC' : '#80CBC4'
                    : b.rotated ? '#81C784' : '#A5D6A7';

                  let boxStroke = activeLayer === 'layerB' ? '#004D40' : '#1B5E20';
                  let strokeWidth = '2.5';
                  let opacity = 1;

                  if (activeLayer === 'cartesian') {
                    if (isCurrentCartesianStep) {
                      boxFill = '#FDE047'; // bright gold for current batch
                      boxStroke = '#854D0E';
                      strokeWidth = '4.5';
                    } else if (isPastCartesianStep) {
                      boxFill = b.rotated ? '#81C784' : '#A5D6A7';
                      boxStroke = '#1B5E20';
                      strokeWidth = '2.5';
                    } else {
                      // Future box not yet placed
                      boxFill = '#E2E8F0';
                      boxStroke = '#94A3B8';
                      strokeWidth = '1.5';
                      opacity = 0.45;
                    }
                  } else if (isHovered) {
                    boxFill = '#FFD54F';
                    boxStroke = '#FF6F00';
                    strokeWidth = '4';
                  }

                  return (
                    <g
                      key={`box-${b.id}`}
                      onMouseEnter={() => setHoveredBox(b)}
                      onMouseLeave={() => setHoveredBox(null)}
                      className="cursor-pointer transition-all"
                      opacity={opacity}
                    >
                      <rect
                        x={b.x + 3}
                        y={b.y + 3}
                        width={b.w - 6}
                        height={b.h - 6}
                        fill={boxFill}
                        stroke={boxStroke}
                        strokeWidth={strokeWidth}
                        rx="4"
                      />

                      {/* Box Number */}
                      <text
                        x={b.x + b.w / 2}
                        y={b.y + b.h / 2 - 12}
                        fontSize={Math.min(46, Math.floor(Math.min(b.w, b.h) * 0.28))}
                        fontWeight="800"
                        fontFamily="monospace"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isCurrentCartesianStep ? '#713F12' : isHovered ? '#B71C1C' : '#143818'}
                      >
                        {activeLayer === 'layerB' ? `B${b.id}` : `A${b.id}`}
                      </text>

                      {/* Box dimensions label inside box */}
                      <text
                        x={b.x + b.w / 2}
                        y={b.y + b.h / 2 + 18}
                        fontSize={Math.min(24, Math.floor(Math.min(b.w, b.h) * 0.17))}
                        fontWeight="600"
                        fontFamily="monospace"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isCurrentCartesianStep ? '#854D0E' : '#2E7D32'}
                      >
                        {b.w} × {b.h} mm
                      </text>

                      {/* Rotation icon / orientation indicator */}
                      {b.rotated && (
                        <circle
                          cx={b.x + 18}
                          cy={b.y + 18}
                          r="9"
                          fill="#388E3C"
                          opacity="0.85"
                        />
                      )}
                    </g>
                  );
                })}

              {/* 5. CARTESIAN INFEED ARROW OVERLAY */}
              {activeLayer === 'cartesian' && activeCartesianGroup && (
                <g>
                  {/* Visual bounding outline of active robot pick group */}
                  <rect
                    x={activeCartesianGroup.startX}
                    y={activeCartesianGroup.startY}
                    width={activeCartesianGroup.spanW}
                    height={activeCartesianGroup.spanH}
                    fill="none"
                    stroke="#EAB308"
                    strokeWidth="4"
                    strokeDasharray="8,6"
                    rx="6"
                  />
                  {/* Robot Infeed Badge */}
                  <g transform={`translate(${activeCartesianGroup.startX + activeCartesianGroup.spanW / 2 - 80}, ${Math.max(10, activeCartesianGroup.startY - 36)})`}>
                    <rect width="160" height="30" fill="#005C2E" rx="6" />
                    <text x="80" y="20" fontSize="13" fontWeight="bold" fill="#FFC700" textAnchor="middle">
                      ▼ ENTRADA GARRA (Paso {activeCartesianGroup.step})
                    </text>
                  </g>
                </g>
              )}

              {/* 6. TECHNICAL DIMENSION LINES (COTAS) */}
              {/* Bottom Pallet Length Cota (X axis) */}
              <g transform={`translate(0, ${PW + 35})`}>
                <line
                  x1="0"
                  y1="0"
                  x2={PL}
                  y2="0"
                  stroke="#334155"
                  strokeWidth="2"
                  markerStart="url(#arrowStart)"
                  markerEnd="url(#arrowEnd)"
                />
                <line x1="0" y1="-25" x2="0" y2="8" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1={PL} y1="-25" x2={PL} y2="8" stroke="#94A3B8" strokeWidth="1.5" />
                <text
                  x={PL / 2}
                  y="22"
                  fontSize="28"
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill="#0F172A"
                  textAnchor="middle"
                >
                  Largo Palet: {PL} mm
                </text>
              </g>

              {/* Left Pallet Width Cota (Y axis) */}
              <g transform="translate(-40, 0)">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={PW}
                  stroke="#334155"
                  strokeWidth="2"
                  markerStart="url(#arrowStart)"
                  markerEnd="url(#arrowEnd)"
                />
                <line x1="-8" y1="0" x2="25" y2="0" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="-8" y1={PW} x2="25" y2={PW} stroke="#94A3B8" strokeWidth="1.5" />
                <text
                  x="-20"
                  y={PW / 2}
                  fontSize="28"
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill="#0F172A"
                  textAnchor="middle"
                  transform={`rotate(-90, -20, ${PW / 2})`}
                >
                  Ancho Palet: {PW} mm
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Viewer Footer Legend & Tooltip */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#A5D6A7] border border-[#2E7D32]" />
            <span>Caja Longitudinal ({box.length}×{box.width} mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#81C784] border border-[#1B5E20]" />
            <span>Caja Girada 90° ({box.width}×{box.length} mm)</span>
          </div>
          {currentChimneyHoles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#E0F2FE] border border-[#0284C7]" />
              <span>Hueco / Chimenea Central de Aireación</span>
            </div>
          )}
          {activeLayer === 'cartesian' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#FDE047] border border-[#854D0E]" />
              <span>Lote Activo Garra Cartesiana (Paso {activeCartesianGroup?.step})</span>
            </div>
          )}
        </div>

        {/* Hovered Box Details */}
        {hoveredBox ? (
          <div className="font-mono text-xs bg-white px-2.5 py-1 rounded border border-slate-200 font-medium text-slate-800">
            Caja #{hoveredBox.id}: Posición X={hoveredBox.x}mm, Y={hoveredBox.y}mm ({hoveredBox.w}×{hoveredBox.h} mm)
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">
            Pasa el cursor sobre cualquier caja para ver cotas exactas
          </div>
        )}
      </div>

      {/* DETAILED CARTESIAN PALLETIZING SECTION & INFEED BREAKDOWN */}
      <div className="border-t border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        {/* Engineering Logistics Confirmation Banner */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-950 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-sky-900 text-sm">
            <ShieldCheck className="w-4 h-4 text-sky-700" />
            <span>Comprobación Técnica (Fuentes de Ingeniería Logística y Paletizado Cartesiano):</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            <strong>Confirmado:</strong> En paletizadores cartesianos automáticos (con mesas de formación y empujador o garras lineales X-Y-Z), las cajas se colocan siempre <strong>enrasadas contra el perímetro exterior (0 mm saliente)</strong> sin dejar huecos en los bordes. Esto se debe a dos razones estructurales críticas:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
            <li>
              <strong>Apoyo perimetral en estanterías y rodillos:</strong> El peso debe transferirse a los largueros de rack y a los extremos de la tarima. Dejar huecos perimetrales causaría flexión o colapso exterior.
            </li>
            <li>
              <strong>Tensión de enfardado (Film estirable):</strong> El film ejerce compresión centrípeta; si el perímetro es continuo y compacto, resiste la tensión sin hundir las esquinas.
            </li>
            <li>
              <strong>Chimeneas y calles de aireación centrales:</strong> Cualquier holgura dimensional se canaliza hacia el centro del mosaico, creando el clásico patrón chimenea (ventilación vertical para cámaras frigoríficas y transporte).
            </li>
          </ul>
        </div>

        {/* Step-by-Step Cartesian Infeed Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#007A3D]" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Secuencia de Entrada de Grupos de Cajas para Paletizador Cartesiano (Capa {cartesianTargetLayer}):
              </h4>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total: {currentCartesianGroups.length} lotes de entrada · {mosaic.boxesPerLayer} cajas por capa
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left w-14">Paso</th>
                  <th className="px-3 py-2 text-left">Ubicación Perimetral</th>
                  <th className="px-3 py-2 text-center">Cajas</th>
                  <th className="px-3 py-2 text-left">Lote / Orientación</th>
                  <th className="px-3 py-2 text-left">Acción Garra / Empujador</th>
                  <th className="px-3 py-2 text-left">Coordenadas Palet (X, Y)</th>
                  <th className="px-3 py-2 text-left">Trayectoria Robot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentCartesianGroups.map((grp, idx) => {
                  const isActive = activeStepIndex === idx && activeLayer === 'cartesian';
                  return (
                    <tr
                      key={grp.step}
                      onClick={() => {
                        setActiveLayer('cartesian');
                        setActiveStepIndex(idx);
                        setIsPlayingCartesian(false);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-amber-50 font-semibold text-amber-950 ring-1 ring-amber-300'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="px-3 py-2 font-mono font-bold text-center">
                        <span className={`inline-block w-6 h-6 leading-6 rounded-full text-center ${
                          isActive ? 'bg-[#FFC700] text-emerald-950' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {grp.step}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold ${
                          grp.side.includes('Frontal') || grp.side.includes('Trasero') || grp.side.includes('Lateral')
                            ? 'text-emerald-800'
                            : 'text-sky-800'
                        }`}>
                          {grp.side}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold">
                        {grp.boxesCount} {grp.boxesCount === 1 ? 'caja' : 'cajas'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{grp.conveyorBatch}</div>
                        <div className="text-[11px] text-slate-500">
                          {grp.rotated ? 'Rotada 90° (Ancho en X)' : 'Longitudinal (Largo en X)'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {grp.gripperAction}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        {grp.depositRange}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600">
                        {grp.robotTrajectory}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
