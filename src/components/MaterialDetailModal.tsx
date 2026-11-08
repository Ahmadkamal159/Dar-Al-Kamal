import React, { useState } from 'react';
import {
    X,
    ExternalLink,
    Copy,
    Check,
    ShieldAlert,
    ShieldCheck,
    Flame,
    Scale,
    Clock,
    Sparkles,
    Plus,
    Droplets,
    Dna
} from 'lucide-react';
import { PerfumeMaterial } from '../types/perfumery';
import { getTgscUrl, getIfraUrl } from '../utils/perfumeryRules';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';
import { AnalogsModal } from './AnalogsModal';

interface MaterialDetailModalProps {
    material: PerfumeMaterial | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToFormula: (materialId: number, parts: number, dilutionPercent: number) => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
    material,
    isOpen,
    onClose,
    onAddToFormula,
}) => {
    const { language, isRtl } = useLanguage();
    const [copiedCas, setCopiedCas] = useState(false);
    const [addParts, setAddParts] = useState<number>(10);
    const [addDilution, setAddDilution] = useState<number>(100);
    const [addedSuccess, setAddedSuccess] = useState(false);

    // التحكم في فتح وإغلاق مودال البدائل الجزيئية
    const [isAnalogsOpen, setIsAnalogsOpen] = useState(false);

    if (!isOpen || !material) return null;

    const handleCopyCas = () => {
        if (material.cas) {
            navigator.clipboard.writeText(material.cas);
            setCopiedCas(true);
            setTimeout(() => setCopiedCas(false), 2000);
        }
    };

    const handleAdd = () => {
        onAddToFormula(material.id, addParts, addDilution);
        setAddedSuccess(true);
        setTimeout(() => setAddedSuccess(false), 1500);
    };

    const tgscUrl = getTgscUrl(material);
    const ifraUrl = getIfraUrl(material);

    const displayState = language === 'ar'
        ? material.pdfState
        : (material.pdfState === 'سائل' ? 'Liquid' : material.pdfState === 'بلورات' ? 'Crystals' : material.pdfState === 'راتنج' ? 'Resinoid' : material.pdfState);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <div
                className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto text-stone-100 shadow-2xl relative my-6"
                role="dialog"
                aria-labelledby="material-title"
            >
                {/* Header */}
                <div className="sticky top-0 bg-stone-900/95 backdrop-blur border-b border-stone-800 p-5 flex items-start justify-between z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <MetricTooltip type="catalogId" showIcon={false}>
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help">
                                    #{material.id}
                                </span>
                            </MetricTooltip>

                            <MetricTooltip type="pyramidNote" showIcon={false}>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold cursor-help ${material.pyramidNote === 'Top' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                        material.pyramidNote === 'Heart' || material.pyramidNote === 'Top-Heart' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            material.pyramidNote === 'Solvent' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>
                                    {language === 'ar' ? `نوتة: ${material.pyramidNote}` : `Note: ${material.pyramidNote}`}
                                </span>
                            </MetricTooltip>

                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                                {material.family}
                            </span>
                        </div>
                        <h2 id="material-title" className="text-xl font-black text-amber-300 flex items-center gap-2">
                            <span>{language === 'ar' ? material.nameAr : material.nameEn}</span>
                            <span className="text-stone-400 font-normal text-sm font-sans" dir="ltr">
                                ({language === 'ar' ? material.nameEn : material.nameAr})
                            </span>
                        </h2>
                        <p className="text-xs text-stone-400 font-mono mt-0.5" dir="ltr">
                            {material.chemicalName}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                        aria-label={language === 'ar' ? 'إغلاق بطاقة المادة' : 'Close material details'}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 text-sm">

                    {/* Key Quick Stats Grid with Tooltips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* CAS Number */}
                        <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60">
                            <span className="text-xs text-stone-400 block mb-1">
                                {language === 'ar' ? 'رقم CAS العالمي' : 'CAS Registry Number'}
                            </span>
                            <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm truncate" dir="ltr">
                                    {material.cas}
                                </span>
                                <button
                                    onClick={handleCopyCas}
                                    className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-amber-300 transition-colors"
                                    title={language === 'ar' ? 'نسخ رقم CAS' : 'Copy CAS number'}
                                    aria-label={language === 'ar' ? 'نسخ رقم CAS' : 'Copy CAS number'}
                                >
                                    {copiedCas ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Price from sheet */}
                        <MetricTooltip type="costEgp">
                            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60 w-full cursor-help">
                                <span className="text-xs text-stone-400 block mb-1">
                                    {language === 'ar' ? 'سعر الجرام (قائمتك)' : 'Price per Gram (Catalog)'}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-emerald-400">{material.pricePerGram}</span>
                                    <span className="text-xs text-stone-400">{language === 'ar' ? 'ج.م / جرام' : 'EGP / g'}</span>
                                </div>
                            </div>
                        </MetricTooltip>

                        {/* Tenacity on blotter */}
                        <MetricTooltip type="tenacity">
                            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60 w-full cursor-help">
                                <span className="text-xs text-stone-400 block mb-1">
                                    {language === 'ar' ? 'قوة الثبات (Blotter)' : 'Blotter Tenacity'}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs text-stone-200">
                                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="font-bold">{material.tenacityHours} {language === 'ar' ? 'ساعة' : 'hours'}</span>
                                </div>
                                <span className="text-[11px] text-stone-400 block truncate">{material.tenacityDescription}</span>
                            </div>
                        </MetricTooltip>

                        {/* IFRA Status */}
                        <MetricTooltip type="ifraLimit">
                            <div className={`p-3 rounded-xl border w-full cursor-help ${material.ifraStatus === 'Prohibited / Banned' ? 'bg-red-950/40 border-red-500/40' :
                                    material.ifraStatus === 'Restricted' ? 'bg-amber-950/40 border-amber-500/40' :
                                        'bg-emerald-950/40 border-emerald-500/40'
                                }`}>
                                <span className="text-xs text-stone-400 block mb-1">
                                    {language === 'ar' ? 'محددات IFRA Cat 4' : 'IFRA 51 Category 4'}
                                </span>
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                    {material.ifraStatus === 'Prohibited / Banned' ? (
                                        <>
                                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                                            <span className="text-red-400">{language === 'ar' ? 'محظور وممنوع' : 'Banned / Prohibited'}</span>
                                        </>
                                    ) : material.ifraStatus === 'Restricted' ? (
                                        <>
                                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                                            <span className="text-amber-400">{language === 'ar' ? `مقيد (${material.ifraCat4LimitPercent}%)` : `Restricted (${material.ifraCat4LimitPercent}%)`}</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="text-emerald-400">{language === 'ar' ? 'آمن بالمعايير' : 'Compliant / Safe'}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </MetricTooltip>
                    </div>

                    {/* Scent Description Box */}
                    <div className="bg-stone-800/40 border border-stone-700/70 rounded-xl p-4 space-y-3">
                        <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>{language === 'ar' ? 'الوصف الشمي والسمات (Olfactory Profile):' : 'Olfactory Profile & Odor Descriptors:'}</span>
                        </h3>
                        <p className="text-stone-200 text-sm leading-relaxed">
                            {language === 'ar' ? material.odorProfileAr : material.odorProfileEn}
                        </p>
                        <p className="text-stone-400 text-xs italic font-sans" dir="ltr">
                            "{language === 'ar' ? material.odorProfileEn : material.odorProfileAr}"
                        </p>
                    </div>

                    {/* Technical Specs Table */}
                    <div className="border border-stone-800 rounded-xl overflow-hidden text-xs">
                        <div className="bg-stone-800/90 px-4 py-2 font-bold text-stone-300 border-b border-stone-700">
                            {language === 'ar'
                                ? 'المواصفات الفنية المعتمدة لبرامج التصنيع (Formula Specifications)'
                                : 'Approved Technical Specifications (Formula Matrix)'}
                        </div>
                        <div className="divide-y divide-stone-800 bg-stone-900/50">
                            <div className="grid grid-cols-3 p-3">
                                <span className="text-stone-400">{language === 'ar' ? 'النسبة الموصى بها في الزيت الخام:' : 'Recommended Raw Oil Concentration:'}</span>
                                <span className="col-span-2 font-semibold text-stone-200">
                                    {material.recommendedConcentrationMin}% {language === 'ar' ? 'إلى' : 'to'} {material.recommendedConcentrationMax}% {language === 'ar' ? 'في الزيت المركز' : 'in pure concentrate'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                                <span className="text-stone-400">{language === 'ar' ? 'التخفيف الموصى به بالمختبر:' : 'Recommended Lab Dilution:'}</span>
                                <span className="col-span-2 text-amber-300 font-medium">
                                    {material.recommendedDilution}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                                <span className="text-stone-400">{language === 'ar' ? 'حالة المادة في القائمة:' : 'Material Physical State:'}</span>
                                <span className="col-span-2 text-stone-200 font-medium">
                                    {displayState}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                                <MetricTooltip type="density">
                                    <span className="text-stone-400">{language === 'ar' ? 'الكثافة (Specific Gravity / Density):' : 'Density / Specific Gravity (20°C):'}</span>
                                </MetricTooltip>
                                <span className="col-span-2 font-mono text-stone-300" dir="ltr">
                                    {material.densityGml ? `${material.densityGml} g/cm³` : (language === 'ar' ? 'غير محدد / صلب' : 'Solid / Undetermined')}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                                <MetricTooltip type="flashPoint">
                                    <span className="text-stone-400">{language === 'ar' ? 'نقطة الوميض (Flash Point):' : 'Flash Point Temperature:'}</span>
                                </MetricTooltip>
                                <span className="col-span-2 font-mono text-stone-300" dir="ltr">
                                    {material.flashPointC ? `${material.flashPointC} °C` : 'N/A'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                                <span className="text-stone-400">{language === 'ar' ? 'الذوبانية وقابلية الامتزاج:' : 'Solubility & Miscibility:'}</span>
                                <span className="col-span-2 text-stone-300">
                                    {material.solubility}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                                <span className="text-stone-400">{language === 'ar' ? 'دور المادة في التركيبة:' : 'Perfumery Role in Matrix:'}</span>
                                <span className="col-span-2 text-emerald-300 font-medium">
                                    {material.perfumeryRole}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 p-3">
                                <span className="text-stone-400">{language === 'ar' ? 'تمتزج بامتياز مع:' : 'Blends Exceptionally With:'}</span>
                                <span className="col-span-2 text-stone-300">
                                    {material.blendsWellWith}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* IFRA Detail Note */}
                    <div className="bg-stone-800/40 p-4 rounded-xl border border-stone-800 text-xs space-y-1">
                        <span className="font-bold text-amber-400 block">{language === 'ar' ? 'تفاصيل وتوجيهات السلامة (IFRA Standard):' : 'Safety Guidance & Toxicological Bounds (IFRA 51):'}</span>
                        <p className="text-stone-300 leading-relaxed">{material.ifraNotesAr}</p>
                    </div>

                    {/* Add to Formula Bar */}
                    <div className="bg-stone-800/70 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-amber-400 shrink-0" />
                            <div>
                                <span className="font-bold text-stone-200 block text-xs">
                                    {language === 'ar' ? 'إضافة المادة لمختبر وحاسبة التركيب' : 'Add Material to Formula Lab & Cost Calculator'}
                                </span>
                                <span className="text-[11px] text-stone-400">
                                    {language === 'ar' ? 'حدد الكمية ونسبة التخفيف لإضافتها لتركيبتك العطرية' : 'Specify parts and dilution percent to add to current formula'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-1 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1">
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.5"
                                    value={addParts}
                                    onChange={(e) => setAddParts(Number(e.target.value) || 0)}
                                    className="w-14 bg-transparent text-center font-bold text-white text-xs outline-none"
                                    aria-label={language === 'ar' ? 'الكمية بالجرام أو الأجزاء' : 'Quantity in parts/grams'}
                                />
                                <span className="text-[10px] text-stone-400">{language === 'ar' ? 'جرام/جزء' : 'parts/g'}</span>
                            </div>

                            <select
                                value={addDilution}
                                onChange={(e) => setAddDilution(Number(e.target.value))}
                                className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-300 outline-none"
                                aria-label={language === 'ar' ? 'نسبة التخفيف' : 'Dilution %'}
                            >
                                <option value={100}>{language === 'ar' ? 'نقي 100%' : '100% Pure'}</option>
                                <option value={50}>50% (DPG)</option>
                                <option value={10}>10% (DPG)</option>
                                <option value={1}>1% (DPG)</option>
                                <option value={0.1}>0.1% (DPG)</option>
                            </select>

                            <button
                                onClick={handleAdd}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 transition-all"
                            >
                                {addedSuccess ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{language === 'ar' ? 'تمت الإضافة!' : 'Added!'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{language === 'ar' ? 'أضف للتركيبة' : 'Add to Formula'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* External Links & Structural Analogs Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800 text-xs">
                        {/* PubChem 2D Analogs Trigger Button */}
                        <button
                            onClick={() => setIsAnalogsOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-stone-950 font-bold text-xs flex items-center gap-1.5 border border-sky-500/20 transition-all shadow-sm"
                        >
                            <Dna className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'بحث عن بدائل جزيئية (PubChem 2D)' : 'Find Structural Analogs'}</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <a
                                href={tgscUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline text-xs"
                            >
                                <span>{language === 'ar' ? 'فتح في The Good Scents Co' : 'Open in The Good Scents Company'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <span className="text-stone-700">•</span>
                            <a
                                href={ifraUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline text-xs"
                            >
                                <span>{language === 'ar' ? 'التحقق في معايير IFRA' : 'Verify in Official IFRA Standards'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* Structural Analogs Modal */}
            <AnalogsModal
                isOpen={isAnalogsOpen}
                onClose={() => setIsAnalogsOpen(false)}
                materialName={material.nameEn}
                cas={material.cas}
                onSelectAnalog={(analogName) => {
                    alert(language === 'ar' ? `تم اختيار البديل الجزيئي: ${analogName}` : `Selected analog: ${analogName}`);
                }}
            />
        </div>
    );
};