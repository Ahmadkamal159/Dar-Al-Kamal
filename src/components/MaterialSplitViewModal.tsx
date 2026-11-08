/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Columns, 
  ArrowLeftRight, 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Scale,
  Copy,
  Check
} from 'lucide-react';
import { PerfumeMaterial } from '../types/perfumery';
import { ALL_MATERIALS } from '../data/materialsData';
import { findScientificMaterial } from '../data/scientificDatabase';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';
import { MaterialSearchDropdown } from './MaterialSearchDropdown';

interface MaterialSplitViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMaterialA?: PerfumeMaterial | null;
  initialMaterialB?: PerfumeMaterial | null;
  onAddToFormula?: (materialId: number, parts: number) => void;
}

// Popular classic substitution pairings in perfumery with bilingual labels
const POPULAR_SUBSTITUTION_PAIRS = [
  { idA: 105, idB: 129, labelAr: 'بديل ليرال المحظور (Lyral #105 ➔ Mayol #129)', labelEn: 'Banned Lyral Substitute (Lyral #105 ➔ Mayol #129)' },
  { idA: 25, idB: 24, labelAr: 'عنبر خفيف مقابل إشعاع جبار (Ambroxan #25 ➔ Ambrocenide #24)', labelEn: 'Amber Radiance Contrast (Ambroxan #25 ➔ Ambrocenide #24)' },
  { idA: 40, idB: 41, labelAr: 'إشراق زهري مقابل شفافية خشبية (Hedione #40 ➔ Iso E Super #41)', labelEn: 'Floral Lift vs Woody Sheer (Hedione #40 ➔ Iso E Super #41)' },
  { idA: 10, idB: 3, labelAr: 'برغموت حمضي مقابل جريب فروت فوار (Bergamot #10 ➔ Grapefruit #3)', labelEn: 'Citrus Bergamot vs Sparkling Grapefruit (#10 ➔ #3)' },
  { idA: 11, idB: 30, labelAr: 'مسك بودري مقابل مسك نظافة نقي (Tonalide #11 ➔ Galaxolide #30)', labelEn: 'Powdery Musk vs Clean Floral Musk (#11 ➔ #30)' },
  { idA: 9, idB: 136, labelAr: 'باتشولي ترابي كلاسيكي مقابل خشب عنبري حديث (Patchouli #9 ➔ Trimofix #136)', labelEn: 'Earthy Patchouli vs Modern Amber Woody (#9 ➔ #136)' },
];

