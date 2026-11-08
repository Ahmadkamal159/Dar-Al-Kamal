import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  DollarSign, 
  Download, 
  FileText,
  RotateCcw,
  Sliders,
  Scale,
  Palette,
  Eye,
  Sun,
  Moon,
  Flower2,
  RefreshCw,
  Flame,
  Waves,
  Wand2
} from 'lucide-react';
import { FormulaIngredient } from '../types/perfumery';
import { ALL_MATERIALS, MATERIAL_MAP, PRESET_ACCORDS } from '../data/materialsData';
import { analyzeFormula } from '../utils/perfumeryRules';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';
import { MaterialSearchDropdown } from './MaterialSearchDropdown';
import citrusMorningImg from '../assets/images/scent_citrus_morning_1793992746530.jpg';
import woodyEveningImg from '../assets/images/scent_woody_evening_1793992760278.jpg';
import floralBloomImg from '../assets/images/scent_floral_bloom_1793992772198.jpg';
import orientalAmberImg from '../assets/images/scent_oriental_amber_1793993159710.jpg';
import marineAquaticImg from '../assets/images/scent_marine_aquatic_1793993174460.jpg';

interface FormulaLabProps {
  ingredients: FormulaIngredient[];
  onUpdateIngredients: (ingredients: FormulaIngredient[]) => void;
  onSelectMaterial: (id: number) => void;
}

