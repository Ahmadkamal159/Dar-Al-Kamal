/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  ChevronRight
} from 'lucide-react';
import { KineticFragranceMaterial, ScientificConfidence } from '../types/kineticModel';
import { getAllScientificMaterials } from '../data/scientificDatabase';
import { enrichMaterialScientifically, EnrichmentResult } from '../services/scientificEnrichmentService';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';

interface SmartDataFeederProps {
  onSelectForSimulation?: (material: KineticFragranceMaterial) => void;
}

const LOCAL_STORAGE_CUSTOM_MATERIALS_KEY = 'dar_alkamal_custom_materials_v1';

export const SmartDataFeeder: React.FC<SmartDataFeederProps> = ({ onSelectForSimulation }) => {
  const { language, isRtl } = useLanguage();

  // Database state (default + custom materials in localStorage)
  const [materialsList, setMaterialsList] = useState<KineticFragranceMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_MATERIALS_KEY);
      if (saved) {
        const custom: KineticFragranceMaterial[] = JSON.parse(saved);
        const base = getAllScientificMaterials();
        const map = new Map<string, KineticFragranceMaterial>();
        base.forEach(m => map.set(m.name.toLowerCase(), m));
        custom.forEach(m => map.set(m.name.toLowerCase(), m));
        return Array.from(map.values());
      }
    } catch (e) {
      console.error('Failed to parse saved custom materials', e);
    }
    return getAllScientificMaterials();
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('ALL');

  // Form state for Add / Edit
  const [editingName, setEditingName] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCas, setFormCas] = useState('');
  const [formMw, setFormMw] = useState<number>(150);
  const [formP0, setFormP0] = useState<number>(0.01);
  const [formOdt, setFormOdt] = useState<number>(1.0);
  const [formOdtSource, setFormOdtSource] = useState('van Gemert (2011)');
  const [formConfidence, setFormConfidence] = useState<ScientificConfidence>('High (Experimental)');
  const [formCategory, setFormCategory] = useState<'Top' | 'Heart' | 'Base'>('Heart');
  const [formPrice, setFormPrice] = useState<number>(10);

  // Live API Search State
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<EnrichmentResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Save custom materials to localStorage
  const saveToLocalStorage = (updatedList: KineticFragranceMaterial[]) => {
    try {
      const defaultMap = new Map(getAllScientificMaterials().map(m => [m.name.toLowerCase(), m]));
      const customOnly = updatedList.filter(m => {
        const def = defaultMap.get(m.name.toLowerCase());
        if (!def) return true;
        return JSON.stringify(def) !== JSON.stringify(m);
      });
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_MATERIALS_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  // Trigger Live Multi-Tier API Search
  const handleLiveApiLookup = async () => {
    const q = apiSearchQuery.trim() || formName.trim() || formCas.trim();
    if (!q) {
      setApiError(
        language === 'ar' 
          ? 'يرجى كتابة اسم المادة أو رقم CAS للبحث في قواعد البيانات العلمية' 
          : 'Please enter material name or CAS number to query scientific repositories'
      );
      return;
    }

    setIsApiLoading(true);
    setApiError(null);
    setApiResult(null);

    try {
      const result = await enrichMaterialScientifically(q);
      setApiResult(result);

      // Auto-fill form fields
      setFormName(result.material.name);
      setFormNameAr(result.material.nameAr || '');
      setFormCas(result.material.cas);
      setFormMw(result.material.molecularWeight);
      setFormP0(result.material.vaporPressure);
      setFormOdt(result.material.odt);
      setFormOdtSource(result.material.odtSource);
      setFormConfidence(result.material.confidence);
      setFormCategory(result.material.category);
      if (result.material.pricePerGram) setFormPrice(result.material.pricePerGram);

      setSuccessMessage(
        language === 'ar'
          ? `تم جلب وتوثيق المواصفات بنجاح من: ${result.matchedTier}`
          : `Parameters verified and resolved from: ${result.matchedTier}`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setApiError(err?.message || (language === 'ar' ? 'حدث خطأ أثناء الاتصال بقواعد البيانات العلمية' : 'Error connecting to scientific repositories'));
    } finally {
      setIsApiLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingName(null);
    setFormName('');
    setFormNameAr('');
    setFormCas('');
    setFormMw(150);
    setFormP0(0.01);
    setFormOdt(1.0);
    setFormOdtSource('van Gemert (2011)');
    setFormConfidence('High (Experimental)');
    setFormCategory('Heart');
    setFormPrice(10);
    setApiResult(null);
    setApiError(null);
  };

  // Populate form for editing existing material
  const handleEdit = (mat: KineticFragranceMaterial) => {
    setEditingName(mat.name);
    setFormName(mat.name);
    setFormNameAr(mat.nameAr || '');
    setFormCas(mat.cas);
    setFormMw(mat.molecularWeight);
    setFormP0(mat.vaporPressure);
    setFormOdt(mat.odt);
    setFormOdtSource(mat.odtSource);
    setFormConfidence(mat.confidence);
    setFormCategory(mat.category);
    setFormPrice(mat.pricePerGram || 10);
    setApiSearchQuery(mat.name);
  };

  // Save (Create or Update)
  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCas.trim()) {
      setApiError(language === 'ar' ? 'اسم المادة ورقم CAS حقول إلزامية' : 'Material Name and CAS Number are required');
      return;
    }

    const newMaterial: KineticFragranceMaterial = {
      name: formName.trim(),
      nameAr: formNameAr.trim() || undefined,
      cas: formCas.trim(),
      molecularWeight: Number(formMw) || 100,
      vaporPressure: Number(formP0) || 0.001,
      odt: Number(formOdt) || 1.0,
      odtUnit: 'ng/L',
      odtSource: formOdtSource.trim() || 'User entry',
      category: formCategory,
      confidence: formConfidence,
      pricePerGram: Number(formPrice) || 10,
    };

    let updated: KineticFragranceMaterial[];
    if (editingName) {
      updated = materialsList.map(m => m.name.toLowerCase() === editingName.toLowerCase() ? newMaterial : m);
    } else {
      const exists = materialsList.some(m => m.name.toLowerCase() === newMaterial.name.toLowerCase());
      if (exists) {
        updated = materialsList.map(m => m.name.toLowerCase() === newMaterial.name.toLowerCase() ? newMaterial : m);
      } else {
        updated = [newMaterial, ...materialsList];
      }
    }

    setMaterialsList(updated);
    saveToLocalStorage(updated);
    setSuccessMessage(
      language === 'ar'
        ? `تم حفظ مادة "${newMaterial.name}" في قاعدة بيانات النظام بنجاح`
        : `Material "${newMaterial.name}" saved to database successfully`
    );
    setTimeout(() => setSuccessMessage(null), 3000);
    resetForm();
  };

  // Delete material
  const handleDelete = (name: string) => {
    const confirmMsg = language === 'ar' 
      ? `هل أنت متأكد من حذف المادة "${name}" من قاعدة البيانات المحلية؟`
      : `Delete material "${name}" from local database?`;
    if (window.confirm(confirmMsg)) {
      const updated = materialsList.filter(m => m.name.toLowerCase() !== name.toLowerCase());
      setMaterialsList(updated);
      saveToLocalStorage(updated);
      if (editingName === name) resetForm();
    }
  };

  // Filtered materials
  const filteredMaterials = materialsList.filter((m: KineticFragranceMaterial) => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const matchName = m.name.toLowerCase().includes(q);
      const matchNameAr = m.nameAr ? m.nameAr.includes(q) : false;
      const matchCas = m.cas.toLowerCase().includes(q);
      const matchSrc = m.odtSource.toLowerCase().includes(q);
      if (!matchName && !matchNameAr && !matchCas && !matchSrc) return false;
    }
    if (selectedConfidence !== 'ALL' && m.confidence !== selectedConfidence) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <span>{language === 'ar' ? 'مغذي البيانات الذكي ومحرك الاستعلام المتسلسل' : 'Smart Data Feeder & Multi-Tier Scientific Resolver'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DataFeeder + Multi-Tier APIs
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-1 max-w-3xl leading-relaxed">
                {language === 'ar' ? (
                  <>
                    بديل متطور لـ <code className="text-amber-300 font-mono">DataFeederGUI.py</code> مع الاتصال التلقائي بـ <strong className="text-stone-200">NIH PubChem API</strong>، وتطبيق هرمية التوثيق العلمي بالترتيب لضمان أقصى دقة فيزيائية-كيميائية، مع حفظ البيانات محلياً.
                  </>
                ) : (
                  <>
                    Advanced browser-native replacement for <code className="text-amber-300 font-mono">DataFeederGUI.py</code> with automated fallback to <strong className="text-stone-200">NIH PubChem REST API</strong> and rigorous 5-tier scientific hierarchy for exact physicochemical fidelity.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-stone-950/80 px-4 py-2.5 rounded-xl border border-stone-800 shrink-0 text-xs">
            <div className="text-center">
              <div className="text-stone-500 text-[10px]">{language === 'ar' ? 'المواد المسجلة' : 'Registered Materials'}</div>
              <div className="font-mono font-bold text-amber-400 text-sm">{materialsList.length}</div>
            </div>
            <div className="w-px h-6 bg-stone-800" />
            <div className="text-center">
              <div className="text-stone-500 text-[10px]">{language === 'ar' ? 'درجة الموثوقية' : 'Confidence Tier'}</div>
              <div className="font-mono font-bold text-emerald-400 text-sm">Tier 1 - 5</div>
            </div>
          </div>
        </div>

        {/* Hierarchy Badges Bar */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[11px]">
          <div className="bg-stone-950/60 p-2 rounded-lg border border-emerald-500/20">
            <span className="font-bold text-emerald-400 block">{language === 'ar' ? 'Tier 1: تجريبي معتمد' : 'Tier 1: Experimental'}</span>
            <span className="text-stone-500 text-[10px]">van Gemert & Nagata</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-lg border border-sky-500/20">
            <span className="font-bold text-sky-400 block">{language === 'ar' ? 'Tier 2: NIH PubChem' : 'Tier 2: NIH PubChem'}</span>
            <span className="text-stone-500 text-[10px]">Live REST API</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-lg border border-indigo-500/20">
            <span className="font-bold text-indigo-400 block">{language === 'ar' ? 'Tier 3: EPA CompTox' : 'Tier 3: EPA CompTox'}</span>
            <span className="text-stone-500 text-[10px]">{language === 'ar' ? 'حسابات Clausius-Clapeyron' : 'Clausius-Clapeyron VP'}</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-lg border border-amber-500/20">
            <span className="font-bold text-amber-400 block">{language === 'ar' ? 'Tier 4: تقدير QSAR' : 'Tier 4: QSAR Estimation'}</span>
            <span className="text-stone-500 text-[10px]">{language === 'ar' ? 'تقدير العتبة ODT' : 'ODT & VP Estimation'}</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-lg border border-purple-500/20">
            <span className="font-bold text-purple-400 block">{language === 'ar' ? 'Tier 5: بدائل NCS' : 'Tier 5: NCS Surrogates'}</span>
            <span className="text-stone-500 text-[10px]">{language === 'ar' ? 'تفكيك الزيوت الطبيعية' : 'Natural Complex Breakdown'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form / API Query on Left & Database Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Live API Fetcher & Edit Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Live Search Section */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'الاستعلام الفوري التلقائي (Live API Lookup)' : 'Live Scientific API Query'}</span>
              </h3>
              <span className="text-[10px] text-stone-500 font-mono">PubChem REST API</span>
            </div>

            <p className="text-xs text-stone-400">
              {language === 'ar' 
                ? 'اكتب اسم المادة بالإنجليزية أو رقم CAS، وسيقوم النظام فوراً بالبحث في المراجع المعتمدة، ثم NIH PubChem، وتعبئة كافة الثوابت الفيزيائية تلقائياً:'
                : 'Enter English material name or CAS number. The system queries peer-reviewed references, then NIH PubChem, automatically populating physical constants:'}
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className={`w-4 h-4 text-stone-500 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={apiSearchQuery}
                  onChange={(e) => setApiSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLiveApiLookup()}
                  placeholder={language === 'ar' ? 'مثال: Ambroxan أو 6790-58-5 أو Hedione...' : 'e.g. Ambroxan, 6790-58-5, or Hedione...'}
                  className={`w-full bg-stone-950 border border-stone-700 rounded-xl py-2 text-xs text-stone-100 placeholder-stone-500 outline-none focus:border-amber-500 transition-colors ${
                    isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleLiveApiLookup}
                disabled={isApiLoading}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isApiLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'ar' ? 'جاري الفحص...' : 'Querying...'}</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'استعلام متسلسل' : 'Sequential Query'}</span>
                  </>
                )}
              </button>
            </div>

            {/* API Result Feedback Card */}
            {apiResult && (
              <div className="bg-stone-950 border border-emerald-500/30 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ar' ? `تم التوثيق عبر: ${apiResult.matchedTier}` : `Verified via: ${apiResult.matchedTier}`}</span>
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">{apiResult.material.cas}</span>
                </div>

                <div className="text-[11px] text-stone-300 space-y-1">
                  <div><strong className="text-stone-400">{language === 'ar' ? 'الاسم الكيميائي:' : 'Chemical Name:'}</strong> {apiResult.material.name}</div>
                  <div className="flex gap-4 font-mono text-[10px] text-stone-400 flex-wrap">
                    <span>MW: <strong className="text-amber-300">{apiResult.material.molecularWeight.toFixed(2)}</strong> g/mol</span>
                    <span>P₀: <strong className="text-amber-300">{apiResult.material.vaporPressure}</strong> mmHg</span>
                    <span>ODT: <strong className="text-amber-300">{apiResult.material.odt}</strong> ng/L</span>
                  </div>
                </div>

                {/* Audit Trail Steps */}
                <div className="pt-2 border-t border-stone-800/80 space-y-1">
                  <span className="text-[10px] text-stone-500 font-semibold block">
                    {language === 'ar' ? 'سجل الفحص التدقيقي (Audit Trail):' : 'Verification Audit Trail:'}
                  </span>
                  {apiResult.auditTrail.map((step, idx) => (
                    <div key={idx} className="text-[10px] text-stone-400 flex items-start gap-1">
                      <ChevronRight className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {apiError && (
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* Material Form (Add / Edit) */}
          <form onSubmit={handleSaveMaterial} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>{editingName ? (language === 'ar' ? `تعديل مادة: ${editingName}` : `Edit Material: ${editingName}`) : (language === 'ar' ? 'إضافة مادة جديدة للقاعدة المحلية' : 'Add New Material to Local DB')}</span>
              </h3>
              {editingName && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-stone-400 hover:text-white text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}</span>
                </button>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-stone-400 block mb-1">
                  {language === 'ar' ? 'اسم المادة العطرية (Material Name) *' : 'Material Name (INCI / Common) *'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Iso E Super, Linalool"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">
                  {language === 'ar' ? 'الاسم بالعربية (اختياري)' : 'Arabic Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={formNameAr}
                  onChange={(e) => setFormNameAr(e.target.value)}
                  placeholder="مثال: أيزو إي سوبر"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">
                  {language === 'ar' ? 'رقم الـ CAS Number *' : 'CAS Registry Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={formCas}
                  onChange={(e) => setFormCas(e.target.value)}
                  placeholder="e.g. 54464-57-2"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <MetricTooltip type="mw">
                    <label className="text-stone-400 cursor-help border-b border-dotted border-stone-600 block">
                      {language === 'ar' ? 'الوزن الجزيئي MW (g/mol) *' : 'Molecular Weight MW (g/mol) *'}
                    </label>
                  </MetricTooltip>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formMw}
                  onChange={(e) => setFormMw(parseFloat(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <MetricTooltip type="p0">
                    <label className="text-stone-400 cursor-help border-b border-dotted border-stone-600 block">
                      {language === 'ar' ? 'الضغط البخاري P₀ (mmHg) *' : 'Vapor Pressure P₀ (mmHg) *'}
                    </label>
                  </MetricTooltip>
                </div>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={formP0}
                  onChange={(e) => setFormP0(parseFloat(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <MetricTooltip type="odt">
                    <label className="text-stone-400 cursor-help border-b border-dotted border-stone-600 block">
                      {language === 'ar' ? 'عتبة الشم ODT (ng/L) *' : 'Odor Threshold ODT (ng/L) *'}
                    </label>
                  </MetricTooltip>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formOdt}
                  onChange={(e) => setFormOdt(parseFloat(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">
                  {language === 'ar' ? 'مصدر عتبة الشم' : 'ODT Source Literature'}
                </label>
                <input
                  type="text"
                  value={formOdtSource}
                  onChange={(e) => setFormOdtSource(e.target.value)}
                  placeholder="e.g. van Gemert (2011)"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">
                  {language === 'ar' ? 'درجة الموثوقية' : 'Confidence Tier'}
                </label>
                <select
                  value={formConfidence}
                  onChange={(e: any) => setFormConfidence(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-2 text-stone-100 outline-none focus:border-amber-500 text-[11px]"
                >
                  <option value="High (Experimental)">High (Experimental)</option>
                  <option value="Verified Literature">Verified Literature</option>
                  <option value="Estimated (QSAR/Physical)">Estimated (QSAR/Physical)</option>
                  <option value="Natural Complex (NCS)">Natural Complex (NCS)</option>
                </select>
              </div>

              <div>
                <MetricTooltip type="pyramidNote">
                  <label className="text-stone-400 block mb-1 cursor-help border-b border-dotted border-stone-600 w-fit">
                    {language === 'ar' ? 'موقع الهرم العطري' : 'Pyramid Position'}
                  </label>
                </MetricTooltip>
                <select
                  value={formCategory}
                  onChange={(e: any) => setFormCategory(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-2 text-stone-100 outline-none focus:border-amber-500 text-[11px]"
                >
                  <option value="Top">{language === 'ar' ? 'قمة (Top)' : 'Top Note'}</option>
                  <option value="Heart">{language === 'ar' ? 'قلب (Heart)' : 'Heart Note'}</option>
                  <option value="Base">{language === 'ar' ? 'قاعدة (Base)' : 'Base Note'}</option>
                </select>
              </div>

              <div className="col-span-2">
                <MetricTooltip type="costEgp">
                  <label className="text-stone-400 block mb-1 cursor-help border-b border-dotted border-stone-600 w-fit">
                    {language === 'ar' ? 'سعر الجرام بالجنيه (EGP/g)' : 'Unit Price (EGP / gram)'}
                  </label>
                </MetricTooltip>
                <input
                  type="number"
                  step="0.1"
                  value={formPrice}
                  onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingName 
                    ? (language === 'ar' ? 'تحديث المادة في قاعدة البيانات' : 'Update Material in Database') 
                    : (language === 'ar' ? 'حفظ المادة في قاعدة البيانات الدائمة' : 'Save Material to Database')}
                </span>
              </button>
            </div>
          </form>

        </div>

        {/* RIGHT COLUMN: Database View & Filter Table (7 cols) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col space-y-4">
          
          {/* Table Header & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'سجل المواد والثوابت الكيميائية' : 'Physical-Chemical Registry Table'}</span>
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'ar' 
                  ? 'جميع المواد الجاهزة للمحاكاة الحركية وحساب الـ Odor Value' 
                  : 'Benchmark materials calibrated for kinetic vapor pressure and Odor Value calculation'}
              </p>
            </div>

            <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {filteredMaterials.length} {language === 'ar' ? 'مادة' : 'materials'}
            </span>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <div className="relative flex-1">
              <Search className={`w-3.5 h-3.5 text-stone-500 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={language === 'ar' ? 'تصفية بالاسم، CAS، أو المصدر...' : 'Filter by name, CAS, or source...'}
                className={`w-full bg-stone-950 border border-stone-700 rounded-xl py-1.5 text-xs text-stone-100 placeholder-stone-500 outline-none focus:border-amber-500 ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>

            <select
              value={selectedConfidence}
              onChange={(e) => setSelectedConfidence(e.target.value)}
              className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 outline-none"
            >
              <option value="ALL">{language === 'ar' ? 'جميع درجات الموثوقية' : 'All Confidence Tiers'}</option>
              <option value="High (Experimental)">High (Experimental)</option>
              <option value="Verified Literature">Verified Literature</option>
              <option value="Estimated (QSAR/Physical)">Estimated (QSAR/Physical)</option>
              <option value="Natural Complex (NCS)">Natural Complex (NCS)</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-stone-800 rounded-xl flex-1 max-h-[580px]">
            <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 sticky top-0 z-10 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5">{language === 'ar' ? 'المادة' : 'Material'}</th>
                  <th className="p-2.5">CAS</th>
                  <th className="p-2.5">
                    <MetricTooltip type="mw">
                      <span className="cursor-help border-b border-dotted border-stone-600">MW</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">
                    <MetricTooltip type="p0">
                      <span className="cursor-help border-b border-dotted border-stone-600">P₀ (mmHg)</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">
                    <MetricTooltip type="odt">
                      <span className="cursor-help border-b border-dotted border-stone-600">ODT (ng/L)</span>
                    </MetricTooltip>
                  </th>
                  <th className="p-2.5">{language === 'ar' ? 'الموثوقية' : 'Tier'}</th>
                  <th className="p-2.5 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                {filteredMaterials.map((mat: KineticFragranceMaterial) => {
                  const isExperimental = mat.confidence === 'High (Experimental)';
                  const isLiterature = mat.confidence === 'Verified Literature';
                  const isNatural = mat.confidence === 'Natural Complex (NCS)';

                  return (
                    <tr key={mat.name} className="hover:bg-stone-850/60 transition-colors">
                      <td className="p-2.5 font-bold text-stone-200 font-sans">
                        <div>{language === 'ar' ? (mat.nameAr || mat.name) : mat.name}</div>
                        <div className="text-[10px] text-stone-500 font-normal truncate max-w-[160px]">
                          {language === 'ar' ? mat.name : (mat.nameAr || mat.cas)}
                        </div>
                      </td>
                      <td className="p-2.5 text-stone-400">{mat.cas}</td>
                      <td className="p-2.5 text-stone-300">{mat.molecularWeight.toFixed(1)}</td>
                      <td className="p-2.5 text-amber-300">
                        {mat.vaporPressure < 0.001 ? mat.vaporPressure.toExponential(2) : mat.vaporPressure.toFixed(4)}
                      </td>
                      <td className="p-2.5 text-emerald-300">
                        {mat.odt < 0.01 ? mat.odt.toExponential(2) : mat.odt.toFixed(2)}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          isExperimental 
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : isLiterature 
                            ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                            : isNatural
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {mat.confidence.split(' ')[0]}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(mat)}
                            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition-colors"
                            title={language === 'ar' ? 'تعديل المادة' : 'Edit material'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(mat.name)}
                            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-red-400 transition-colors"
                            title={language === 'ar' ? 'حذف من القاعدة' : 'Delete material'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
