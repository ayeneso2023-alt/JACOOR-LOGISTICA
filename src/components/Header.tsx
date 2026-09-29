import React from 'react';
import { Package, Layers, PlusCircle, Printer, Boxes, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenNewModal: () => void;
  onPrint?: () => void;
  activeTab: 'mosaicos' | '3d' | 'alzado' | 'ficha';
  setActiveTab: (tab: 'mosaicos' | '3d' | 'alzado' | 'ficha') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewModal,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-[#007A3D] text-white shadow-md sticky top-0 z-40">
      {/* Top corporate bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand zone */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              {/* JACOOR LOGÍSTICA stylized logo badge */}
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1.5 shadow-inner">
                <div className="w-full h-full rounded-full bg-[#007A3D] flex items-center justify-center relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFC700] absolute -top-0.5 right-1 border-2 border-[#007A3D]" />
                  <Boxes className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-extrabold tracking-wider text-xl sm:text-2xl text-white font-['Ubuntu']">
                    JACOOR LOGÍSTICA
                  </span>
                  <span className="text-[#FFC700] text-xs font-bold tracking-widest uppercase">
                    Paletizado
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium hidden sm:block">
                  Optimizador de Paletizado, Mosaicos & Capas Capituladas
                </p>
              </div>
            </div>
          </div>

          {/* Navigation view tabs */}
          <nav className="hidden md:flex items-center bg-[#005c2e]/60 p-1 rounded-lg border border-emerald-600/30">
            <button
              onClick={() => setActiveTab('mosaicos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'mosaicos'
                  ? 'bg-white text-[#007A3D] shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-700/50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Mosaico 2D (Capas A/B)
            </button>
            <button
              onClick={() => setActiveTab('3d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === '3d'
                  ? 'bg-white text-[#007A3D] shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-700/50'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Palet 3D & Capitulado
            </button>
            <button
              onClick={() => setActiveTab('alzado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'alzado'
                  ? 'bg-white text-[#007A3D] shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Alzado de Pisos
            </button>
            <button
              onClick={() => setActiveTab('ficha')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'ficha'
                  ? 'bg-white text-[#007A3D] shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-700/50'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Ficha de Carga
            </button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewModal}
              className="px-3.5 py-2 text-xs font-bold text-[#005c2e] bg-[#FFC700] hover:bg-[#ffd100] active:scale-95 shadow-sm rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo Palet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab row */}
      <div className="md:hidden flex overflow-x-auto bg-[#006331] px-3 py-1.5 border-t border-emerald-600/40 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('mosaicos')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'mosaicos' ? 'bg-white text-[#007A3D]' : 'text-emerald-100'
          }`}
        >
          Mosaico 2D
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === '3d' ? 'bg-white text-[#007A3D]' : 'text-emerald-100'
          }`}
        >
          Palet 3D
        </button>
        <button
          onClick={() => setActiveTab('alzado')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'alzado' ? 'bg-white text-[#007A3D]' : 'text-emerald-100'
          }`}
        >
          Alzado Pisos
        </button>
        <button
          onClick={() => setActiveTab('ficha')}
          className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
            activeTab === 'ficha' ? 'bg-white text-[#007A3D]' : 'text-emerald-100'
          }`}
        >
          Ficha Carga
        </button>
      </div>
    </header>
  );
};
