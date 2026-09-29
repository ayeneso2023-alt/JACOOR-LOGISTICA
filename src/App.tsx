/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PalletType, BoxDimensions, PALLET_CONFIGS, MosaicPattern, PalletCalculationResult } from './types/pallet';
import { generatePalletMosaics, calculatePalletMetrics } from './utils/mosaicGenerator';
import { Header } from './components/Header';
import { WizardModal } from './components/WizardModal';
import { SidebarControls } from './components/SidebarControls';
import { MetricsCards } from './components/MetricsCards';
import { MosaicSelectorList } from './components/MosaicSelectorList';
import { Mosaic2DViewer } from './components/Mosaic2DViewer';
import { Pallet3DViewer } from './components/Pallet3DViewer';
import { PalletElevationView } from './components/PalletElevationView';
import { PrintablePalletSheet } from './components/PrintablePalletSheet';
import { Sparkles, PackageCheck, Layers, Boxes, Printer, Info } from 'lucide-react';

export default function App() {
  // 1. Initial State
  const [palletType, setPalletType] = useState<PalletType>('europeo');
  const [box, setBox] = useState<BoxDimensions>({
    length: 400,
    width: 300,
    height: 180,
    weight: 8.5,
  });
  const [layersCount, setLayersCount] = useState<number>(6);
  const [activeTab, setActiveTab] = useState<'mosaicos' | '3d' | 'alzado' | 'ficha'>('mosaicos');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [selectedMosaicId, setSelectedMosaicId] = useState<string>('');

  const currentPallet = PALLET_CONFIGS[palletType];

  // 2. Generate all valid mosaics
  const allMosaics = useMemo(() => {
    return generatePalletMosaics(currentPallet, box);
  }, [currentPallet, box]);

  // 3. Resolve active selected mosaic
  const selectedMosaic = useMemo<MosaicPattern | null>(() => {
    if (allMosaics.length === 0) return null;
    const found = allMosaics.find(m => m.id === selectedMosaicId);
    return found || allMosaics[0];
  }, [allMosaics, selectedMosaicId]);

  // 4. Calculate total metrics
  const metrics = useMemo<PalletCalculationResult | null>(() => {
    if (!selectedMosaic) return null;
    const calc = calculatePalletMetrics(currentPallet, box, layersCount, selectedMosaic, allMosaics);
    return {
      pallet: currentPallet,
      box,
      layersCount,
      selectedMosaic,
      allMosaics,
      ...calc,
    };
  }, [currentPallet, box, layersCount, selectedMosaic, allMosaics]);

  const handleResetToDefaults = () => {
    setPalletType('europeo');
    setBox({
      length: 400,
      width: 300,
      height: 180,
      weight: 8.5,
    });
    setLayersCount(6);
    if (allMosaics.length > 0) {
      setSelectedMosaicId(allMosaics[0].id);
    }
  };

  const handleWizardComplete = (newPallet: PalletType, newBox: BoxDimensions, newLayers: number) => {
    setPalletType(newPallet);
    setBox(newBox);
    setLayersCount(newLayers);
  };

  const handlePrint = () => {
    setActiveTab('ficha');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] flex flex-col text-slate-800">
      {/* Header */}
      <Header
        onOpenNewModal={() => setIsWizardOpen(true)}
        onPrint={handlePrint}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Notification Banner / Wizard launcher */}
        <div className="no-print bg-emerald-50 border border-emerald-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#007A3D] text-white flex items-center justify-center shrink-0 shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-['Ubuntu']">
                Configuración Activa: {currentPallet.name} ({currentPallet.standard})
              </h2>
              <p className="text-xs text-slate-600">
                Caja {box.length}×{box.width}×{box.height} mm ({box.weight} kg) · {layersCount} alturas · Mosaicos capitulados sin salientes (0 mm overhang).
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="text-xs font-bold text-[#005c2e] bg-[#FFC700] hover:bg-[#ffd100] active:scale-95 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Asistente Nuevo Palet</span>
          </button>
        </div>

        {/* View: Ficha de Carga (Print View) */}
        {activeTab === 'ficha' && metrics && (
          <PrintablePalletSheet
            metrics={metrics}
            onBack={() => setActiveTab('mosaicos')}
          />
        )}

        {/* Regular Interactive Views */}
        {activeTab !== 'ficha' && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            {metrics && <MetricsCards metrics={metrics} />}

            {/* Layout with Sidebar Controls + Visualization Area */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left Sidebar Controls */}
              <SidebarControls
                palletType={palletType}
                setPalletType={setPalletType}
                box={box}
                setBox={setBox}
                layers={layersCount}
                setLayers={setLayersCount}
                onResetToDefaults={handleResetToDefaults}
              />

              {/* Main Visualization Pane */}
              <div className="flex-1 w-full space-y-6">
                {/* Tab 1: 2D Mosaic Viewer */}
                {activeTab === 'mosaicos' && selectedMosaic && (
                  <div className="space-y-6">
                    <Mosaic2DViewer
                      mosaic={selectedMosaic}
                      pallet={currentPallet}
                      box={box}
                      stability={metrics?.stability}
                    />

                    {/* Possible Mosaics List Selector */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                      <MosaicSelectorList
                        mosaics={allMosaics}
                        selectedMosaic={selectedMosaic}
                        onSelectMosaic={m => setSelectedMosaicId(m.id)}
                        pallet={currentPallet}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: 3D Stack Viewer */}
                {activeTab === '3d' && selectedMosaic && (
                  <div className="space-y-6">
                    <Pallet3DViewer
                      mosaic={selectedMosaic}
                      pallet={currentPallet}
                      box={box}
                      layersCount={layersCount}
                    />

                    {/* Mosaics list under 3D view */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
                      <MosaicSelectorList
                        mosaics={allMosaics}
                        selectedMosaic={selectedMosaic}
                        onSelectMosaic={m => setSelectedMosaicId(m.id)}
                        pallet={currentPallet}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Side Elevation View */}
                {activeTab === 'alzado' && selectedMosaic && (
                  <div className="space-y-6">
                    <PalletElevationView
                      mosaic={selectedMosaic}
                      pallet={currentPallet}
                      box={box}
                      layersCount={layersCount}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#007A3D] font-['Ubuntu']">JACOOR LOGÍSTICA</span>
            <span aria-hidden="true">·</span>
            <span>Sistema de Optimización de Paletizado y Mosaicos Capitulados</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Europalet 1200×800 (25 kg)</span>
            <span aria-hidden="true">·</span>
            <span>Palet Americano 1200×1000 (30 kg)</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">0 mm Salientes</span>
          </div>
        </div>
      </footer>

      {/* Wizard Step-by-Step Modal */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialPalletType={palletType}
        initialBox={box}
        initialLayers={layersCount}
        onComplete={handleWizardComplete}
      />
    </div>
  );
}
