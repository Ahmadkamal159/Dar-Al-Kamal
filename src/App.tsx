/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FlaskConical, 
  BookOpen, 
  Download, 
  Sparkles, 
  Layers, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  DollarSign, 
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  Activity,
  Cpu,
  FileSpreadsheet,
  Database,
  Columns,
  Globe,
  Monitor,
  Atom,
  Type
} from 'lucide-react';
import { ALL_MATERIALS, OLFACTORY_FAMILIES, PYRAMID_NOTES } from './data/materialsData';
import { PerfumeMaterial, PyramidNote, OlfactoryFamily, IfraStatus, FormulaIngredient } from './types/perfumery';
import { useLanguage } from './context/LanguageContext';
import { MaterialCard } from './components/MaterialCard';
import { MaterialDetailModal } from './components/MaterialDetailModal';
import { MaterialSplitViewModal } from './components/MaterialSplitViewModal';
import { SearchGuideModal } from './components/SearchGuideModal';
import { FormulaLab } from './components/FormulaLab';
import { ExportModal } from './components/ExportModal';
import { KineticSimulatorView } from './components/KineticSimulatorView';
import { SmartDataFeeder } from './components/SmartDataFeeder';
import { ListScraperModal } from './components/ListScraperModal';
import { DesktopDeployModal } from './components/DesktopDeployModal';
import { InteractionsLabView } from './components/InteractionsLabView';

