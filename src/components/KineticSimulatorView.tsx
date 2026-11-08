/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Download, 
  Plus, 
  Trash2, 
  Sliders, 
  Sparkles, 
  FileSpreadsheet, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Scale,
  Bookmark,
  Save,
  FolderOpen,
  PieChart,
  Crown
} from 'lucide-react';
import { KineticFragranceMaterial, KineticSimulationOutput, SimulationSummaryRow } from '../types/kineticModel';
import { solveKineticModel, SimulationItemInput } from '../utils/kineticSolver';
import { findScientificMaterial, getAllScientificMaterials } from '../data/scientificDatabase';
import { KineticChart } from './KineticChart';
import { downloadDarAlKamalExcel } from '../utils/excelExporter';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';
import { MaterialSearchDropdown } from './MaterialSearchDropdown';

interface FormulaEntry {
  name: string;
  parts: number;
}

interface SavedExperiment {
  id: string;
  name: string;
  timestamp: string;
  formula: FormulaEntry[];
  dominantMaterial: string;
}

interface KineticSimulatorViewProps {
  onOpenScraper?: () => void;
  onOpenFeeder?: () => void;
  onOpenInteractions?: () => void;
  importedFormula?: FormulaEntry[];
}

const LOCAL_STORAGE_EXPERIMENTS_KEY = 'dar_alkamal_saved_experiments_v1';