export const FormulaLab: React.FC<FormulaLabProps> = ({
  ingredients,
  onUpdateIngredients,
  onSelectMaterial,
}) => {
  const [selectedAddId, setSelectedAddId] = useState<number>(ALL_MATERIALS[0]?.id || 1);
  const [fragranceConcentration, setFragranceConcentration] = useState<number>(20); // 20% perfume concentration
  const [bottleSizeMl, setBottleSizeMl] = useState<number>(50); // 50ml bottle

  const analysis = analyzeFormula(ingredients, fragranceConcentration);

  const handlePartsChange = (index: number, newParts: number) => {
    const updated = [...ingredients];
    updated[index].parts = Math.max(0, newParts);
    onUpdateIngredients(updated);
  };

  const handleDilutionChange = (index: number, newDilution: number) => {
    const updated = [...ingredients];
    updated[index].dilutionPercent = newDilution;
    onUpdateIngredients(updated);
  };

  const handleRemove = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    onUpdateIngredients(updated);
  };

  const handleAddSelected = () => {
    // check if already in formula
    const existingIndex = ingredients.findIndex(i => i.materialId === selectedAddId);
    if (existingIndex >= 0) {
      const updated = [...ingredients];
      updated[existingIndex].parts += 5;
      onUpdateIngredients(updated);
    } else {
      onUpdateIngredients([...ingredients, { materialId: selectedAddId, parts: 10, dilutionPercent: 100 }]);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_ACCORDS.find(p => p.id === presetId);
    if (preset) {
      onUpdateIngredients(preset.items);
    }
  };

  const handleClearFormula = () => {
    const confirmMsg = language === 'ar' 
      ? 'هل أنت متأكد من مسح جميع مكونات التركيبة؟' 
      : 'Are you sure you want to clear all ingredients from the formula?';
    if (window.confirm(confirmMsg)) {
      onUpdateIngredients([]);
    }
  };

  // Cost for a single bottle
  // Concentrate in bottle = bottleSizeMl * (fragranceConcentration / 100) grams (approx 1g ~ 1ml for perfume concentrate)
  const oilGramsPerBottle = (bottleSizeMl * fragranceConcentration) / 100;
  const costPerBottleEgp = analysis.totalWeight > 0 ? (analysis.costPer100gEgp / 100) * oilGramsPerBottle : 0;

  // Analyze primary olfactory families present in formula
  const familyComposition = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    ingredients.forEach(item => {
      const mat = MATERIAL_MAP.get(item.materialId);
      if (mat) {
        const parts = item.parts * (item.dilutionPercent / 100);
        map[mat.family] = (map[mat.family] || 0) + parts;
        total += parts;
      }
    });

    const entries = Object.entries(map).map(([family, parts]) => ({
      family,
      parts,
      percentage: total > 0 ? Math.round((parts / total) * 100) : 0
    })).sort((a, b) => b.parts - a.parts);

    return { entries, total };
  }, [ingredients]);

  const { language, isRtl, t } = useLanguage();

  // Determine dominant mood automatically based on top families
  const autoSuggestedMood = useMemo<'citrus' | 'woody' | 'floral' | 'oriental' | 'marine'>(() => {
    const citrusScore = (familyComposition.entries.find(e => e.family === 'Citrus')?.percentage || 0) +
                        (familyComposition.entries.find(e => e.family === 'Fruity')?.percentage || 0);
    const marineScore = (familyComposition.entries.find(e => e.family === 'Marine / Ozone')?.percentage || 0);
    const orientalScore = (familyComposition.entries.find(e => e.family === 'Spicy')?.percentage || 0) +
                          (familyComposition.entries.find(e => e.family === 'Amber')?.percentage || 0) +
                          (familyComposition.entries.find(e => e.family === 'Balsamic')?.percentage || 0);
    const floralScore = (familyComposition.entries.find(e => e.family === 'Floral')?.percentage || 0);
    const woodyScore = (familyComposition.entries.find(e => e.family === 'Woody')?.percentage || 0);

    if (marineScore > 15) return 'marine';
    if (orientalScore > 30) return 'oriental';
    if (citrusScore >= woodyScore && citrusScore >= floralScore && citrusScore > 20) return 'citrus';
    if (floralScore >= woodyScore && floralScore > 25) return 'floral';
    return 'woody';
  }, [familyComposition]);

  const [activeMoodOverride, setActiveMoodOverride] = useState<'citrus' | 'woody' | 'floral' | 'oriental' | 'marine' | null>(null);
  const activeMood = activeMoodOverride || autoSuggestedMood;
  const [isGeneratingMood, setIsGeneratingMood] = useState(false);
  const [customPromptInfo, setCustomPromptInfo] = useState<string | null>(null);

  // Handle generating a custom mood board for the current formula
  const handleGenerateCustomMoodBoard = () => {
    setIsGeneratingMood(true);
    const topFamilies = familyComposition.entries.slice(0, 3).map(e => `${e.family} (${e.percentage}%)`).join(', ');
    const activeMaterials = ingredients
      .map(i => MATERIAL_MAP.get(i.materialId)?.nameEn)
      .filter(Boolean)
      .slice(0, 4)
      .join(', ');
    
    setTimeout(() => {
      setIsGeneratingMood(false);
      setCustomPromptInfo(
        language === 'ar'
          ? `تم توليد اللوحة البصرية التجريدية بناءً على: العائلات السائدة [${topFamilies}] والمكونات الرئيسية [${activeMaterials}] مع توزيع هرمي [Top ${analysis.topPercent}% / Heart ${analysis.heartPercent}% / Base ${analysis.basePercent}%].`
          : `Synthesized abstract visual mood board from: dominant families [${topFamilies}], core notes [${activeMaterials}], and pyramid balance [Top ${analysis.topPercent}% / Heart ${analysis.heartPercent}% / Base ${analysis.basePercent}%].`
      );
    }, 900);
  };

  // Mood metadata definition
  const moodData = {
    citrus: {
      id: 'citrus' as const,
      titleAr: 'صباح حمضي فوار ومشرق',
      titleEn: 'A Vibrant Citrus Morning',
      badgeAr: 'طابع حمضي فوار • Citrus Fresh',
      badgeEn: 'Sparkling Citrus Fresh',
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      image: citrusMorningImg,
      descriptionAr: 'انطباع بصري تجريدي حسّي للأمواج الجزيئية الخفيفة المتطايرة، يعكس انطلاق ذرات البرغموت والجريب فروت مع أشعة شمس الفجر الأولى وقطرات الندى المنعشة.',
      descriptionEn: 'Sensory abstract visualization of light volatile aroma molecules, reflecting sparkling bergamot and grapefruit accords greeting the dawn sunlight and morning dew.',
      palette: ['#F59E0B', '#10B981', '#38BDF8', '#FEF08A'],
      sensoryTags: ['فوار لاذع', 'طاقة صباحية', 'إشراق حمضي', 'تطاير سريع']
    },
    woody: {
      id: 'woody' as const,
      titleAr: 'أمسية خشبية عنبرية دافئة',
      titleEn: 'A Deep Woody Evening',
      badgeAr: 'طابع خشبي عنبري ملكي • Deep Woody',
      badgeEn: 'Noble Deep Woody Amber',
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      image: woodyEveningImg,
      descriptionAr: 'انطباع بصري تجريدي حسّي يجسد كثافة خشب الأرز والباتشولي المعتق مع انصهار بلورات الأمبروكسان والجاوي الدافئ في هدوء الغسق المخملي.',
      descriptionEn: 'Abstract sensory art embodying the resonance of aged cedarwood, patchouli, glowing ambroxan, and benzoin resin in deep twilight elegance.',
      palette: ['#D97706', '#78350F', '#451A03', '#FDE68A'],
      sensoryTags: ['دفء بلسمي', 'أناقة داكنة', 'إشعاع عنبري', 'ثبات فائق']
    },
    floral: {
      id: 'floral' as const,
      titleAr: 'تفتح زهري أبيض ندي وفاخر',
      titleEn: 'An Opulent White Floral Bloom',
      badgeAr: 'طابع زهري مخملي • White Floral',
      badgeEn: 'Opulent Dewy White Floral',
      badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      image: floralBloomImg,
      descriptionAr: 'انطباع بصري حسّي لبتلات الياسمين الشفافة وأزهار زنبق الوادي المشبعة بالندى، ممتزجة مع هالة الهيديون المضيئة ونعومة مسك النظافة الفاخر.',
      descriptionEn: 'Ethereal petals of jasmine and lily bathed in iridescent dewy mist, harmonized by radiant hedione waves and clean powdery white musk.',
      palette: ['#F472B6', '#A78BFA', '#34D399', '#FBCFE8'],
      sensoryTags: ['أثيري نقي', 'إشراق الهيديون', 'بتلات ندية', 'تناغم رومانسي']
    },
    oriental: {
      id: 'oriental' as const,
      titleAr: 'عنبر توابلي شرقي غني',
      titleEn: 'Oriental Spicy Amber Glow',
      badgeAr: 'طابع شرقي دافئ • Oriental Amber',
      badgeEn: 'Warm Oriental Resin & Amber',
      badgeClass: 'bg-red-500/10 text-red-300 border-red-500/30',
      image: orientalAmberImg,
      descriptionAr: 'انطباع بصري حسّي لجمرات القرفة وبذور التونكا المنصهرة في بحيرة من العنبر والجاوي والبنزوين والراتنجات الملكية الفاخرة.',
      descriptionEn: 'Sensory mood board with glowing embers of cinnamon, tonka bean, liquid gold resins, and royal frankincense swirling on black velvet.',
      palette: ['#DC2626', '#B45309', '#D97706', '#450A0A'],
      sensoryTags: ['توابل دافئة', 'عنبر منصهر', 'جاذبية شرقية', 'عمق بخوري']
    },
    marine: {
      id: 'marine' as const,
      titleAr: 'نسيم بحري أوزوني منعش',
      titleEn: 'Fresh Marine Aquatic Ozone',
      badgeAr: 'طابع بحري منعش • Marine Aquatic',
      badgeEn: 'Crisp Oceanic Aquatic Ozone',
      badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      image: marineAquaticImg,
      descriptionAr: 'انطباع بصري تجريدي لبلورات ملح البحر ورذاذ الأمواج الزرقاء المنعشة مع هالة الكالون والسينتينال الشفافة الباردة.',
      descriptionEn: 'Visual mood board featuring sea salt crystals, crisp oceanic breeze vapor, aquamarine waves, and crisp Calone molecules.',
      palette: ['#0284C7', '#38BDF8', '#0EA5E9', '#E0F2FE'],
      sensoryTags: ['رذاذ البحر', 'أوزون منعش', 'ملح نقي', 'كالون بارد']
    }
  }[activeMood];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Presets Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-300">
                {language === 'ar' ? 'مختبر تركيب العطور وحساب التكلفة الدقيقة' : 'Formula Lab: Architecture & Precision EGP Costing'}
              </h2>
              <p className="text-xs text-stone-400">
                {language === 'ar' 
                  ? 'صمم تركيبتك، راقب توازن الهرم العطري، تحقق من أمان IFRA، واحسب التكلفة بالجنيه المصري' 
                  : 'Design accords, monitor olfactory pyramid distribution, audit IFRA 51 safety, and calculate real unit costs in EGP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFormula}
              disabled={ingredients.length === 0}
              className="px-3 py-1.5 rounded-lg border border-stone-700 hover:border-red-500/50 hover:bg-red-950/30 text-stone-300 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تفريغ التركيبة' : 'Clear Formula'}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Accords */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-400 font-semibold ml-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ar' ? 'نماذج أكوردات جاهزة:' : 'Classic Benchmark Accords:'}</span>
          </span>
          {PRESET_ACCORDS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset.id)}
              className="px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 text-xs text-stone-200 hover:text-amber-300 transition-all font-medium"
            >
              {language === 'ar' ? preset.nameAr : preset.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left = Ingredients Editor, Right = Live Analysis & Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Ingredients Table (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Add Material Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs text-stone-400 shrink-0 font-medium">
              {language === 'ar' ? 'إضافة مادة للتركيبة:' : 'Add Material to Formula:'}
            </label>
            <div className="w-full sm:flex-1">
              <MaterialSearchDropdown
                materials={ALL_MATERIALS}
                selectedId={selectedAddId}
                onSelect={(m) => setSelectedAddId(m.id)}
                accentColor="amber"
              />
            </div>
            <button
              onClick={handleAddSelected}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
            </button>
          </div>

          {/* Ingredients List */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-stone-200">
                  {language === 'ar' ? 'قائمة مكونات التركيبة' : 'Active Ingredients Roster'}
                </span>
                <span className="text-xs bg-stone-800 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  {ingredients.length} {language === 'ar' ? 'مواد' : 'items'}
                </span>
              </div>
              <MetricTooltip type="initialMass">
                <span className="text-xs text-stone-400 font-mono cursor-help border-b border-dotted border-stone-700">
                  {language === 'ar' ? 'إجمالي الوزن:' : 'Total Batch Weight:'} <strong className="text-white">{analysis.totalWeight}</strong> {language === 'ar' ? 'جرام / جزء' : 'g / parts'}
                </span>
              </MetricTooltip>
            </div>

            {ingredients.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FlaskConical className="w-12 h-12 text-stone-600 mx-auto" />
                <h3 className="text-stone-300 font-bold text-sm">
                  {language === 'ar' ? 'مختبر التركيب فارغ حالياً' : 'Formula Lab is currently empty'}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {language === 'ar' 
                    ? 'اختر من الـ 139 مادة في القائمة بالأعلى أو انقر على أحد الأكوردات الجاهزة لبدء تجربة وصياغة عطرك!'
                    : 'Select from the 139 materials above or click one of the benchmark accords to start formulating!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-800/80 overflow-x-auto">
                <table className={`w-full text-xs border-collapse min-w-[500px] ${isRtl ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="bg-stone-950/60 text-stone-400 text-[11px]">
                      <th className="p-3 font-semibold">{language === 'ar' ? 'المادة' : 'Material'}</th>
                      <th className="p-3 font-semibold">
                        <MetricTooltip type="pyramidNote">
                          <span>{language === 'ar' ? 'نوتة الهرم' : 'Pyramid Note'}</span>
                        </MetricTooltip>
                      </th>
                      <th className="p-3 font-semibold">{language === 'ar' ? 'الكمية (جرام)' : 'Quantity (g)'}</th>
                      <th className="p-3 font-semibold">{language === 'ar' ? 'نسبة التخفيف' : 'Dilution %'}</th>
                      <th className="p-3 font-semibold">
                        <MetricTooltip type="costEgp">
                          <span>{language === 'ar' ? 'التكلفة (ج.م)' : 'Cost (EGP)'}</span>
                        </MetricTooltip>
                      </th>
                      <th className="p-3 font-semibold text-center">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {ingredients.map((item, idx) => {
                      const mat = MATERIAL_MAP.get(item.materialId);
                      if (!mat) return null;
                      const itemWeightPercent = analysis.totalWeight > 0 
                        ? ((item.parts / analysis.totalWeight) * 100).toFixed(1) 
                        : '0';
                      const pureFactor = (item.dilutionPercent || 100) / 100;
                      const cost = (item.parts * (mat.pricePerGram * pureFactor + (1 - pureFactor) * 1.0)).toFixed(1);

                      return (
                        <tr key={item.materialId} className="hover:bg-stone-850/50 transition-colors">
                          <td className="p-3">
                            <button
                              onClick={() => onSelectMaterial(mat.id)}
                              className="text-right group"
                            >
                              <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                                #{mat.id} {mat.nameAr}
                              </div>
                              <div className="text-[10px] text-stone-400 font-sans" dir="ltr">
                                {mat.nameEn}
                              </div>
                            </button>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-800 text-stone-300">
                              {mat.pyramidNote}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0.1"
                                step="0.5"
                                value={item.parts}
                                onChange={(e) => handlePartsChange(idx, Number(e.target.value))}
                                className="w-16 bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-center font-bold text-white outline-none focus:border-amber-500"
                                aria-label={`Amount ${mat.nameEn}`}
                              />
                              <span className="text-[10px] text-stone-400 font-mono">({itemWeightPercent}%)</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              value={item.dilutionPercent}
                              onChange={(e) => handleDilutionChange(idx, Number(e.target.value))}
                              className="bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-[11px] text-stone-300 outline-none"
                              aria-label={`Dilution ${mat.nameEn}`}
                            >
                              <option value={100}>{language === 'ar' ? '100% نقي' : '100% Pure'}</option>
                              <option value={50}>50% (DPG)</option>
                              <option value={10}>10% (DPG)</option>
                              <option value={1}>1% (DPG)</option>
                              <option value={0.1}>0.1% (DPG)</option>
                            </select>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            <MetricTooltip type="costEgp">
                              <span className="cursor-help border-b border-dotted border-stone-700">
                                {cost} {language === 'ar' ? 'ج.م' : 'EGP'}
                              </span>
                            </MetricTooltip>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleRemove(idx)}
                              className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors"
                              title={language === 'ar' ? 'حذف من التركيبة' : 'Remove from formula'}
                              aria-label={`Remove ${mat.nameEn}`}
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
            )}
          </div>
        </div>

        {/* Right Column: Pyramid Balance, IFRA Audit & Cost (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Pyramid Balance Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'توازن الهرم العطري' : 'Pyramid Distribution Balance'}</span>
              </h3>
              <span className="text-[11px] text-stone-400">{language === 'ar' ? 'النسبة المئوية' : 'Weight %'}</span>
            </div>

            {/* Pyramid Distribution Progress Bars */}
            <div className="space-y-3">
              {/* Top Notes */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <MetricTooltip type="pyramidNote">
                    <span className="text-sky-400 font-semibold cursor-help border-b border-dotted border-stone-700">
                      {language === 'ar' ? 'نوتات القمة (Top Notes)' : 'Top Notes'}
                    </span>
                  </MetricTooltip>
                  <span className="font-mono font-bold text-white">
                    {analysis.topPercent}% <span className="text-[10px] text-stone-400">{language === 'ar' ? '(المثالي: 15-25%)' : '(Ideal: 15-25%)'}</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, analysis.topPercent)}%` }}
                  />
                </div>
              </div>

              {/* Heart Notes */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <MetricTooltip type="pyramidNote">
                    <span className="text-rose-400 font-semibold cursor-help border-b border-dotted border-stone-700">
                      {language === 'ar' ? 'نوتات القلب (Heart Notes)' : 'Heart Notes'}
                    </span>
                  </MetricTooltip>
                  <span className="font-mono font-bold text-white">
                    {analysis.heartPercent}% <span className="text-[10px] text-stone-400">{language === 'ar' ? '(المثالي: 30-45%)' : '(Ideal: 30-45%)'}</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, analysis.heartPercent)}%` }}
                  />
                </div>
              </div>

              {/* Base Notes */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <MetricTooltip type="pyramidNote">
                    <span className="text-amber-400 font-semibold cursor-help border-b border-dotted border-stone-700">
                      {language === 'ar' ? 'نوتات القاعدة (Base Notes)' : 'Base Notes'}
                    </span>
                  </MetricTooltip>
                  <span className="font-mono font-bold text-white">
                    {analysis.basePercent}% <span className="text-[10px] text-stone-400">{language === 'ar' ? '(المثالي: 35-55%)' : '(Ideal: 35-55%)'}</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, analysis.basePercent)}%` }}
                  />
                </div>
              </div>

              {/* Solvents */}
              {analysis.solventPercent > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-purple-400 font-semibold">{language === 'ar' ? 'المذيبات والمثبتات الخاملة' : 'Solvents & Fixatives'}</span>
                    <span className="font-mono font-bold text-white">{analysis.solventPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, analysis.solventPercent)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scent Mood & Synesthesia Abstract Visualizer Card */}
          <div className="bg-stone-900 border border-stone-800 hover:border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4 transition-all overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'التجسيد البصري التجريدي لطابع العطر' : 'Synesthetic Scent Mood Board'}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {language === 'ar' ? 'انطباع حسّي ذكي متولد من العائلات الشمية السائدة بالتركيبة' : 'Visual synesthesia synthesized from primary olfactory accord families'}
                  </p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${moodData.badgeClass}`}>
                {language === 'ar' ? moodData.badgeAr : moodData.badgeEn}
              </span>
            </div>

            {/* Generated Abstract Visual Presentation */}
            <div className="relative group rounded-xl overflow-hidden border border-stone-800 shadow-xl bg-stone-950 aspect-video">
              <img
                src={moodData.image}
                alt={language === 'ar' ? moodData.titleAr : moodData.titleEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex flex-col justify-end p-3.5">
                <div className="text-white font-bold text-sm drop-shadow-md flex items-center justify-between">
                  <span>{language === 'ar' ? moodData.titleAr : moodData.titleEn}</span>
                  <span className="text-[10px] text-amber-300 font-mono" dir="ltr">{language === 'ar' ? moodData.titleEn : moodData.titleAr}</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-tight mt-1 line-clamp-2 drop-shadow">
                  {language === 'ar' ? moodData.descriptionAr : moodData.descriptionEn}
                </p>
              </div>
            </div>

            {/* Mood Controls & Interactive Mode Switching */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400 font-medium">
                  {language === 'ar' ? 'تبديل اللوحة البصرية التجريدية:' : 'Select Abstract Mood Board:'}
                </span>
                {activeMoodOverride && (
                  <button
                    onClick={() => setActiveMoodOverride(null)}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[10px]"
                    title={language === 'ar' ? 'العودة لاقتراح التركيبة التلقائي' : 'Restore automatic formula synchronization'}
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>{language === 'ar' ? 'تزامن ذكي مع التركيبة' : 'Auto-Sync with Formula'}</span>
                  </button>
                )}
              </div>

              {/* 5 Mood Board Presets */}
              <div className="grid grid-cols-5 gap-1">
                <button
                  onClick={() => setActiveMoodOverride('citrus')}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                    activeMood === 'citrus'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'صباح حمضي فوار ومشرق' : 'A Vibrant Citrus Morning'}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{language === 'ar' ? 'حمضي' : 'Citrus'}</span>
                </button>

                <button
                  onClick={() => setActiveMoodOverride('woody')}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                    activeMood === 'woody'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'أمسية خشبية عنبرية دافئة' : 'A Deep Woody Evening'}
                >
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">{language === 'ar' ? 'خشبي' : 'Woody'}</span>
                </button>

                <button
                  onClick={() => setActiveMoodOverride('floral')}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                    activeMood === 'floral'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'تفتح زهري أبيض ندي وفاخر' : 'Opulent White Floral Bloom'}
                >
                  <Flower2 className="w-3.5 h-3.5 text-pink-400" />
                  <span className="truncate">{language === 'ar' ? 'زهري' : 'Floral'}</span>
                </button>

                <button
                  onClick={() => setActiveMoodOverride('oriental')}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                    activeMood === 'oriental'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'عنبر توابلي شرقي غني' : 'Oriental Spicy Amber Glow'}
                >
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span className="truncate">{language === 'ar' ? 'شرقي' : 'Oriental'}</span>
                </button>

                <button
                  onClick={() => setActiveMoodOverride('marine')}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                    activeMood === 'marine'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-stone-950/60 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'نسيم بحري أوزوني منعش' : 'Fresh Marine Aquatic Ozone'}
                >
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                  <span className="truncate">{language === 'ar' ? 'بحري' : 'Marine'}</span>
                </button>
              </div>

              {/* AI Mood Board Generator Button */}
              <button
                onClick={handleGenerateCustomMoodBoard}
                disabled={isGeneratingMood || ingredients.length === 0}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isGeneratingMood ? 'animate-spin' : ''}`} />
                <span>
                  {isGeneratingMood 
                    ? (language === 'ar' ? 'جاري التحليل الشمي وتوليد اللوحة...' : 'Synthesizing Olfactory Visuals...')
                    : (language === 'ar' ? 'توليد لوحة تجريدية جديدة للتركيبة (AI Generate Mood Board)' : 'Generate Custom Mood Board for Formula')}
                </span>
              </button>

              {customPromptInfo && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed animate-fadeIn">
                  {customPromptInfo}
                </div>
              )}
            </div>

            {/* Olfactory Harmony Distribution & Color Swatches */}
            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">
                  {language === 'ar' ? 'العائلات السائدة بالتركيبة:' : 'Dominant Formula Families:'}
                </span>
                <div className="flex items-center gap-1">
                  {moodData.palette.map((color, idx) => (
                    <span 
                      key={idx} 
                      className="w-2.5 h-2.5 rounded-full border border-stone-700 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={`Harmonic Palette ${color}`}
                    />
                  ))}
                </div>
              </div>

              {familyComposition.entries.length === 0 ? (
                <div className="text-[11px] text-stone-500 italic">
                  {language === 'ar' ? 'أضف مواداً لعرض توزيع العائلات الشمية' : 'Add materials to evaluate olfactory family weights'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {familyComposition.entries.slice(0, 4).map((entry, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-stone-900 border border-stone-800 text-stone-300 flex items-center gap-1"
                    >
                      <span className="text-amber-400 font-bold">{entry.family}</span>
                      <span className="text-stone-500">({entry.percentage}%)</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Sensory Tags */}
              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-stone-800/60">
                {moodData.sensoryTags.map((tag, i) => (
                  <span key={i} className="text-[10px] text-stone-400 bg-stone-900/60 px-1.5 py-0.5 rounded border border-stone-800/60">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* IFRA Safety Audit Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-bold text-sm text-stone-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'فحص معايير الأمان الدولية (IFRA Audit)' : 'IFRA 51 Safety Compliance Audit'}</span>
              </h3>
              <span className="text-[10px] text-stone-400">{language === 'ar' ? 'الفئة 4 (العطور)' : 'Category 4 (Fine Fragrance)'}</span>
            </div>

            {analysis.ifraWarnings.length === 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  {language === 'ar' 
                    ? 'جميع المواد ونسبها متوافقة مع معايير IFRA 51 للفئة 4!' 
                    : 'All ingredients and percentages comply with IFRA 51 standards for Category 4!'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {analysis.ifraWarnings.map((warn, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      warn.status === 'Prohibited / Banned' 
                        ? 'bg-red-950/40 border-red-500/50 text-red-300' 
                        : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{language === 'ar' ? warn.warningAr : (warn.warningEn || warn.warningAr)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cost & Batch Estimator Card */}
          <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'حاسبة التكلفة والإنتاج التجاري (EGP)' : 'Commercial Production Cost Estimator (EGP)'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">
                  {language === 'ar' ? 'تركيز العطر بالزجاجة:' : 'Concentration:'}
                </label>
                <select
                  value={fragranceConcentration}
                  onChange={(e) => setFragranceConcentration(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 outline-none"
                >
                  <option value={30}>30% (Extrait de Parfum)</option>
                  <option value={20}>20% (Eau de Parfum)</option>
                  <option value={15}>15% (Eau de Parfum)</option>
                  <option value={10}>10% (Eau de Toilette)</option>
                  <option value={5}>5% (Eau de Cologne)</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">
                  {language === 'ar' ? 'حجم زجاجة العطر:' : 'Bottle Size:'}
                </label>
                <select
                  value={bottleSizeMl}
                  onChange={(e) => setBottleSizeMl(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200 outline-none"
                >
                  <option value={100}>100 {language === 'ar' ? 'مل' : 'ml'}</option>
                  <option value={50}>50 {language === 'ar' ? 'مل' : 'ml'}</option>
                  <option value={30}>30 {language === 'ar' ? 'مل' : 'ml'}</option>
                  <option value={10}>10 {language === 'ar' ? 'مل' : 'ml'}</option>
                </select>
              </div>
            </div>

            {/* Price Calculations Output */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <MetricTooltip type="costEgp">
                  <span className="text-stone-400">{language === 'ar' ? 'إجمالي تكلفة الخلطة الحالية:' : 'Total Formula Cost:'}</span>
                </MetricTooltip>
                <span className="font-mono font-bold text-emerald-400 text-sm">{analysis.totalCostEgp} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="flex justify-between items-center">
                <MetricTooltip type="costEgp">
                  <span className="text-stone-400">{language === 'ar' ? 'تكلفة 100 جرام زيت خام:' : 'Cost per 100g Pure Oil:'}</span>
                </MetricTooltip>
                <span className="font-mono font-semibold text-white">{analysis.costPer100gEgp} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
                <MetricTooltip type="costEgp">
                  <span className="text-amber-300 font-bold">
                    {language === 'ar' 
                      ? `تكلفة الزيت العطري لزجاجة ${bottleSizeMl} مل (${fragranceConcentration}%):`
                      : `Oil Cost for ${bottleSizeMl}ml Bottle (${fragranceConcentration}%):`}
                  </span>
                </MetricTooltip>
                <span className="font-mono font-black text-emerald-400 text-base">{costPerBottleEgp.toFixed(1)} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              {language === 'ar'
                ? '* التكلفة محسوبة بناءً على قائمة أسعار المواد بالجنيه المصري المرفقة في ملف PDF الخاص بك.'
                : '* Cost calculated from your verified catalog price list in Egyptian Pounds (EGP).'}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
