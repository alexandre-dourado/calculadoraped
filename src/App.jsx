import React, { useState, useMemo } from 'react';
import { AlertTriangle, Syringe, ShieldCheck } from 'lucide-react';
import db from './data/db.json';

export default function App() {
  const [weight, setWeight] = useState('');
  const [selectedId, setSelectedId] = useState(db.farmacos[0].id);

  const selectedDrug = db.farmacos.find(f => f.id === selectedId);

  // Engine de Cálculo com Travas de Segurança
  const result = useMemo(() => {
    if (!selectedDrug) return null;
    if (selectedDrug.calculo_tipo === 'bloqueado') {
      return { isBlocked: true, alert: selectedDrug.alertas_seguranca };
    }
    
    const w = parseFloat(weight.replace(',', '.'));
    if (!w || isNaN(w) || w <= 0) return null;

    let dose = 0;
    let unit = '';
    let isCapped = false;

    if (selectedDrug.calculo_tipo === 'gotas_por_kg') {
      dose = Math.round(w * selectedDrug.calculo_fator);
      if (dose > selectedDrug.max_dose_unidade) {
        dose = selectedDrug.max_dose_unidade;
        isCapped = true;
      }
      unit = 'gotas';
    } 
    else if (selectedDrug.calculo_tipo === 'peso_dividido_por') {
      dose = w / selectedDrug.calculo_fator;
      
      // Auditoria de Teto Diário (mg)
      const daily_mg = dose * selectedDrug.concentracao_mg_ml * (24 / selectedDrug.frequencia_h);
      if (daily_mg > selectedDrug.max_dose_diaria_mg) {
        const max_dose_mg = selectedDrug.max_dose_diaria_mg / (24 / selectedDrug.frequencia_h);
        dose = max_dose_mg / selectedDrug.concentracao_mg_ml;
        isCapped = true;
      }
      unit = 'mL';
      dose = dose.toFixed(1); // Arredonda mL para 1 casa decimal
    }

    return { dose, unit, isCapped, isBlocked: false };
  }, [weight, selectedDrug]);

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center items-start p-4 md:p-8 font-sans text-stone-900">
      <main className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Header Swiss Style */}
        <div className="bg-stone-900 p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Syringe size={20} className="text-emerald-400" />
            <h1 className="font-bold tracking-tight text-xl">Dose Pro</h1>
          </div>
          <p className="text-stone-400 text-sm font-medium">Calculadora Pediátrica</p>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Input de Peso Brutalista */}
          <div>
            <label className="block text-sm font-bold tracking-wide uppercase text-stone-500 mb-2">Peso do Paciente (KG)</label>
            <input 
              type="number" 
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 12.5"
              className="w-full text-5xl font-black text-stone-900 bg-stone-50 border-b-4 border-stone-300 focus:border-emerald-500 outline-none p-2 py-4 transition-colors placeholder:text-stone-300"
            />
          </div>

          {/* Seleção de Fármaco */}
          <div>
            <label className="block text-sm font-bold tracking-wide uppercase text-stone-500 mb-2">Fármaco</label>
            <select 
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full p-4 text-lg font-bold bg-stone-100 rounded-xl border-2 border-stone-200 focus:border-emerald-500 outline-none appearance-none cursor-pointer"
            >
              {db.farmacos.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          {/* Display de Resultado Reativo */}
          <div className="min-h-[160px]">
            {result?.isBlocked ? (
              <div className="bg-red-50 border-l-8 border-red-600 p-5 rounded-r-xl">
                <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                  <AlertTriangle size={24} /> ALERTA CRÍTICO
                </div>
                <p className="text-red-900 font-medium leading-snug">{result.alert}</p>
              </div>
            ) : result && weight > 0 ? (
              <div className={`p-6 rounded-2xl border-2 ${result.isCapped ? 'bg-amber-50 border-amber-400' : 'bg-emerald-50 border-emerald-400'}`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold uppercase tracking-wider text-stone-500">Dose a Administrar</p>
                  <span className="bg-stone-900 text-white text-xs px-2 py-1 rounded-md font-bold">{selectedDrug.frequencia_h}/{selectedDrug.frequencia_h}h</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black tracking-tighter ${result.isCapped ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {result.dose}
                  </span>
                  <span className="text-2xl font-bold text-stone-600">{result.unit}</span>
                </div>
                
                {result.isCapped ? (
                  <div className="mt-4 flex gap-2 items-start text-amber-700 text-sm font-bold bg-amber-100 p-3 rounded-lg">
                    <ShieldCheck size={20} className="shrink-0" />
                    <p>Dose reduzida automaticamente pelo sistema para respeitar o limite máximo diário de segurança.</p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-stone-600 font-medium">Via: <strong>{selectedDrug.via}</strong></p>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-400 font-medium border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center">
                Insira o peso do paciente para calcular a dose imediatamente.
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}