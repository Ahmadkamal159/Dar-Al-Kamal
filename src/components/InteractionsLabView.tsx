import React, { useState, useMemo } from 'react';
import { 
  Atom, 
  FlaskConical, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  ArrowRightLeft, 
  Clock, 
  Activity, 
  Layers, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  Droplets,
  Scale
} from 'lucide-react';
import { ALL_MATERIALS } from '../data/materialsData';
import { findScientificMaterial } from '../data/scientificDatabase';
import { MaterialSearchDropdown } from './MaterialSearchDropdown';
import { 
  computeMixtureActivityCoefficients, 
  simulateEthanolFlashKinetics, 
  detectSchiffBaseReactions, 
  evaluatePairwiseInteraction,
  getMaterialProfile,
  ActivityCoefficientResult
} from '../utils/matrixInteractionModel';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';

export interface InteractionIngredient {
  materialId: number;
  parts: number;
}

export const InteractionsLabView: React.FC = () => {
  const { language, isRtl, t } = useLanguage();

  // Formula state for interaction modeling
  const [ingredients, setIngredients] = useState<InteractionIngredient[]>([
    { materialId: 51, parts: 25 }, // D limonene (Terpene)
    { materialId: 37, parts: 20 }, // Linalool (Terpene alcohol)
    { materialId: 40, parts: 20 }, // Hedione (Heart dipole)
    { materialId: 41, parts: 25 }, // Iso E Super (Heavy fixative)
    { materialId: 25, parts: 10 }, // Ambroxan (Super fixative)
  ]);

  // Alcohol percentage slider (0% to 90%)
  const [ethanolPercent, setEthanolPercent] = useState<number>(80);
  const [selectedAddId, setSelectedAddId] = useState<number>(1);

  // Pairwise inspector state
  const [pairAId, setPairAId] = useState<number>(25); // Ambroxan
  const [pairBId, setPairBId] = useState<number>(51); // D limonene

  // Map to full items
  const mappedItems = useMemo(() => {
    return ingredients.map(ing => {
      const mat = ALL_MATERIALS.find(m => m.id === ing.materialId);
      const sci = findScientificMaterial(mat?.cas || mat?.nameEn || '');
      return {
        id: ing.materialId,
        cas: mat?.cas || sci?.cas || '0-0-0',
        name: language === 'ar' ? mat?.nameAr || mat?.nameEn || '' : mat?.nameEn || '',
        nameEn: mat?.nameEn || '',
        parts: ing.parts,
        mw: sci?.molecularWeight || 150,
        p0: sci?.vaporPressure || 0.01,
        pyramid: mat?.pyramidNote || 'Heart',
        family: mat?.family || 'Woody'
      };
    });
  }, [ingredients, language]);

  // Activity coefficients calculation
  const activityResults = useMemo(() => {
    return computeMixtureActivityCoefficients(mappedItems, ethanolPercent);
  }, [mappedItems, ethanolPercent]);

  // Ethanol flash kinetics
  const flashPoints = useMemo(() => {
    return simulateEthanolFlashKinetics(ethanolPercent, 32);
  }, [ethanolPercent]);

  // Schiff base reaction audit
  const schiffAudits = useMemo(() => {
    return detectSchiffBaseReactions(mappedItems);
  }, [mappedItems]);

  // Pairwise evaluation
  const pairwiseResult = useMemo(() => {
    const matA = ALL_MATERIALS.find(m => m.id === pairAId);
    const matB = ALL_MATERIALS.find(m => m.id === pairBId);
    return evaluatePairwiseInteraction(
      matA?.cas || '',
      language === 'ar' ? matA?.nameAr || matA?.nameEn || '' : matA?.nameEn || '',
      matB?.cas || '',
      language === 'ar' ? matB?.nameAr || matB?.nameEn || '' : matB?.nameEn || ''
    );
  }, [pairAId, pairBId, language]);

  // Presets
  const loadPreset = (presetType: 'aurantiol' | 'citrusWoody' | 'heavyFixative') => {
    if (presetType === 'aurantiol') {
      setIngredients([
        { materialId: 43, parts: 20 }, // Methyl anthranilate (Amine)
        { materialId: 78, parts: 30 }, // Hydroxycitronellal (Aldehyde)
        { materialId: 40, parts: 25 }, // Hedione
        { materialId: 41, parts: 25 }, // Iso E Super
      ]);
      setEthanolPercent(80);
    } else if (presetType === 'citrusWoody') {
      setIngredients([
        { materialId: 51, parts: 35 }, // D limonene
        { materialId: 108, parts: 15 }, // Alpha pinene
        { materialId: 41, parts: 30 }, // Iso E Super
        { materialId: 25, parts: 10 }, // Ambroxan
        { materialId: 29, parts: 10 }, // Galaxolide
      ]);
      setEthanolPercent(80);
    } else if (presetType === 'heavyFixative') {
      setIngredients([
        { materialId: 37, parts: 15 }, // Linalool
        { materialId: 41, parts: 35 }, // Iso E Super
        { materialId: 25, parts: 20 }, // Ambroxan
        { materialId: 29, parts: 20 }, // Galaxolide
        { materialId: 45, parts: 10 }, // Vanillin
      ]);
      setEthanolPercent(75);
    }
  };

  const handlePartsChange = (id: number, parts: number) => {
    setIngredients(ingredients.map(i => i.materialId === id ? { ...i, parts: Math.max(1, parts) } : i));
  };

  const handleRemove = (id: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter(i => i.materialId !== id));
  };

  const handleAdd = () => {
    if (ingredients.some(i => i.materialId === selectedAddId)) return;
    setIngredients([...ingredients, { materialId: selectedAddId, parts: 10 }]);
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase mb-3">
              <Atom className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>{language === 'ar' ? 'النمذجة الثرموديناميكية غير المثالية للمصفوفة العطرية' : 'Non-Ideal Thermodynamic Matrix Model'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight">
              {language === 'ar' ? 'تفاعلات وتأثيرات المواد المتبادلة (Intermolecular Interactions Lab)' : 'Intermolecular Matrix Interactions & Chemical Dynamics'}
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              {language === 'ar' 
                ? 'محاكاة علمية صارمة لقوى التجاذب والتثبيت (Fixation) والتنافر الانفجاري (Terpene Eviction Flash) وتأثير تبخر الإيثانول وقواعد شيف الكيميائية عند 32°C على جلد الإنسان.' 
                : 'Rigorous physical modeling of molecular attraction (fixation), hydrophobic repulsion (terpene flash bloom), ethanol cosolvent flash at 32°C, and reversible Schiff base reactions.'}
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-stone-400">
              {language === 'ar' ? 'تجارب تفاعلية جاهزة:' : 'Interaction Presets:'}
            </span>
            <button
              onClick={() => loadPreset('citrusWoody')}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-500/20 text-amber-300 border border-stone-700 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{language === 'ar' ? 'تنافر وتثبيت (Citrus + Woody)' : 'Citrus Repulsion + Fixation'}</span>
            </button>
            <button
              onClick={() => loadPreset('aurantiol')}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-500/20 text-amber-300 border border-stone-700 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{language === 'ar' ? 'تفاعل قاعدة شيف (Aurantiol)' : 'Schiff Base (Aurantiol)'}</span>
            </button>
            <button
              onClick={() => loadPreset('heavyFixative')}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-500/20 text-amber-300 border border-stone-700 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{language === 'ar' ? 'تثبيت مسكي عنبري قوي' : 'Heavy Musk Fixation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Matrix Activity Coefficients & Ethanol Flash */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Activity Coefficients & Non-Ideality Explorer (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>{language === 'ar' ? 'معاملات الفعالية الحقيقية (Activity Coefficients γᵢ)' : 'Real Activity Coefficients (γᵢ)'}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {language === 'ar' 
                    ? 'قانون راؤول المعدل: Pᵢ = γᵢ · xᵢ · P₀. قيم γ > 1 تعني طرداً وفوحاناً، وقيم γ < 1 تعني احتجازاً وتثبيتاً.' 
                    : 'Modified Raoult: Pᵢ = γᵢ · xᵢ · P₀. γ > 1 means matrix eviction / flash bloom, γ < 1 means fixative entrapment.'}
                </p>
              </div>

              {/* Alcohol Slider */}
              <div className="bg-stone-950 px-4 py-2 rounded-2xl border border-stone-800 flex items-center gap-3">
                <Droplets className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-300 gap-2">
                    <span>{language === 'ar' ? 'تركيز الكحول الناقل:' : 'Carrier Alcohol:'}</span>
                    <span className="font-mono text-amber-400">{ethanolPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={ethanolPercent}
                    onChange={(e) => setEthanolPercent(Number(e.target.value))}
                    className="w-28 sm:w-36 accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* List of Ingredients with Activity Coefficient Indicators */}
            <div className="space-y-4">
              {mappedItems.map((item, idx) => {
                const res = activityResults[idx] || { gamma: 1.0, deviationType: 'ideal', mechanisticNotes: '' };
                const gamma = res.gamma;
                const percentShift = Math.round((gamma - 1.0) * 100);

                let badgeColor = 'bg-stone-800 text-stone-300 border-stone-700';
                let barColor = 'bg-stone-500';
                let label = language === 'ar' ? 'سلوك مثالي (Ideal)' : 'Ideal Solution';

                if (res.deviationType === 'repulsion') {
                  badgeColor = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
                  barColor = 'bg-gradient-to-r from-amber-500 to-rose-500';
                  label = language === 'ar' ? `تنافر وفوحان إضافي (+${percentShift}%)` : `Matrix Eviction (+${percentShift}%)`;
                } else if (res.deviationType === 'attraction') {
                  badgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                  barColor = 'bg-gradient-to-r from-emerald-600 to-teal-400';
                  label = language === 'ar' ? `تثبيت واحتجاز جزيئي (${percentShift}%)` : `Fixation Retardation (${percentShift}%)`;
                }

                return (
                  <div key={item.id} className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 hover:border-amber-500/30 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs font-black flex items-center justify-center border border-amber-500/20">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-stone-200 text-sm flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-stone-500 font-mono">({item.cas})</span>
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-3">
                            <span>MW: <strong className="text-stone-300">{item.mw}</strong></span>
                            <span>P₀: <strong className="text-stone-300">{item.p0} mmHg</strong></span>
                            <span>الهرم: <strong className="text-stone-300">{item.pyramid}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-stone-400 font-bold">{language === 'ar' ? 'الأجزاء:' : 'Parts:'}</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={item.parts}
                            onChange={(e) => handlePartsChange(item.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 font-mono font-bold text-xs text-center focus:border-amber-500 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-stone-600 hover:text-rose-400 text-xs px-2 py-1 rounded transition-colors"
                          title="حذف المادة"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Gauge and Gamma Display */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>
                          {label}
                        </span>
                        <div className="font-mono text-xs flex items-center gap-1">
                          <MetricTooltip type="gamma">
                            <span className="text-stone-400">γ = </span>
                          </MetricTooltip>
                          <strong className={res.deviationType === 'repulsion' ? 'text-rose-400 font-black' : res.deviationType === 'attraction' ? 'text-emerald-400 font-black' : 'text-stone-300'}>
                            {gamma.toFixed(2)}
                          </strong>
                          <span className="text-[10px] text-stone-500 ml-1">
                            (P<sub>eff</sub> = {(item.p0 * gamma).toFixed(4)} mmHg)
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar Indicator */}
                      <div className="h-2 w-full bg-stone-850 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                          style={{ width: `${Math.min(100, Math.max(10, (gamma / 2.5) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-400/90 leading-relaxed bg-stone-900/60 p-2.5 rounded-xl border border-stone-850">
                      {res.mechanisticNotes}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Add Material Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="w-full sm:flex-1">
                <MaterialSearchDropdown
                  materials={ALL_MATERIALS}
                  selectedId={selectedAddId}
                  onSelect={(m) => setSelectedAddId(m.id)}
                  accentColor="amber"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إضافة مادة للاختبار' : 'Add to Formula'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Ethanol Flash Kinetics & Schiff Base Audit (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Ethanol Flash Evaporation Curve */}
          <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-sky-400" />
                <span>{language === 'ar' ? 'تطاير الكحول وتحول الغشاء (0-30 دقيقة)' : 'Ethanol Flash Dynamics (0-30 min)'}</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                Skin 32°C (305 K)
              </span>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              {language === 'ar'
                ? 'خلال أول 10 دقائق من الرش، يتبخر الإيثانول بسرعة هائلة كاشفاً عن المواد الهيدروفوبية في فوران مفاجئ (Flash Bloom)، ثم يتحول الخليط إلى غشاء زيتي مركز تبدأ فيه المثبتات عملها.'
                : 'Ethanol rapidly flashes off during the first 10 minutes on skin, triggering an initial terpene headspace burst before collapsing into a neat oil film where fixatives engage.'}
            </p>

            {/* Simple Kinetic Timeline representation */}
            <div className="space-y-2 pt-2">
              {[0, 2, 5, 10, 20, 30].map(minute => {
                const pt = flashPoints.find(p => p.timeMinutes === minute) || flashPoints[0];
                return (
                  <div key={minute} className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-950/60 border border-stone-850">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span className="font-mono font-bold text-stone-300">t = {minute}m</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-sky-300 font-mono">
                        EtOH: <strong>{pt.ethanolMassPercent}%</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pt.matrixState === 'Alcoholic Flash' 
                          ? 'bg-rose-500/20 text-rose-300' 
                          : pt.matrixState === 'Cosolvent Evaporation'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {pt.matrixState}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schiff Base Reactions Detection */}
          <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'كاشف التفاعلات الكيميائية وقواعد شيف' : 'Schiff Base & Chemical Reactions'}</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                schiffAudits.length > 0 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}>
                {schiffAudits.length > 0 ? (language === 'ar' ? `تفاعل نشط (${schiffAudits.length})` : `Active Reaction (${schiffAudits.length})`) : (language === 'ar' ? 'لا تفاعلات' : 'No Reactions')}
              </span>
            </div>

            {schiffAudits.length === 0 ? (
              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-850 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="text-xs text-stone-400">
                  {language === 'ar'
                    ? 'لم يتم رصد أمينات أولية (مثل ميثيل أنثرانيلات) متفاعلة مع ألدهيدات في التركيبة الحالية. جرب تحميل تجربة (Aurantiol) لمشاهدة التفاعل الكيميائي.'
                    : 'No primary amine / aldehyde pairs detected in current formula. Load Aurantiol preset to simulate covalent condensation.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {schiffAudits.map((audit, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-stone-950 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-xs">
                        {audit.schiffBaseName}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        توازن {audit.equilibriumConversionPercent}%
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-300 space-y-1.5">
                      <p><strong>المتفاعلات:</strong> {audit.amineName} + {audit.aldehydeName}</p>
                      <p className="text-amber-200/90 leading-relaxed bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        {audit.olfactoryShiftDescription}
                      </p>
                      <p className="text-stone-400 leading-relaxed">
                        {audit.evaporationImpact}
                      </p>
                      <div className="text-[10px] text-stone-500 pt-1 flex items-center justify-between">
                        <span>فترة التعتيق (Maceration): {audit.macerationDaysToEquilibrium} يوماً</span>
                        <span className="text-amber-400">{audit.colorShiftDescription}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Cross-Affinity Interactive Inspector (139 x 139) */}
      <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
              <span>{language === 'ar' ? 'فاحص التجاذب والتنافر التبادلي (Pairwise Affinity Inspector)' : 'Pairwise Intermolecular Affinity Inspector'}</span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'ar' 
                ? 'اختر أي مادتين من الـ 139 مادة لمعاينة قوى التفاعل بينهما ثرموديناميكياً وقواعد التثبيت أو التنافر.' 
                : 'Select any two materials from the 139 catalog to inspect their mutual thermodynamic affinity and intermolecular forces.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Material A Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400">
              {language === 'ar' ? 'المادة الأولى (A):' : 'Material A:'}
            </label>
            <select
              value={pairAId}
              onChange={(e) => setPairAId(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs font-bold outline-none focus:border-amber-500"
            >
              {ALL_MATERIALS.map(m => (
                <option key={m.id} value={m.id}>
                  #{m.id} - {language === 'ar' ? m.nameAr : m.nameEn} ({m.nameEn}) - [{m.pyramidNote}]
                </option>
              ))}
            </select>
          </div>

          {/* Material B Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400">
              {language === 'ar' ? 'المادة الثانية (B):' : 'Material B:'}
            </label>
            <select
              value={pairBId}
              onChange={(e) => setPairBId(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs font-bold outline-none focus:border-amber-500"
            >
              {ALL_MATERIALS.map(m => (
                <option key={m.id} value={m.id}>
                  #{m.id} - {language === 'ar' ? m.nameAr : m.nameEn} ({m.nameEn}) - [{m.pyramidNote}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pairwise Interaction Card Result */}
        <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-850 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-amber-200 text-sm">
                {pairwiseResult.materialA} ➔ {pairwiseResult.materialB}
              </span>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              pairwiseResult.interactionCategory === 'تثبيت وتجاذب جزيئي'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : pairwiseResult.interactionCategory === 'تنافر وفوحان انفجاري'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : pairwiseResult.interactionCategory === 'تفاعل كيميائي حقيقي (شيف)'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-stone-800 text-stone-300 border-stone-700'
            }`}>
              {pairwiseResult.interactionCategory}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-400 font-bold block mb-1">
                {language === 'ar' ? 'القوى الجزيئية السائدة:' : 'Dominant Molecular Forces:'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-stone-300">
                {pairwiseResult.dominantForces.map((force, i) => (
                  <li key={i}>{force}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-stone-400 font-bold block mb-1">
                {language === 'ar' ? 'التوجيه العملي لصانع العطر:' : 'Practical Perfumer Advice:'}
              </span>
              <p className="text-amber-200/90 leading-relaxed bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                {pairwiseResult.practicalPerfumeryAdvice}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