export const MaterialSplitViewModal: React.FC<MaterialSplitViewModalProps> = ({
  isOpen,
  onClose,
  initialMaterialA,
  initialMaterialB,
  onAddToFormula,
}) => {
  const { language, isRtl } = useLanguage();
  const [materialAId, setMaterialAId] = useState<number>(() => initialMaterialA?.id || 105);
  const [materialBId, setMaterialBId] = useState<number>(() => initialMaterialB?.id || 129);

  React.useEffect(() => {
    if (initialMaterialA) {
      setMaterialAId(initialMaterialA.id);
    }
  }, [initialMaterialA]);

  React.useEffect(() => {
    if (initialMaterialB) {
      setMaterialBId(initialMaterialB.id);
    }
  }, [initialMaterialB]);

  const materialA = useMemo(() => ALL_MATERIALS.find(m => m.id === materialAId) || ALL_MATERIALS[0], [materialAId]);
  const materialB = useMemo(() => ALL_MATERIALS.find(m => m.id === materialBId) || ALL_MATERIALS[1], [materialBId]);

  // Scientific data matches (MW, P0, ODT)
  const scientificA = useMemo(() => findScientificMaterial(materialA.nameEn) || findScientificMaterial(materialA.cas), [materialA]);
  const scientificB = useMemo(() => findScientificMaterial(materialB.nameEn) || findScientificMaterial(materialB.cas), [materialB]);

  const [copiedCasA, setCopiedCasA] = useState(false);
  const [copiedCasB, setCopiedCasB] = useState(false);

  if (!isOpen) return null;

  const handleSwap = () => {
    setMaterialAId(materialB.id);
    setMaterialBId(materialA.id);
  };

  const handleCopyCas = (cas: string, isA: boolean) => {
    if (cas) {
      navigator.clipboard.writeText(cas);
      if (isA) {
        setCopiedCasA(true);
        setTimeout(() => setCopiedCasA(false), 2000);
      } else {
        setCopiedCasB(true);
        setTimeout(() => setCopiedCasB(false), 2000);
      }
    }
  };

  // Substitution Metrics Calculations
  const priceDelta = materialB.pricePerGram - materialA.pricePerGram;
  const pricePercent = materialA.pricePerGram > 0 
    ? Math.round(((materialB.pricePerGram - materialA.pricePerGram) / materialA.pricePerGram) * 100) 
    : 0;

  const tenacityRatio = (materialB.tenacityHours / Math.max(1, materialA.tenacityHours)).toFixed(1);
  const sameFamily = materialA.family === materialB.family;
  const samePyramid = materialA.pyramidNote === materialB.pyramidNote;

  // Substitution Feasibility Assessment Logic
  let substitutionVerdict = {
    title: language === 'ar' ? 'بديل متوازن' : 'Balanced Alternative',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    description: '',
    warning: null as string | null,
    advantages: [] as string[],
  };

  if (materialA.ifraStatus === 'Prohibited / Banned') {
    substitutionVerdict = {
      title: language === 'ar' 
        ? 'استبدال حتمي وإلزامي قانونياً (IFRA 51 Mandatory Substitution)' 
        : 'Mandatory Compliance Substitution (IFRA 51 Enforced)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: language === 'ar'
        ? `المادة الأساسية "${materialA.nameAr}" محظورة دولياً وممنوعة بالكامل من IFRA. المادة البديلة "${materialB.nameAr}" معتمدة وتوفر طابعاً شبيهاً آمناً للاستخدام في عطور الأسواق التجارية.`
        : `The primary material "${materialA.nameEn}" is globally prohibited under IFRA 51. The substitute "${materialB.nameEn}" provides a compliant, safe olfactory trajectory for commercial market formulation.`,
      warning: materialB.ifraStatus === 'Restricted' 
        ? (language === 'ar' ? `تنبيه: المادة البديلة مقيدة بحد أقصى ${materialB.ifraCat4LimitPercent}%.` : `Notice: Substitute is restricted to max ${materialB.ifraCat4LimitPercent}%.`)
        : null,
      advantages: [
        language === 'ar' ? 'مطابقة تشريعية لقوانين IFRA 51 والاتحاد الأوروبي' : 'Full compliance with IFRA 51 & EU Cosmetics Annex II',
        priceDelta > 0 
          ? (language === 'ar' ? `زيادة التكلفة: +${priceDelta} ج.م/ج` : `Cost impact: +${priceDelta} EGP/g`)
          : priceDelta < 0 
          ? (language === 'ar' ? `توفير اقتصادي: ${Math.abs(priceDelta)} ج.م/ج (${Math.abs(pricePercent)}%)` : `Cost savings: -${Math.abs(priceDelta)} EGP/g (${Math.abs(pricePercent)}%)`)
          : (language === 'ar' ? 'نفس التكلفة تماماً' : 'Identical unit cost'),
      ]
    };
  } else if (sameFamily && samePyramid) {
    substitutionVerdict = {
      title: language === 'ar' 
        ? 'بديل وظيفي متطابق (Direct Functional Substitute)' 
        : 'Direct Functional Drop-In Substitute',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: language === 'ar'
        ? `المادتان تشتركان في نفس العائلة الشمية ونفس طبقة الهرم العطري (${materialA.pyramidNote}). يُمكن الاستبدال بنسب متقاربة 1:1 مع ضبط طفيف للأكورد.`
        : `Both materials share the same olfactory family (${materialA.family}) and pyramid level (${materialA.pyramidNote}). Suitable for near 1:1 drop-in replacement with minor accord tuning.`,
      warning: null,
      advantages: [
        language === 'ar' ? `توافق كامل في الهرم العطري (${materialA.pyramidNote})` : `Full pyramid alignment (${materialA.pyramidNote})`,
        priceDelta < 0 
          ? (language === 'ar' ? `وفر مالي ملحوظ بنسبة ${Math.abs(pricePercent)}% بالجنيه` : `Cost savings of ${Math.abs(pricePercent)}% in EGP`)
          : (language === 'ar' ? `فارق سعر: +${priceDelta} ج.م/ج` : `Price delta: +${priceDelta} EGP/g`),
        materialB.tenacityHours >= materialA.tenacityHours 
          ? (language === 'ar' ? `ثبات متفوق بمعدل ${tenacityRatio}x أطول على شريط الشم` : `Superior tenacity: ${tenacityRatio}x longer on blotter`)
          : (language === 'ar' ? `ثبات أقل (${materialB.tenacityHours}h مقابل ${materialA.tenacityHours}h)` : `Lower tenacity (${materialB.tenacityHours}h vs ${materialA.tenacityHours}h)`)
      ]
    };
  } else {
    substitutionVerdict = {
      title: language === 'ar' 
        ? 'بديل تحويري أو إبداعي (Creative / Modifying Alternative)' 
        : 'Creative / Modifying Olfactory Alternative',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      description: language === 'ar'
        ? `تختلف المادتان في العائلة الشمية أو سرعة التبخر (${materialA.family} مقابل ${materialB.family}). الاستبدال هنا سيغير اتجاه العطر الشمي وليس مجرد استبدال نقي.`
        : `Materials diverge in olfactory family or volatility rate (${materialA.family} vs ${materialB.family}). Substitution will intentionally tilt the formula's direction rather than purely mirroring it.`,
      warning: language === 'ar'
        ? `انتبه: التبخر والتوافق الهرمي مختلف (${materialA.pyramidNote} مقابل ${materialB.pyramidNote}).`
        : `Note: Volatility and pyramid position differ (${materialA.pyramidNote} vs ${materialB.pyramidNote}).`,
      advantages: [
        language === 'ar' ? 'إعطاء بصمة جديدة كلياً للتركيبة' : 'Brings a unique, signature nuance to the accord',
        priceDelta < 0 
          ? (language === 'ar' ? `توفير اقتصادي بنسبة ${Math.abs(pricePercent)}%` : `Cost reduction: ${Math.abs(pricePercent)}%`)
          : (language === 'ar' ? `تكلفة إضافية: +${priceDelta} ج.م/ج` : `Cost adjustment: +${priceDelta} EGP/g`)
      ]
    };
  }

  const matAName = language === 'ar' ? materialA.nameAr : materialA.nameEn;
  const matBName = language === 'ar' ? materialB.nameAr : materialB.nameEn;
  const matASubName = language === 'ar' ? materialA.nameEn : materialA.nameAr;
  const matBSubName = language === 'ar' ? materialB.nameEn : materialB.nameAr;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{language === 'ar' ? 'المقارنة المزدوجة ودعم قرارات الاستبدال' : 'Dual Technical Comparison & Substitution Advisor'}</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Side-by-Side Advisor
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                {language === 'ar' 
                  ? 'قارن بين مادتين تقنياً (الأمان بـ IFRA، قوة الثبات، السعر، والثوابت الفيزيائية) لتقييم جدوى الاستبدال' 
                  : 'Compare technical benchmarks (IFRA limits, blotter tenacity, EGP cost, and physicochemical constants) to evaluate substitution viability'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwap}
              className="px-3 py-1.5 rounded-xl border border-stone-700 hover:border-amber-500/40 bg-stone-900 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              title={language === 'ar' ? 'تبديل موقع المادتين' : 'Swap A and B positions'}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{language === 'ar' ? 'عكس الطرفين' : 'Swap Sides'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
              aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Popular Quick Pairs Bar */}
        <div className="bg-stone-950/80 px-4 py-2 border-b border-stone-800/80 overflow-x-auto flex items-center gap-2 text-xs shrink-0">
          <span className="text-[11px] text-stone-500 font-semibold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{language === 'ar' ? 'أزواج استبدال شهيرة:' : 'Benchmark Substitution Pairs:'}</span>
          </span>
          {POPULAR_SUBSTITUTION_PAIRS.map(pair => (
            <button
              key={pair.idA + '-' + pair.idB}
              onClick={() => {
                setMaterialAId(pair.idA);
                setMaterialBId(pair.idB);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition-colors shrink-0"
            >
              {language === 'ar' ? pair.labelAr : pair.labelEn}
            </button>
          ))}
        </div>

        {/* Scrollable Comparison Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          
          {/* Side by Side Selection Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Material A Picker */}
            <div className="bg-stone-950 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {language === 'ar' ? 'المادة الأصلية (Material A)' : 'Original Benchmark (Material A)'}
                </span>
                <MetricTooltip type="catalogId">
                  <span className="text-stone-500 font-mono text-[11px] cursor-help">#{materialA.id}</span>
                </MetricTooltip>
              </div>

              <MaterialSearchDropdown
                materials={ALL_MATERIALS}
                selectedId={materialAId}
                onSelect={(m) => setMaterialAId(m.id)}
                accentColor="amber"
              />
            </div>

            {/* Material B Picker */}
            <div className="bg-stone-950 border border-sky-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {language === 'ar' ? 'المادة المقترحة للبديل (Material B)' : 'Proposed Substitute (Material B)'}
                </span>
                <MetricTooltip type="catalogId">
                  <span className="text-stone-500 font-mono text-[11px] cursor-help">#{materialB.id}</span>
                </MetricTooltip>
              </div>

              <MaterialSearchDropdown
                materials={ALL_MATERIALS}
                selectedId={materialBId}
                onSelect={(m) => setMaterialBId(m.id)}
                accentColor="sky"
              />
            </div>

          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Material A Card Info */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div>
                <h3 className="text-base font-black text-amber-300">{matAName}</h3>
                <p className="text-xs text-stone-400 font-sans">{matASubName}</p>
                <div className="text-[10px] text-stone-500 mt-0.5">{materialA.chemicalName}</div>
              </div>

              {/* CAS Box */}
              <div className="flex items-center justify-between bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-800">
                <span className="text-stone-400 text-[11px]">CAS:</span>
                <span className="font-mono text-stone-200 font-bold" dir="ltr">{materialA.cas}</span>
                <button
                  onClick={() => handleCopyCas(materialA.cas, true)}
                  className="p-1 rounded text-stone-400 hover:text-white"
                  title={language === 'ar' ? 'نسخ CAS' : 'Copy CAS'}
                >
                  {copiedCasA ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Key Technical Indicators */}
              <div className="space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <MetricTooltip type="costEgp">
                    <span className="text-stone-400 cursor-help border-b border-dotted border-stone-600">
                      {language === 'ar' ? 'السعر بالجنيه:' : 'Unit Price (EGP):'}
                    </span>
                  </MetricTooltip>
                  <div className="text-left font-mono">
                    <span className="text-base font-black text-emerald-400">{materialA.pricePerGram}</span>
                    <span className="text-[10px] text-stone-400 ml-1">{language === 'ar' ? 'ج.م / جرام' : 'EGP / g'}</span>
                  </div>
                </div>

                {/* Tenacity */}
                <div className="space-y-1 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <MetricTooltip type="tenacity">
                      <span className="text-stone-400 cursor-help border-b border-dotted border-stone-600">
                        {language === 'ar' ? 'الثبات على ورقة الشم:' : 'Blotter Tenacity:'}
                      </span>
                    </MetricTooltip>
                    <span className="font-mono font-bold text-amber-400">
                      {materialA.tenacityHours} {language === 'ar' ? 'ساعة' : 'hours'}
                    </span>
                  </div>
                  <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, (materialA.tenacityHours / 400) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* IFRA */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <MetricTooltip type="ifraLimit">
                    <span className="text-stone-400 cursor-help border-b border-dotted border-stone-600">
                      {language === 'ar' ? 'حالة أمان IFRA 51:' : 'IFRA 51 Safety:'}
                    </span>
                  </MetricTooltip>
                  <div>
                    {materialA.ifraStatus === 'Prohibited / Banned' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/40 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{language === 'ar' ? 'محظور وممنوع دولياً' : 'Prohibited / Banned'}</span>
                      </span>
                    ) : materialA.ifraStatus === 'Restricted' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{language === 'ar' ? `مقيد بحد أقصى ${materialA.ifraCat4LimitPercent}%` : `Restricted ≤ ${materialA.ifraCat4LimitPercent}%`}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{language === 'ar' ? 'آمن ومعتمد' : 'Compliant / Unrestricted'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Olfactory profile */}
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                  <div className="flex items-center justify-between text-stone-400">
                    <MetricTooltip type="pyramidNote">
                      <span className="cursor-help border-b border-dotted border-stone-600">
                        {language === 'ar' ? 'الهرم والعائلة:' : 'Pyramid & Family:'}
                      </span>
                    </MetricTooltip>
                    <span className="font-bold text-stone-200">{materialA.pyramidNote} • {materialA.family}</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed mt-1">
                    {language === 'ar' ? materialA.odorProfileAr : materialA.odorProfileEn}
                  </p>
                </div>

                {/* Physical constants */}
                {scientificA && (
                  <div className="p-2.5 rounded-xl bg-stone-900/40 border border-stone-800/80 font-mono text-[10px] text-stone-400 space-y-1">
                    <div className="flex justify-between items-center">
                      <MetricTooltip type="mw">
                        <span className="cursor-help border-b border-dotted border-stone-600">
                          {language === 'ar' ? 'الوزن الجزيئي MW:' : 'Molecular Weight MW:'}
                        </span>
                      </MetricTooltip>
                      <span className="text-stone-200">{scientificA.molecularWeight.toFixed(2)} g/mol</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <MetricTooltip type="p0">
                        <span className="cursor-help border-b border-dotted border-stone-600">
                          {language === 'ar' ? 'الضغط البخاري P₀:' : 'Vapor Pressure P₀:'}
                        </span>
                      </MetricTooltip>
                      <span className="text-amber-300">{scientificA.vaporPressure} mmHg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <MetricTooltip type="odt">
                        <span className="cursor-help border-b border-dotted border-stone-600">
                          {language === 'ar' ? 'عتبة الشم ODT:' : 'Odor Threshold ODT:'}
                        </span>
                      </MetricTooltip>
                      <span className="text-emerald-300">{scientificA.odt} ng/L</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Material B Card Info */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div>
                <h3 className="text-base font-black text-sky-300">{matBName}</h3>
                <p className="text-xs text-stone-400 font-sans">{matBSubName}</p>
                <div className="text-[10px] text-stone-500 mt-0.5">{materialB.chemicalName}</div>
              </div>

              {/* CAS Box */}
              <div className="flex items-center justify-between bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-800">
                <span className="text-stone-400 text-[11px]">CAS:</span>
                <span className="font-mono text-stone-200 font-bold" dir="ltr">{materialB.cas}</span>
                <button
                  onClick={() => handleCopyCas(materialB.cas, false)}
                  className="p-1 rounded text-stone-400 hover:text-white"
                  title={language === 'ar' ? 'نسخ CAS' : 'Copy CAS'}
                >
                  {copiedCasB ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Key Technical Indicators */}
              <div className="space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <MetricTooltip type="costEgp">
                    <span className="text-stone-400 cursor-help border-b border-dotted border-stone-600">
                      {language === 'ar' ? 'السعر بالجنيه:' : 'Unit Price (EGP):'}
                    </span>
                  </MetricTooltip>
                  <div className="text-left font-mono">
                    <span className="text-base font-black text-emerald-400">{materialB.pricePerGram}</span>
                    <span className="text-[10px] text-stone-400 ml-1">{language === 'ar' ? 'ج.م / جرام' : 'EGP / g'}</span>
                  </div>
                </div>

                {/* Tenacity */}
                <div className="space-y-1 p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <MetricTooltip type="tenacity">
                      <span className="text-stone-400 cursor-help border-b border-dotted border-stone-600">
                        {language === 'ar' ? 'الثبات على ورقة الشم:' : 'Blotter Tenacity:'}
                      </span>
                    </MetricTooltip>
                    <span className="font-mono font-bold text-amber-400">
                      {materialB.tenacityHours} {language === 'ar' ? 'ساعة' : 'hours'}
                    </span>
                  </div>
                  <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-sky-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, (materialB.tenacityHours / 400) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* IFRA */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
                  <MetricTooltip type="ifraLimit">
                    <span className="text-stone-400 cursor-help border-b border-dotted border-stone-600">
                      {language === 'ar' ? 'حالة أمان IFRA 51:' : 'IFRA 51 Safety:'}
                    </span>
                  </MetricTooltip>
                  <div>
                    {materialB.ifraStatus === 'Prohibited / Banned' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/40 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{language === 'ar' ? 'محظور وممنوع دولياً' : 'Prohibited / Banned'}</span>
                      </span>
                    ) : materialB.ifraStatus === 'Restricted' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{language === 'ar' ? `مقيد بحد أقصى ${materialB.ifraCat4LimitPercent}%` : `Restricted ≤ ${materialB.ifraCat4LimitPercent}%`}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{language === 'ar' ? 'آمن ومعتمد' : 'Compliant / Unrestricted'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Olfactory profile */}
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                  <div className="flex items-center justify-between text-stone-400">
                    <MetricTooltip type="pyramidNote">
                      <span className="cursor-help border-b border-dotted border-stone-600">
                        {language === 'ar' ? 'الهرم والعائلة:' : 'Pyramid & Family:'}
                      </span>
                    </MetricTooltip>
                    <span className="font-bold text-stone-200">{materialB.pyramidNote} • {materialB.family}</span>
                  </div>
                  <p className="text-[11px] text-stone-300 leading-relaxed mt-1">
                    {language === 'ar' ? materialB.odorProfileAr : materialB.odorProfileEn}
                  </p>
                </div>

                {/* Physical constants */}
                {scientificB && (
                  <div className="p-2.5 rounded-xl bg-stone-900/40 border border-stone-800/80 font-mono text-[10px] text-stone-400 space-y-1">
                    <div className="flex justify-between items-center">
                      <MetricTooltip type="mw">
                        <span className="cursor-help border-b border-dotted border-stone-600">
                          {language === 'ar' ? 'الوزن الجزيئي MW:' : 'Molecular Weight MW:'}
                        </span>
                      </MetricTooltip>
                      <span className="text-stone-200">{scientificB.molecularWeight.toFixed(2)} g/mol</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <MetricTooltip type="p0">
                        <span className="cursor-help border-b border-dotted border-stone-600">
                          {language === 'ar' ? 'الضغط البخاري P₀:' : 'Vapor Pressure P₀:'}
                        </span>
                      </MetricTooltip>
                      <span className="text-amber-300">{scientificB.vaporPressure} mmHg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <MetricTooltip type="odt">
                        <span className="cursor-help border-b border-dotted border-stone-600">
                          {language === 'ar' ? 'عتبة الشم ODT:' : 'Odor Threshold ODT:'}
                        </span>
                      </MetricTooltip>
                      <span className="text-emerald-300">{scientificB.odt} ng/L</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Substitution Decision Advisor Card */}
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-white">
                  {language === 'ar' ? 'تقرير تقييم قرار الاستبدال الفني والاقتصادي:' : 'Technical & Economic Substitution Evaluation Report:'}
                </h4>
              </div>

              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${substitutionVerdict.badgeClass}`}>
                {substitutionVerdict.title}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {substitutionVerdict.description}
            </p>

            {substitutionVerdict.warning && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{substitutionVerdict.warning}</span>
              </div>
            )}

            {/* Quick Metrics Delta Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              
              {/* Cost Delta */}
              <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-1">
                <MetricTooltip type="costEgp">
                  <span className="text-stone-400 text-[11px] block cursor-help border-b border-dotted border-stone-700 w-fit">
                    {language === 'ar' ? 'فارق التكلفة بالجنيه:' : 'Unit Cost Delta (EGP):'}
                  </span>
                </MetricTooltip>
                <div className="flex items-center gap-1.5 font-bold">
                  {priceDelta < 0 ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm">
                        {language === 'ar' 
                          ? `توفير ${Math.abs(priceDelta)} ج.م/ج (${Math.abs(pricePercent)}%)` 
                          : `Save ${Math.abs(priceDelta)} EGP/g (${Math.abs(pricePercent)}%)`}
                      </span>
                    </>
                  ) : priceDelta > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-400 text-sm">
                        {language === 'ar' 
                          ? `زيادة +${priceDelta} ج.م/ج (+${pricePercent}%)` 
                          : `+${priceDelta} EGP/g (+${pricePercent}%)`}
                      </span>
                    </>
                  ) : (
                    <span className="text-stone-300 text-sm">{language === 'ar' ? 'نفس السعر تماماً' : 'Equal cost parity'}</span>
                  )}
                </div>
              </div>

              {/* Longevity Delta */}
              <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-1">
                <MetricTooltip type="tenacity">
                  <span className="text-stone-400 text-[11px] block cursor-help border-b border-dotted border-stone-700 w-fit">
                    {language === 'ar' ? 'فارق الثبات والدوام:' : 'Tenacity Delta:'}
                  </span>
                </MetricTooltip>
                <div className="font-bold text-sm text-stone-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>
                    {materialB.tenacityHours >= materialA.tenacityHours 
                      ? (language === 'ar' ? `${tenacityRatio}x أطول ثباتاً` : `${tenacityRatio}x longer lifespan`)
                      : (language === 'ar' ? `أقصر بـ ${materialA.tenacityHours - materialB.tenacityHours} ساعة` : `${materialA.tenacityHours - materialB.tenacityHours}h shorter`)}
                  </span>
                </div>
              </div>

              {/* IFRA Leeway Delta */}
              <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-1">
                <MetricTooltip type="ifraLimit">
                  <span className="text-stone-400 text-[11px] block cursor-help border-b border-dotted border-stone-700 w-fit">
                    {language === 'ar' ? 'حرية الجرعة بـ IFRA:' : 'IFRA Dosage Margin:'}
                  </span>
                </MetricTooltip>
                <div className="font-bold text-sm text-stone-200 flex items-center gap-1.5">
                  {materialA.ifraStatus === 'Prohibited / Banned' ? (
                    <span className="text-emerald-400">{language === 'ar' ? 'انتقال من الحظر إلى الأمان التام' : 'Transits from Banned to Compliant'}</span>
                  ) : materialB.ifraStatus === 'Compliant' ? (
                    <span className="text-emerald-400">{language === 'ar' ? 'آمن بدون قيود قصوى' : 'Safe without max limits'}</span>
                  ) : (
                    <span className="text-amber-300">{language === 'ar' ? `أقصى حد ${materialB.ifraCat4LimitPercent}%` : `Max limit ${materialB.ifraCat4LimitPercent}%`}</span>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500">
            {language === 'ar' 
              ? 'يمكنك اعتماد البديل ونقل أي من المادتين مباشرة لمختبر التركيب أو المحاكي الحركي'
              : 'Approve substitution and transfer either material directly to the Formula Lab or Kinetic Simulator'}
          </div>

          <div className="flex items-center gap-2">
            {onAddToFormula && (
              <>
                <button
                  onClick={() => {
                    onAddToFormula(materialA.id, 10);
                    onClose();
                  }}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold rounded-xl border border-stone-700 transition-all flex items-center gap-1.5"
                >
                  <span>{language === 'ar' ? 'إضافة المادة الأصلية (A) للتركيبة' : 'Add Original (A) to Formula'}</span>
                </button>

                <button
                  onClick={() => {
                    onAddToFormula(materialB.id, 10);
                    onClose();
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'اعتماد البديل (B) وإضافته للتركيبة' : 'Adopt Substitute (B) in Formula'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
