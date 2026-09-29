import React, { useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Compass, Layers } from 'lucide-react';

export type StabilityMetricType = 'angulo_vuelco' | 'esbeltez' | 'traba_capitulado';

interface StabilityMetricTooltipProps {
  type: StabilityMetricType;
  currentValue?: number | string;
  className?: string;
}

export const StabilityMetricTooltip: React.FC<StabilityMetricTooltipProps> = ({
  type,
  currentValue,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getMetricData = () => {
    switch (type) {
      case 'angulo_vuelco':
        return {
          title: 'Ángulo Crítico de Vuelco (θ_crit)',
          subtitle: 'Estabilidad contra fuerzas centrífugas y frenadas',
          icon: <Compass className="w-4 h-4 text-emerald-600" />,
          definition:
            'Es el ángulo máximo de inclinación lateral (en grados) que puede experimentar el palet antes de que la proyección de su centro de gravedad sobrepase la arista de apoyo en la base y el palet vuelque.',
          good: {
            range: '≥ 28.0°',
            label: 'Bueno (Estable / Seguro)',
            desc: 'Centro de gravedad bajo y base amplia. Mínimo riesgo de vuelco dinámico en rotondas, curvas o maniobras de carretilla elevadora.',
          },
          medium: {
            range: '22.0° – 27.9°',
            label: 'Medio (Moderado)',
            desc: 'Estabilidad aceptable para transporte estándar. Obligatorio enfardado firme con film de 23 micras (mínimo 3 vueltas en la base).',
          },
          bad: {
            range: '< 22.0°',
            label: 'Malo (Crítico / Riesgo Vuelco)',
            desc: 'Centro de gravedad muy elevado. Alto peligro de vuelco. Se recomienda reducir 1 o 2 pisos de cajas o flejar la carga a la madera.',
          },
        };

      case 'esbeltez':
        return {
          title: 'Relación de Esbeltez (λ = H / Ancho Base)',
          subtitle: 'Proporción entre altura total y base de apoyo',
          icon: <Layers className="w-4 h-4 text-emerald-600" />,
          definition:
            'Cociente entre la altura total del palet consolidado (H) y la dimensión más estrecha de la base (800 mm en Europalet o 1000 mm en Americano). Mide si la carga es compacta o tiene forma de torre alta.',
          good: {
            range: 'λ ≤ 1.40',
            label: 'Bueno (Compacto y Rígido)',
            desc: 'Centro de masa muy cercano a la tarima. La carga apenas oscila frente a vibraciones del camión o baches de carretera.',
          },
          medium: {
            range: '1.41 – 1.85',
            label: 'Medio (Esbeltez Estándar)',
            desc: 'Formato habitual en gran distribución retail. Requiere film con pretensado correcto para evitar balanceos en los pisos altos.',
          },
          bad: {
            range: 'λ > 1.85',
            label: 'Malo (Muy Esbelto / Torre)',
            desc: 'Palet excesivamente alto respecto a su base. Propenso a desalineación de capas superiores; colocar cantoneras o reducir pisos.',
          },
        };

      case 'traba_capitulado':
        return {
          title: 'Traba de Capitulado (Solape entre Capas)',
          subtitle: 'Entrelazado mecánico entre pisos alternados',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
          definition:
            'Porcentaje de juntas verticales de una capa que quedan cubiertas y trabadas por el cuerpo sólido de las cajas de la capa siguiente (capas A y B contrapeadas), impidiendo que se abran columnas aisladas.',
          good: {
            range: '≥ 60% (hasta 100%)',
            label: 'Bueno / Excelente (Monolítico)',
            desc: 'Las juntas están cruzadas en su mayoría. El palet actúa como un único bloque estructural autoestable que no se desmorona.',
          },
          medium: {
            range: '30% – 59%',
            label: 'Medio (Traba Parcial)',
            desc: 'Existe solape pero algunas juntas coinciden. Se recomienda flejado perimetral o envoltura con cordón de refuerzo.',
          },
          bad: {
            range: '< 30% o 0%',
            label: 'Malo (Apilado en Columna)',
            desc: 'Sin traba mecánica entre pisos. Cada columna de cajas se mueve de forma independiente y puede abrirse en tránsito.',
          },
        };
    }
  };

  const data = getMetricData();

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-4 h-4 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-[#007A3D] flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden"
        title="Ver explicación técnica y valores Bueno / Medio / Malo"
        aria-label={`Información sobre ${data.title}`}
      >
        <Info className="w-3 h-3" />
      </button>

      {/* Floating Tooltip Card */}
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 sm:w-88 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs text-slate-800 space-y-2.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-start gap-2 border-b border-slate-100 pb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 shrink-0">
              {data.icon}
            </div>
            <div>
              <h5 className="font-bold text-slate-900 leading-tight">{data.title}</h5>
              <p className="text-[10px] text-slate-500">{data.subtitle}</p>
            </div>
          </div>

          {/* Definition */}
          <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
            {data.definition}
          </p>

          {/* Quality breakdown: Bueno, Medio, Malo */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Interpretación de Valores Logísticos:
            </span>

            {/* Bueno */}
            <div className="flex items-start gap-2 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#007A3D] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center justify-between gap-1">
                  <strong className="text-[11px] text-emerald-950 font-semibold">{data.good.label}</strong>
                  <span className="font-mono text-[10px] font-bold text-[#007A3D]">{data.good.range}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{data.good.desc}</p>
              </div>
            </div>

            {/* Medio */}
            <div className="flex items-start gap-2 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center justify-between gap-1">
                  <strong className="text-[11px] text-amber-950 font-semibold">{data.medium.label}</strong>
                  <span className="font-mono text-[10px] font-bold text-amber-700">{data.medium.range}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{data.medium.desc}</p>
              </div>
            </div>

            {/* Malo */}
            <div className="flex items-start gap-2 bg-red-50/80 p-2 rounded-lg border border-red-200/60">
              <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center justify-between gap-1">
                  <strong className="text-[11px] text-red-950 font-semibold">{data.bad.label}</strong>
                  <span className="font-mono text-[10px] font-bold text-red-700">{data.bad.range}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{data.bad.desc}</p>
              </div>
            </div>
          </div>

          {/* Current value pill if provided */}
          {currentValue !== undefined && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Valor actual de tu palet:</span>
              <span className="font-mono font-bold text-[#007A3D] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentValue}
              </span>
            </div>
          )}

          {/* Arrow indicator */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  );
};