export default function App() {
  const { language, toggleLanguage, fontScale, cycleFontScale, t, isRtl } = useLanguage();

  // Navigation Tabs: 'kinetic' | 'interactions' | 'feeder' | 'catalog' | 'lab'
  const [activeTab, setActiveTab] = useState<'kinetic' | 'interactions' | 'feeder' | 'catalog' | 'lab'>('kinetic');

  // Search & Filter State for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<string>('ALL');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedIfra, setSelectedIfra] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'priceAsc' | 'priceDesc' | 'tenacity' | 'name'>('id');

  // Modals state
  const [detailMaterial, setDetailMaterial] = useState<PerfumeMaterial | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isScraperOpen, setIsScraperOpen] = useState(false);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [splitMaterialA, setSplitMaterialA] = useState<PerfumeMaterial | null>(null);
  const [splitMaterialB, setSplitMaterialB] = useState<PerfumeMaterial | null>(null);

  // Formula Lab state
  const [formulaIngredients, setFormulaIngredients] = useState<FormulaIngredient[]>([
    { materialId: 10, parts: 25, dilutionPercent: 100 }, // Bergamot FCF
    { materialId: 40, parts: 30, dilutionPercent: 100 }, // Hedione
    { materialId: 41, parts: 35, dilutionPercent: 100 }, // Iso E Super
    { materialId: 25, parts: 10, dilutionPercent: 100 }, // Ambroxan
  ]);

  // Quick add from card
  const handleQuickAdd = (materialId: number) => {
    const existing = formulaIngredients.find(i => i.materialId === materialId);
    if (existing) {
      setFormulaIngredients(formulaIngredients.map(i => 
        i.materialId === materialId ? { ...i, parts: i.parts + 5 } : i
      ));
    } else {
      setFormulaIngredients([...formulaIngredients, { materialId, parts: 10, dilutionPercent: 100 }]);
    }
  };

  // Add with custom parts and dilution from detail modal
  const handleAddToFormula = (materialId: number, parts: number, dilutionPercent: number) => {
    const existingIndex = formulaIngredients.findIndex(i => i.materialId === materialId);
    if (existingIndex >= 0) {
      const updated = [...formulaIngredients];
      updated[existingIndex].parts += parts;
      updated[existingIndex].dilutionPercent = dilutionPercent;
      setFormulaIngredients(updated);
    } else {
      setFormulaIngredients([...formulaIngredients, { materialId, parts, dilutionPercent }]);
    }
  };

  const handleOpenDetail = (material: PerfumeMaterial) => {
    setDetailMaterial(material);
    setIsDetailOpen(true);
  };

  const handleSelectMaterialById = (id: number) => {
    const found = ALL_MATERIALS.find(m => m.id === id);
    if (found) {
      handleOpenDetail(found);
    }
  };

  // Filtered and Sorted Materials for Catalog
  const filteredMaterials = useMemo(() => {
    return ALL_MATERIALS.filter(m => {
      // Search matches
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNameEn = m.nameEn.toLowerCase().includes(q);
        const matchNameAr = m.nameAr.toLowerCase().includes(q);
        const matchCas = m.cas.toLowerCase().includes(q);
        const matchChemical = m.chemicalName.toLowerCase().includes(q);
        const matchFamily = m.family.toLowerCase().includes(q);
        const matchId = String(m.id) === q || `#${m.id}` === q;
        const matchOdor = m.odorProfileAr.includes(q) || m.odorProfileEn.toLowerCase().includes(q);

        if (!matchNameEn && !matchNameAr && !matchCas && !matchChemical && !matchFamily && !matchId && !matchOdor) {
          return false;
        }
      }

      // Note filter
      if (selectedNote !== 'ALL') {
        if (selectedNote === 'Top' && m.pyramidNote !== 'Top' && m.pyramidNote !== 'Top-Heart') return false;
        if (selectedNote === 'Heart' && m.pyramidNote !== 'Heart' && m.pyramidNote !== 'Top-Heart' && m.pyramidNote !== 'Heart-Base') return false;
        if (selectedNote === 'Base' && m.pyramidNote !== 'Base' && m.pyramidNote !== 'Heart-Base') return false;
        if (selectedNote === 'Solvent' && m.pyramidNote !== 'Solvent') return false;
      }

      // Family filter
      if (selectedFamily !== 'ALL' && m.family !== selectedFamily) {
        return false;
      }

      // IFRA filter
      if (selectedIfra !== 'ALL' && m.ifraStatus !== selectedIfra) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'priceAsc') return a.pricePerGram - b.pricePerGram;
      if (sortBy === 'priceDesc') return b.pricePerGram - a.pricePerGram;
      if (sortBy === 'tenacity') return b.tenacityHours - a.tenacityHours;
      if (sortBy === 'name') return a.nameEn.localeCompare(b.nameEn);
      return 0;
    });
  }, [searchQuery, selectedNote, selectedFamily, selectedIfra, sortBy]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Top Main Navbar */}
      <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-11 h-11 rounded-xl bg-stone-900 border border-amber-500/40 p-1 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0 overflow-hidden">
                <img 
                  src="./assets/dar_alkamal_logo.svg" 
                  alt="دار الكمال للعطور" 
                  className="w-full h-full object-contain filter drop-shadow" 
                />
              </div>
              <div className="shrink-0">
                <h1 className="text-base sm:text-lg font-black text-amber-300 tracking-tight leading-tight flex items-center gap-2">
                  <span className="whitespace-nowrap">{t('app.title')}</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    {t('app.version')}
                  </span>
                </h1>
                <p className="text-[11px] text-stone-400 hidden sm:block whitespace-nowrap">
                  {t('app.subtitle')}
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              
              {/* Tab Switcher */}
              <div className="bg-stone-900 p-1.5 rounded-2xl border border-stone-800 flex items-center gap-1.5 shadow-inner">
                <button
                  onClick={() => setActiveTab('kinetic')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 ${
                    activeTab === 'kinetic'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'محاكي الحركية وقيم الرائحة - حل معادلات التبخر التفاضلية' : 'Kinetic Simulator & Odor Value Engine - Evaporation ODE Solver'}
                >
                  <Activity className="w-5.5 h-5.5 shrink-0" />
                  <span className="whitespace-nowrap">{t('tab.kinetic')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('interactions')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 ${
                    activeTab === 'interactions'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'تفاعلات وتأثيرات المصفوفة غير المثالية والتنافر والتثبيت وقواعد شيف' : 'Non-Ideal Matrix Interactions, Activity Coefficients & Schiff Bases'}
                >
                  <Atom className="w-5.5 h-5.5 shrink-0" />
                  <span className="whitespace-nowrap">{t('tab.interactions')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('feeder')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 ${
                    activeTab === 'feeder'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'مغذي البيانات الذكي والاستعلام المتسلسل من PubChem' : 'Smart Data Feeder & Automated PubChem API Resolver'}
                >
                  <Cpu className="w-5.5 h-5.5 shrink-0" />
                  <span className="whitespace-nowrap">{t('tab.feeder')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 ${
                    activeTab === 'catalog'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'موسوعة الـ 139 مادة المعتمدة مع أسعار الجرام ومعايير IFRA' : '139 Master Catalog with EGP Pricing & IFRA Standards'}
                >
                  <Database className="w-5.5 h-5.5 shrink-0" />
                  <span className="whitespace-nowrap">{t('tab.catalog')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('lab')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2.5 ${
                    activeTab === 'lab'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                  title={language === 'ar' ? 'مختبر التركيب الهرمي وحساب التكلفة الدقيقة بالجنيه' : 'Formula Lab: Accord Architecture & EGP Costing'}
                >
                  <FlaskConical className="w-5.5 h-5.5 shrink-0" />
                  <span className="whitespace-nowrap">{t('tab.lab')}</span>
                </button>
              </div>

              {/* Font Size Scaling Controller Button */}
              <button
                onClick={cycleFontScale}
                className="px-3.5 py-2.5 rounded-xl border border-stone-700 hover:border-amber-400 bg-stone-900 hover:bg-stone-850 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                title={
                  language === 'ar'
                    ? `التحكم في حجم الخط (الحالي: ${fontScale === 'normal' ? '100% عادي' : fontScale === 'large' ? '115% مريح' : '130% كبير'}) - اضغط للتبديل`
                    : `Font scale controller (Current: ${fontScale === 'normal' ? '100%' : fontScale === 'large' ? '115%' : '130%'}) - Click to cycle`
                }
              >
                <Type className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-mono font-black tracking-wider">
                  {fontScale === 'normal' ? 'A (100%)' : fontScale === 'large' ? 'A+ (115%)' : 'A++ (130%)'}
                </span>
              </button>

              {/* Scraper Modal Trigger Button */}
              <button
                onClick={() => setIsScraperOpen(true)}
                className="px-3.5 py-2.5 rounded-xl border border-amber-500/30 hover:border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
                title={language === 'ar' ? 'استخراج وتفكيك القوائم العطرية وفحص المواد المفقودة تلقائياً' : 'Extract formulas & auto-resolve missing chemicals via APIs'}
              >
                <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="hidden lg:inline">{t('nav.scraper')}</span>
              </button>

              {/* Desktop Deployment Guide Button */}
              <button
                onClick={() => setIsDeployOpen(true)}
                className="hidden xl:flex px-3.5 py-2.5 rounded-xl border border-stone-800 hover:border-amber-500/40 bg-stone-900 hover:bg-stone-850 text-amber-300 text-xs sm:text-sm font-bold items-center gap-2 transition-all"
                title={language === 'ar' ? 'دليل التثبيت والتشغيل كبرنامج Windows Desktop' : 'Windows Desktop Deployment Guide'}
              >
                <Monitor className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{t('deploy.button')}</span>
              </button>

              {/* Language Switcher Toggle */}
              <button
                onClick={toggleLanguage}
                className="px-3.5 py-2.5 rounded-xl border border-amber-500/40 hover:border-amber-300 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                title={language === 'ar' ? 'Switch interface to English' : 'التحويل إلى اللغة العربية'}
              >
                <Globe className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-mono font-black">{language === 'ar' ? 'English' : 'العربية'}</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* VIEW 1: KINETIC OV ENGINE (Dar Al-Kamal Smart Brain) */}
        {activeTab === 'kinetic' && (
          <KineticSimulatorView
            onOpenScraper={() => setIsScraperOpen(true)}
            onOpenFeeder={() => setActiveTab('feeder')}
            onOpenInteractions={() => setActiveTab('interactions')}
          />
        )}

        {/* VIEW: MATRIX INTERACTIONS & NON-IDEAL VLE LAB */}
        {activeTab === 'interactions' && (
          <InteractionsLabView />
        )}

        {/* VIEW 2: SMART DATA FEEDER & MULTI-TIER API LOOKUP */}
        {activeTab === 'feeder' && (
          <SmartDataFeeder
            onSelectForSimulation={() => setActiveTab('kinetic')}
          />
        )}

        {/* VIEW 3: FORMULA LAB & COSTING */}
        {activeTab === 'lab' && (
          <FormulaLab
            ingredients={formulaIngredients}
            onUpdateIngredients={setFormulaIngredients}
            onSelectMaterial={handleSelectMaterialById}
          />
        )}

        {/* VIEW 4: MASTER 139 MATERIALS CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            
            {/* Banner Alert in catalog */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-stone-100 flex items-center gap-2">
                    <span>
                      {language === 'ar'
                        ? 'تم استخراج وتوثيق المواصفات التقنية لجميع المواد الـ 139 من أمهات المراجع'
                        : 'Technical Specifications & Chemistry Parameters for All 139 Materials Documented'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      IFRA 51 & TGSC
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed max-w-3xl">
                    {language === 'ar' ? (
                      <>
                        زوّدنا كل مادة برقم الـ <strong className="text-amber-300">CAS Number</strong> الموحد، العائلة الشمية، موقع الهرم، قوة الثبات بالساعات، محددات IFRA، الكثافة، وأسعار الجرام من قائمتك. انقر على أي مادة لمشاهدة بطاقتها الفنية الكاملة أو فك شفرة البحث في TGSC.
                      </>
                    ) : (
                      <>
                        Every material is linked with standard <strong className="text-amber-300">CAS Number</strong>, olfactory family, pyramid note, tenacity hours on blotter, IFRA 51 restrictions, density, and price per gram in EGP. Click any card to inspect full technical data or TGSC search guide.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => {
                    setSplitMaterialA(null);
                    setSplitMaterialB(null);
                    setIsSplitViewOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
                  title={language === 'ar' ? 'مقارنة فنية مزدوجة بين مادتين لتقييم البدائل والأسعار ومحددات IFRA' : 'Side-by-side comparison to evaluate substitutions, prices, and IFRA bounds'}
                >
                  <Columns className="w-4.5 h-4.5" />
                  <span>{language === 'ar' ? 'المقارنة المزدوجة (Split-View)' : 'Split-View Compare'}</span>
                </button>

                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold flex items-center gap-2 border border-stone-700 transition-all"
                >
                  <BookOpen className="w-4.5 h-4.5 text-amber-400" />
                  <span>{language === 'ar' ? 'دليل البحث في TGSC' : 'TGSC Search Guide'}</span>
                </button>

                <button
                  onClick={() => setIsExportOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-2 border border-stone-700 transition-all"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex flex-col md:flex-row gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className={`w-4 h-4 text-stone-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'ابحث بالاسم العربي، الإنجليزي، رقم CAS (مثل 54464-57-2)، أو نوتة الشم...' : 'Search by name, CAS number (e.g. 54464-57-2), or olfactory notes...'}
                    className={`w-full bg-stone-950 border border-stone-700 rounded-xl ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-xs text-stone-100 placeholder-stone-500 outline-none focus:border-amber-500 transition-colors`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs`}
                    >
                      {language === 'ar' ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-stone-400">{language === 'ar' ? 'ترتيب:' : 'Sort by:'}</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-amber-500"
                  >
                    <option value="id">{language === 'ar' ? 'رقم المادة بالورقة (#1 - #139)' : 'Catalog ID (#1 - #139)'}</option>
                    <option value="priceAsc">{language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                    <option value="priceDesc">{language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                    <option value="tenacity">{language === 'ar' ? 'قوة الثبات على الورقة' : 'Tenacity on Blotter'}</option>
                    <option value="name">{language === 'ar' ? 'الاسم الأبجدي الإنجليزي' : 'Alphabetical (A - Z)'}</option>
                  </select>
                </div>

              </div>

              {/* Quick Filter Tags Bar */}
              <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-2 text-xs">
                
                {/* Note Filters */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-stone-500 font-semibold ml-1">{language === 'ar' ? 'الهرم:' : 'Pyramid:'}</span>
                  {['ALL', 'Top', 'Heart', 'Base', 'Solvent'].map(note => (
                    <button
                      key={note}
                      onClick={() => setSelectedNote(note)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        selectedNote === note
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-stone-800/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {note === 'ALL' ? (language === 'ar' ? 'كل النوتات' : 'All Notes') :
                       note === 'Top' ? (language === 'ar' ? 'قمة (Top)' : 'Top') :
                       note === 'Heart' ? (language === 'ar' ? 'قلب (Heart)' : 'Heart') :
                       note === 'Base' ? (language === 'ar' ? 'قاعدة (Base)' : 'Base') : 
                       (language === 'ar' ? 'مذيبات (Solvents)' : 'Solvents')}
                    </button>
                  ))}
                </div>

                <span className="text-stone-700 hidden sm:inline">|</span>

                {/* Family Dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-stone-500 font-semibold">{language === 'ar' ? 'العائلة:' : 'Family:'}</span>
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-[11px] text-stone-200 outline-none"
                  >
                    <option value="ALL">{language === 'ar' ? 'جميع العائلات الشمية' : 'All Olfactory Families'}</option>
                    {OLFACTORY_FAMILIES.map(fam => (
                      <option key={fam} value={fam}>{fam}</option>
                    ))}
                  </select>
                </div>

                <span className="text-stone-700 hidden sm:inline">|</span>

                {/* IFRA Status Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-stone-500 font-semibold">{language === 'ar' ? 'حالة IFRA:' : 'IFRA Status:'}</span>
                  <select
                    value={selectedIfra}
                    onChange={(e) => setSelectedIfra(e.target.value)}
                    className="bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-[11px] text-stone-200 outline-none"
                  >
                    <option value="ALL">{language === 'ar' ? 'الكل' : 'All'}</option>
                    <option value="Compliant">{language === 'ar' ? 'آمن ومعتمد (Compliant)' : 'Compliant / Safe'}</option>
                    <option value="Restricted">{language === 'ar' ? 'مقيد بنسب قصوى (Restricted)' : 'Restricted (Cat 4 Limit)'}</option>
                    <option value="Prohibited / Banned">{language === 'ar' ? 'محظور وممنوع (Banned - Lyral)' : 'Prohibited / Banned'}</option>
                  </select>
                </div>

                {/* Results count */}
                <div className="mr-auto text-[11px] text-stone-400 font-mono">
                  {language === 'ar' ? (
                    <>عرض <strong className="text-amber-300">{filteredMaterials.length}</strong> من أصل 139 مادة</>
                  ) : (
                    <>Showing <strong className="text-amber-300">{filteredMaterials.length}</strong> of 139 materials</>
                  )}
                </div>

              </div>
            </div>

            {/* Materials Grid */}
            {filteredMaterials.length === 0 ? (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center space-y-3">
                <Search className="w-10 h-10 text-stone-600 mx-auto" />
                <h3 className="font-bold text-white text-base">{language === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching materials found'}</h3>
                <p className="text-xs text-stone-400">
                  {language === 'ar' ? 'جرّب البحث باسم آخر أو إزالة بعض الفلاتر لعرض المواد الـ 139' : 'Try another query or reset filters to display the 139 materials'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedNote('ALL');
                    setSelectedFamily('ALL');
                    setSelectedIfra('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold"
                >
                  {language === 'ar' ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMaterials.map(material => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onSelect={handleOpenDetail}
                    onQuickAdd={handleQuickAdd}
                    onCompare={(mat) => {
                      setSplitMaterialA(mat);
                      setSplitMaterialB(null);
                      setIsSplitViewOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            {language === 'ar'
              ? 'دار الكمال • المنظومة الفيزيائية العطرية المتكاملة • مطابقة لمعايير IFRA 51 و The Good Scents Company و NIH PubChem'
              : 'Dar Al-Kamal • Integrated Physical Perfumery System • Compliant with IFRA 51, TGSC & NIH PubChem'}
          </span>
          <div className="flex items-center gap-4 text-stone-400">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              {language === 'ar' ? 'دليل البحث العلمي' : 'Scientific Guide'}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsScraperOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              {language === 'ar' ? 'مستخرج القوائم' : 'List Scraper'}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsExportOpen(true)}
              className="hover:text-amber-300 transition-colors"
            >
              {language === 'ar' ? 'تصدير البيانات' : 'Export Data'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MaterialDetailModal
        material={detailMaterial}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToFormula={handleAddToFormula}
      />

      <SearchGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        materials={filteredMaterials}
      />

      <ListScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        onImportToSimulation={(items) => {
          setActiveTab('kinetic');
        }}
        onImportToLab={(items) => {
          setFormulaIngredients(items.map(i => ({ materialId: i.materialId, parts: i.parts, dilutionPercent: 100 })));
          setActiveTab('lab');
        }}
      />

      <MaterialSplitViewModal
        isOpen={isSplitViewOpen}
        onClose={() => setIsSplitViewOpen(false)}
        initialMaterialA={splitMaterialA}
        initialMaterialB={splitMaterialB}
        onAddToFormula={(id, parts) => {
          handleAddToFormula(id, parts, 100);
        }}
      />

      <DesktopDeployModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
      />

    </div>
  );
}