export const KineticSimulatorView: React.FC<KineticSimulatorViewProps> = ({
  onOpenScraper,
  onOpenFeeder,
  onOpenInteractions,
}) => {
  const { language, isRtl } = useLanguage();

  // Formulation state (default matching Dar Al-Kamal Smart Brain)
  const [formula, setFormula] = useState<FormulaEntry[]>([
    { name: 'Limonene', parts: 25 },
    { name: 'Linalool', parts: 20 },
    { name: 'Hedione', parts: 30 },
    { name: 'Iso E Super', parts: 35 },
    { name: 'Ambroxan', parts: 10 },
  ]);

  const [selectedAddName, setSelectedAddName] = useState<string>('Vanillin');
  const [experimentName, setExperimentName] = useState(() => 
    language === 'ar' ? 'تجربة عطرية #1' : 'Perfume Trial #1'
  );
  const [savedExperiments, setSavedExperiments] = useState<SavedExperiment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EXPERIMENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Available materials from scientific DB
  const availableMaterials = useMemo(() => {
    return getAllScientificMaterials();
  }, []);

  const mappedScientificMaterials = useMemo(() => {
    return availableMaterials.map((m, idx) => ({
      id: idx + 1,
      nameEn: m.name,
      nameAr: m.nameAr || m.name,
      chemicalName: m.iupacName || m.name,
      cas: m.cas,
      pyramidNote: m.category,
      family: m.category,
    }));
  }, [availableMaterials]);

  // Run simulation
  const simulationResult = useMemo<KineticSimulationOutput>(() => {
    const items: SimulationItemInput[] = formula.map(entry => {
      const mat = findScientificMaterial(entry.name);
      if (mat) {
        return {
          material: mat.name,
          cas: mat.cas,
          parts: entry.parts,
          mw: mat.molecularWeight,
          p0: mat.vaporPressure,
          odt: mat.odt,
          odtUnit: mat.odtUnit,
          odtSource: mat.odtSource,
          confidence: mat.confidence,
        };
      }
      return {
        material: entry.name,
        cas: 'Unknown',
        parts: entry.parts,
        mw: 150.0,
        p0: 0.05,
        odt: 1.0,
        odtUnit: 'ng/L',
        odtSource: 'Estimated default',
        confidence: 'Estimated (QSAR/Physical)',
      };
    });

    return solveKineticModel(items, null, 100);
  }, [formula]);

  // Handle parts change
  const handlePartsChange = (idx: number, newParts: number) => {
    const updated = [...formula];
    updated[idx].parts = Math.max(0.1, newParts);
    setFormula(updated);
  };

  // Remove material
  const handleRemove = (idx: number) => {
    if (formula.length <= 1) {
      alert('يجب الإبقاء على مادة واحدة على الأقل في التركيبة');
      return;
    }
    setFormula(formula.filter((_, i) => i !== idx));
  };

  // Add material
  const handleAddMaterial = () => {
    const existing = formula.findIndex(f => f.name.toLowerCase() === selectedAddName.toLowerCase());
    if (existing >= 0) {
      const updated = [...formula];
      updated[existing].parts += 5;
      setFormula(updated);
    } else {
      setFormula([...formula, { name: selectedAddName, parts: 10 }]);
    }
  };

  // Quick preset accords
  const loadPreset = (type: 'citrus' | 'amber' | 'floral' | 'oriental') => {
    if (type === 'citrus') {
      setFormula([
        { name: 'Limonene', parts: 45 },
        { name: 'Linalyl acetate', parts: 20 },
        { name: 'Linalool', parts: 15 },
        { name: 'Hedione', parts: 15 },
        { name: 'Ambroxan', parts: 5 },
      ]);
    } else if (type === 'amber') {
      setFormula([
        { name: 'Bergamot oil FCF', parts: 20 },
        { name: 'Hedione', parts: 25 },
        { name: 'Iso E Super', parts: 35 },
        { name: 'Ambroxan', parts: 15 },
        { name: 'Vanillin', parts: 5 },
      ]);
    } else if (type === 'floral') {
      setFormula([
        { name: 'Linalool', parts: 20 },
        { name: 'Geraniol', parts: 15 },
        { name: 'Citronellol', parts: 15 },
        { name: 'Hedione', parts: 30 },
        { name: 'Galaxolide 50% IPM', parts: 20 },
      ]);
    } else if (type === 'oriental') {
      setFormula([
        { name: 'Cinnamic aldehyde', parts: 5 },
        { name: 'Eugenol', parts: 15 },
        { name: 'Hedione', parts: 20 },
        { name: 'Patchouli oil', parts: 25 },
        { name: 'Vanillin', parts: 15 },
        { name: 'Iso E Super', parts: 20 },
      ]);
    }
  };

  // Save current experiment
  const handleSaveExperiment = () => {
    const newExp: SavedExperiment = {
      id: String(Date.now()),
      name: experimentName.trim() || `تجربة ${new Date().toLocaleTimeString('ar-EG')}`,
      timestamp: new Date().toLocaleDateString('ar-EG'),
      formula: [...formula],
      dominantMaterial: simulationResult.peakOvMaterial,
    };

    const updated = [newExp, ...savedExperiments.filter(e => e.name !== newExp.name)];
    setSavedExperiments(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_EXPERIMENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setSaveMessage(`تم حفظ التجربة "${newExp.name}" في السجل المحلي بنجاح!`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Load saved experiment
  const handleLoadExperiment = (exp: SavedExperiment) => {
    setFormula(exp.formula);
    setExperimentName(exp.name);
    setSaveMessage(`تم تحميل تركيبة "${exp.name}" إلى المحاكي.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Delete saved experiment
  const handleDeleteExperiment = (id: string) => {
    const updated = savedExperiments.filter(e => e.id !== id);
    setSavedExperiments(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_EXPERIMENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Excel download
  const handleDownloadExcel = () => {
    downloadDarAlKamalExcel(simulationResult, 'Dar_AlKamal_Kinetic_Simulation');
  };

  const finalMassMg = simulationResult.timeGridPoints[simulationResult.timeGridPoints.length - 1]?.totalMass ?? 10.0;

  // -------------------------------------------------------------
  // DYNAMIC DOMINANCE & CATEGORY EVOLUTION TIMELINE (0h, 2h, 6h, 12h, 24h)
  // Inspiring replacement for Perfumer's Workbook static 2D radar!
  // -------------------------------------------------------------
  const milestonesHours = [0, 2, 6, 12, 24];

  const dominanceEvolution = useMemo(() => {
    const points = simulationResult.timeGridPoints;
    if (!points || points.length === 0) return [];

    return milestonesHours.map(targetHour => {
      // Find closest time point in grid
      let closestPoint = points[0];
      let minDiff = Math.abs(points[0].timeHours - targetHour);
      for (const p of points) {
        const diff = Math.abs(p.timeHours - targetHour);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = p;
        }
      }

      // Find dominant material with max OV
      let maxOv = -1;
      let dominantMat = 'None';
      let totalMilestoneOv = 0;

      let topOv = 0;
      let heartOv = 0;
      let baseOv = 0;

      for (const [mat, ov] of Object.entries(closestPoint.materialsOv)) {
        if (ov > maxOv) {
          maxOv = ov;
          dominantMat = mat;
        }
        totalMilestoneOv += ov;

        const info = findScientificMaterial(mat);
        const cat = info?.category || 'Heart';
        if (cat === 'Top') topOv += ov;
        else if (cat === 'Base') baseOv += ov;
        else heartOv += ov;
      }

      const topPct = totalMilestoneOv > 0 ? Math.round((topOv / totalMilestoneOv) * 100) : 0;
      const heartPct = totalMilestoneOv > 0 ? Math.round((heartOv / totalMilestoneOv) * 100) : 0;
      const basePct = totalMilestoneOv > 0 ? Math.round((baseOv / totalMilestoneOv) * 100) : 0;

      const phaseName = 
        targetHour === 0 ? (language === 'ar' ? 'انطلاق القمة الفوري (Top Flash)' : 'Initial Top Flash (0h)') :
        targetHour === 2 ? (language === 'ar' ? 'مرحلة تطور القلب (Heart Blooming)' : 'Heart Note Blooming (2h)') :
        targetHour === 6 ? (language === 'ar' ? 'سيادة قلب العطر (Core Body)' : 'Core Fragrance Body (6h)') :
        targetHour === 12 ? (language === 'ar' ? 'مرحلة الجفاف (Drydown Base)' : 'Drydown Base Phase (12h)') :
        (language === 'ar' ? 'المثبتات الدائمة (Fixative Trail)' : 'Fixative Trail (24h)');

      return {
        hour: targetHour,
        phaseName,
        dominantMat,
        maxOv,
        totalOv: totalMilestoneOv,
        topPct,
        heartPct,
        basePct,
      };
    });
  }, [simulationResult, language]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Kinetic Engine Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <span>
                  {language === 'ar' 
                    ? 'محرك الحركية الفيزيائية وقيم الرائحة (Dar Al-Kamal Kinetic Engine)'
                    : 'Dar Al-Kamal Physical Kinetics & Odor Value Engine'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ODE Runge-Kutta / LSODA
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-1 max-w-3xl leading-relaxed">
                {language === 'ar' ? (
                  <>
                    نمذجة تبخر المكونات العطرية على جلد الإنسان عند <strong className="text-stone-200">32°C (305.15 K)</strong> وحساب انتشار الـ Headspace وقيم الرائحة <strong className="text-amber-300">Odor Value (OV)</strong> بدقة علمية تتجاوز النماذج الثابتة السطحية مثل Perfumer's Workbook.
                  </>
                ) : (
                  <>
                    Simulates dynamic evaporation on human skin at <strong className="text-stone-200">32°C (305.15 K)</strong>, calculating headspace vapor diffusion and <strong className="text-amber-300">Odor Value (OV)</strong> with rigorous physical chemistry beyond static 2D tools.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenScraper && (
              <button
                type="button"
                onClick={onOpenScraper}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'ar' ? 'استيراد قائمة أو ملف' : 'Import List / File'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
              title={language === 'ar' ? 'تصدير ملف إكسل مطابق لبرنامج ديسكتوب دار الكمال' : 'Export 3-Sheet Excel matching Dar Al-Kamal Desktop'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{language === 'ar' ? 'تصدير Excel ثلاثي الأوراق' : 'Export 3-Sheet Excel'}</span>
            </button>
          </div>
        </div>

        {/* Preset Accords */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 font-semibold ml-1">
            {language === 'ar' ? 'أكوردات حركية نموذجية:' : 'Benchmark Kinetic Accords:'}
          </span>
          <button
            onClick={() => loadPreset('amber')}
            className="px-3 py-1 bg-stone-950/70 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-800 text-[11px] font-bold"
          >
            Woody Amber (Ambroxan + Iso E + Hedione)
          </button>
          <button
            onClick={() => loadPreset('citrus')}
            className="px-3 py-1 bg-stone-950/70 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-800 text-[11px] font-bold"
          >
            Fresh Citrus Flash (Limonene Evaporation)
          </button>
          <button
            onClick={() => loadPreset('floral')}
            className="px-3 py-1 bg-stone-950/70 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-800 text-[11px] font-bold"
          >
            White Floral Heart (Linalool + Geraniol + Musk)
          </button>
          <button
            onClick={() => loadPreset('oriental')}
            className="px-3 py-1 bg-stone-950/70 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-800 text-[11px] font-bold"
          >
            Spicy Oriental Fixation (Cinnamic + Patchouli + Vanillin)
          </button>
        </div>
      </div>

      {/* Main Kinetic Chart */}
      <KineticChart simulation={simulationResult} />

      {/* NEW: DYNAMIC DOMINANCE & CATEGORY EVOLUTION TIMELINE */}
      {/* Inspired by the user's ambition to observe who dominates and what category rules over time */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>
                  {language === 'ar'
                    ? 'تحليل الهيمنة وتطور الفئات العطرية عبر الزمن (Dynamic Olfactory Dominance Tracker)'
                    : 'Dynamic Olfactory Dominance & Note Evolution Tracker'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Time-Evolution
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'ar'
                  ? 'من المادة المسيطرة شميّاً؟ وما الفئة الحاكمة للرائحة (Top / Heart / Base) في كل ساعة من عمر العطر على الجلد؟'
                  : 'Which molecule commands the sillage, and which category (Top / Heart / Base) dominates each hour?'}
              </p>
            </div>
          </div>

          <span className="text-[11px] text-stone-400 font-mono">
            {language === 'ar'
              ? 'مبني على قيم Odor Value الفعلية وليس مجرد أوزان افتراضية'
              : 'Computed from psychophysical Odor Values (OV) rather than static weights'}
          </span>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {dominanceEvolution.map((milestone) => {
            return (
              <div 
                key={milestone.hour}
                className="bg-stone-950/80 border border-stone-800 hover:border-amber-500/40 rounded-xl p-3.5 space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {milestone.hour === 0 
                      ? (language === 'ar' ? 'عند البدء (t = 0h)' : 'Initial (t = 0h)')
                      : (language === 'ar' ? `بعد ${milestone.hour} ساعة` : `After ${milestone.hour} hours`)}
                  </span>
                  <MetricTooltip type="ov" showIcon={false}>
                    <span className="text-[10px] text-stone-400 font-mono cursor-help">
                      OV: {milestone.totalOv > 1000 ? milestone.totalOv.toExponential(1) : milestone.totalOv.toFixed(0)}
                    </span>
                  </MetricTooltip>
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 block">{milestone.phaseName}</span>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5 mt-0.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{milestone.dominantMat}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                    {language === 'ar' ? 'قوة الرائحة:' : 'Intensity:'} {milestone.maxOv > 1000 ? milestone.maxOv.toExponential(1) : milestone.maxOv.toFixed(1)} OV
                  </span>
                </div>

                {/* Category Share Stack Bar */}
                <div className="space-y-1 pt-1 border-t border-stone-900">
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span className="text-sky-400">Top {milestone.topPct}%</span>
                    <span className="text-rose-400">Heart {milestone.heartPct}%</span>
                    <span className="text-amber-400">Base {milestone.basePct}%</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-stone-900">
                    <div style={{ width: `${milestone.topPct}%` }} className="bg-sky-400 h-full" title={`Top Note: ${milestone.topPct}%`} />
                    <div style={{ width: `${milestone.heartPct}%` }} className="bg-rose-400 h-full" title={`Heart Note: ${milestone.heartPct}%`} />
                    <div style={{ width: `${milestone.basePct}%` }} className="bg-amber-400 h-full" title={`Base Note: ${milestone.basePct}%`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulation Table & Saved Experiments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Formula Composition & Dynamic Inputs (8 cols) */}
        <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'ar'
                    ? 'تركيبة العطر الخاضعة للنمذجة الفيزيائية (Formulation Matrix)'
                    : 'Fragrance Formula Subject to Kinetic ODE Modeling'}
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'ar'
                  ? 'حساب الكسر المولي (xᵢ) والضغط الجزئي (Pᵢ) ونسبة المساهمة في الفضاء الرأسي عند البدء (t = 0h)'
                  : 'Calculation of liquid mole fraction (xᵢ), partial vapor pressure (Pᵢ), and headspace contribution at initial time (t = 0h)'}
              </p>
            </div>

            {/* Add material selector */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-56 sm:w-72">
                <MaterialSearchDropdown
                  materials={mappedScientificMaterials}
                  selectedId={selectedAddName}
                  onSelect={(m) => setSelectedAddName(m.nameEn)}
                  accentColor="amber"
                  showDetails={false}
                />
              </div>

              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-stone-800 rounded-xl">
            <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5">{language === 'ar' ? 'المادة' : 'Material'}</th>
                  <th className="p-2.5">{language === 'ar' ? 'الأجزاء' : 'Parts'}</th>
                  <th className="p-2.5">
                    <MetricTooltip type="mw">
                      <span>MW</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">
                    <MetricTooltip type="p0">
                      <span>P₀ (mmHg)</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">
                    <MetricTooltip type="odt">
                      <span>ODT (ng/L)</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">
                    <MetricTooltip type="xi">
                      <span>{language === 'ar' ? 'الكسر xᵢ' : 'Mole Frac xᵢ'}</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">
                    <MetricTooltip type="headspace">
                      <span>{language === 'ar' ? 'بخار الرأس %' : 'Headspace %'}</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">
                    <span className="text-amber-400 font-bold">{language === 'ar' ? 'الكتلة (50مجم)' : 'Initial Mass'}</span>
                  </th>
                  <th className="p-2.5">
                    <span className="text-rose-400 font-bold">{language === 'ar' ? 'نقطة الموت (Zero Cut-off)' : 'Death Cut-off'}</span>
                  </th>
                  <th className="p-2.5">{language === 'ar' ? 'الموثوقية' : 'Confidence'}</th>
                  <th className="p-2.5 text-center">{language === 'ar' ? 'حذف' : 'Del'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                {simulationResult.summaryRows.map((row: SimulationSummaryRow, idx: number) => {
                  return (
                    <tr key={row.material} className="hover:bg-stone-850/60 transition-colors">
                      <td className="p-2.5 font-bold text-stone-200 font-sans">
                        <div>{row.material}</div>
                        <div className="text-[10px] text-stone-500">{row.cas}</div>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={row.parts}
                          onChange={(e) => handlePartsChange(idx, parseFloat(e.target.value) || 0.1)}
                          className="w-16 bg-stone-950 border border-stone-700 rounded px-2 py-1 text-amber-300 font-bold outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="p-2.5 text-stone-300">{row.mw.toFixed(1)}</td>
                      <td className="p-2.5 text-amber-300">{row.p0 < 0.001 ? row.p0.toExponential(2) : row.p0.toFixed(3)}</td>
                      <td className="p-2.5 text-emerald-300">{row.odt < 0.01 ? row.odt.toExponential(2) : row.odt.toFixed(2)}</td>
                      <td className="p-2.5 text-sky-300">{row.moleFraction.toFixed(3)}</td>
                      <td className="p-2.5 font-bold text-stone-200">
                        {row.vaporContributionPct.toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-amber-300 font-mono">
                        {row.initialMassMg ? `${row.initialMassMg.toFixed(2)} mg` : '-'}
                      </td>
                      <td className="p-2.5 font-mono">
                        {row.deathTimeMinutes !== undefined && row.deathTimeMinutes !== null ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {language === 'ar' ? `دقيقة ${row.deathTimeMinutes}` : `${row.deathTimeMinutes}m`} ({(row.deathTimeMinutes / 60).toFixed(1)}h)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {language === 'ar' ? 'مستمرة (>24h)' : 'Active (>24h)'}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-sans font-bold bg-stone-950 text-stone-300 border border-stone-800">
                          {row.confidence}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="p-1 rounded hover:bg-stone-800 text-stone-500 hover:text-red-400"
                          title={language === 'ar' ? 'حذف من التركيبة' : 'Remove from formula'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save Experiment Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 border-t border-stone-800/80">
            <input
              type="text"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder={language === 'ar' ? 'اسم التجربة لحفظها في الأرشيف...' : 'Experiment name to archive...'}
              className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleSaveExperiment}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'حفظ التجربة في السجل المحلي' : 'Save Experiment to Local Archive'}</span>
            </button>
          </div>

          {saveMessage && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

        </div>

        {/* Right: Thermodynamic Conditions & Saved Experiments Archive (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Solved Parameters Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-3 text-xs">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'شروط البيئة الفيزيائية والمعايرة الحركية' : 'Physical Environment & Kinetic Solvers'}</span>
              </h3>
              <p className="text-stone-400 text-[11px] mt-0.5">
                {language === 'ar' ? 'متغيرات معادلة هيرتز-كنودسن وقانون الغاز المثالي' : 'Hertz-Knudsen rate equation & Ideal Gas law parameters'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <MetricTooltip type="initialMass">
                  <span className="text-stone-400">{language === 'ar' ? 'الكتلة الابتدائية:' : 'Initial Scent Mass:'}</span>
                </MetricTooltip>
                <span className="font-mono text-stone-200">100.00 mg</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <MetricTooltip type="skinTemp">
                  <span className="text-stone-400">{language === 'ar' ? 'حرارة الجلد:' : 'Skin Surface Temp:'}</span>
                </MetricTooltip>
                <span className="font-mono text-stone-200">32.00 °C (305.15 K)</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <MetricTooltip type="k">
                  <span className="text-stone-400">{language === 'ar' ? 'معامل التبخر المحسوب k:' : 'Evaporation Constant k:'}</span>
                </MetricTooltip>
                <span className="font-mono font-bold text-amber-400">{simulationResult.calibratedK}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <MetricTooltip type="t90">
                  <span className="text-stone-400">{language === 'ar' ? 'المتبقي عند 24 ساعة (T90):' : 'Mass at 24h (T90):'}</span>
                </MetricTooltip>
                <span className="font-mono font-bold text-emerald-400">{finalMassMg.toFixed(2)} mg (10%)</span>
              </div>
            </div>

            {onOpenInteractions && (
              <button
                type="button"
                onClick={onOpenInteractions}
                className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{language === 'ar' ? 'فتح مختبر تفاعلات المصفوفة والتثبيت غير المثالي (Matrix γᵢ)' : 'Open Non-Ideal Matrix Lab & Fixation (γᵢ)'}</span>
              </button>
            )}

            {onOpenFeeder && (
              <button
                type="button"
                onClick={onOpenFeeder}
                className="w-full mt-2 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{language === 'ar' ? 'فتح مغذي البيانات والـ API لتسجيل مادة جديدة' : 'Open Smart Data Feeder & API Ingestion'}</span>
              </button>
            )}
          </div>

          {/* Saved Experiments Archive List */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? `أرشيف التجارب المحفوظة (${savedExperiments.length})` : `Saved Experiments Archive (${savedExperiments.length})`}</span>
              </h4>
            </div>

            {savedExperiments.length === 0 ? (
              <p className="text-[11px] text-stone-500 py-2">
                {language === 'ar'
                  ? 'لا توجد تجارب محفوظة حالياً. اكتب اسماً للتجربة واضغط "حفظ التجربة في السجل المحلي" للاحتفاظ بها.'
                  : 'No saved experiments yet. Enter a name and click "Save Experiment" to store it locally.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedExperiments.map(exp => (
                  <div key={exp.id} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-2">
                    <div className="overflow-hidden">
                      <div className="font-bold text-stone-200 truncate">{exp.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono flex items-center gap-2">
                        <span>{exp.formula.length} {language === 'ar' ? 'مواد' : 'mats'}</span>
                        <span>•</span>
                        <span className="text-amber-400">{language === 'ar' ? 'المسيطر:' : 'Dominant:'} {exp.dominantMaterial}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleLoadExperiment(exp)}
                        className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-[10px] font-bold"
                        title={language === 'ar' ? 'تحميل التجربة' : 'Load experiment'}
                      >
                        {language === 'ar' ? 'تحميل' : 'Load'}
                      </button>
                      <button
                        onClick={() => handleDeleteExperiment(exp.id)}
                        className="p-1 rounded text-stone-500 hover:text-red-400"
                        title={language === 'ar' ? 'حذف من الأرشيف' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
