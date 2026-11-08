/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Search, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SearchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchGuideModal: React.FC<SearchGuideModalProps> = ({ isOpen, onClose }) => {
  const { language, isRtl } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto text-stone-100 shadow-2xl relative my-8"
        role="dialog"
        aria-labelledby="guide-title"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="sticky top-0 bg-stone-900/95 backdrop-blur border-b border-stone-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 id="guide-title" className="text-xl font-bold text-amber-300">
                {language === 'ar' 
                  ? 'دليل البحث الاحترافي: فك شفرات قواعد البيانات العطرية' 
                  : 'Professional Search Guide: Decoding Fragrance Databases (TGSC & Fragrantica)'}
              </h2>
              <p className="text-xs text-stone-400">
                {language === 'ar'
                  ? 'فك شفرات البحث في أكبر قواعد بيانات العطور والكيمياء العطرية عالمياً'
                  : 'Mastering chemical lookups, CAS numbers, and physical constants across international databases'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label={language === 'ar' ? 'إغلاق الدليل' : 'Close Guide'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm leading-relaxed text-stone-300">
          
          {/* Section 1: The Fragrantica misunderstanding */}
          <div className="bg-stone-800/60 border border-red-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                {language === 'ar' 
                  ? '1. لماذا موقع فراغرانتيكا (Fragrantica) لا يصلح لمواصفات المواد الخام؟' 
                  : '1. Why Fragrantica Is Not Suitable for Raw Material Specifications'}
              </span>
            </div>
            <p className="text-stone-300">
              {language === 'ar' ? (
                <>موقع <strong className="text-amber-200">Fragrantica</strong> هو موسوعة للمستهلك ومحبي العطور الجاهزة في الزجاجات (Commercial Perfumes)، وليس للمركبين وصناع العطور الكيميائيين.</>
              ) : (
                <><strong className="text-amber-200">Fragrantica</strong> is designed for end-consumers and retail perfume enthusiasts, describing marketing impressions rather than analytical formulation constants.</>
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-700/50">
                <span className="text-red-400 font-bold block mb-1">
                  {language === 'ar' ? 'ما يعرضه Fragrantica:' : 'What Fragrantica provides:'}
                </span>
                {language === 'ar'
                  ? 'نوتات تسويقية تخيلية مثل ("رائحة البحر"، "خشب الغابات"، "تفاح أحمر"). لا يقدم أرقام CAS، ولا نسب IFRA، ولا الكثافة، ولا قوة الثبات بالساعات.'
                  : 'Subjective marketing pyramid notes (e.g. "ocean breeze", "deep woods"). Zero CAS numbers, IFRA safety limits, blotter tenacity, vapor pressure, or densities.'}
              </div>
              <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-700/50">
                <span className="text-emerald-400 font-bold block mb-1">
                  {language === 'ar' ? 'ما تحتاجه برامج التصنيع:' : 'What formulation software requires:'}
                </span>
                {language === 'ar'
                  ? 'رقم CAS الدقيق، التركيب الكيميائي، عائلة النوتة الهرمية، الحد الأقصى للأمان (IFRA Cat 4)، ودرجة التطاير والكثافة.'
                  : 'Exact CAS Number, IUPAC nomenclature, odor threshold (ODT), vapor pressure (P₀), IFRA Cat 4 max allowable %, and density.'}
              </div>
            </div>
          </div>

          {/* Section 2: Why TGSC is tricky */}
          <div className="bg-stone-800/60 border border-amber-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
              <Search className="w-5 h-5 shrink-0" />
              <span>
                {language === 'ar' 
                  ? '2. لماذا محرك بحث The Good Scents Company (TGSC) كان محيراً بالنسبة لك؟' 
                  : '2. Why TGSC Search Can Be Deceptive (IUPAC vs Trade Names)'}
              </span>
            </div>
            <p className="text-stone-300">
              {language === 'ar' ? (
                <>موقع <strong className="text-amber-200">The Good Scents Company</strong> هو المرجع الأول عالمياً، لكن محرك بحثه يعتمد على <strong className="text-white">الأسماء الكيميائية النظامية (IUPAC) وأرقام الـ CAS</strong>، وليس الأسماء التجارية الشائعة:</>
              ) : (
                <><strong className="text-amber-200">The Good Scents Company (TGSC)</strong> is the worldwide scientific benchmark, but index lookups rely strictly on <strong className="text-white">systematic IUPAC names and CAS registry numbers</strong>, rather than trade aliases:</>
              )}
            </p>

            {/* Examples table */}
            <div className="overflow-x-auto">
              <table className={`w-full text-xs border-collapse ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="bg-stone-900/90 text-stone-300 border-b border-stone-700">
                    <th className="p-2.5 font-semibold">{language === 'ar' ? 'المادة الشائعة' : 'Common Name'}</th>
                    <th className="p-2.5 font-semibold">{language === 'ar' ? 'البحث بالاسم المجرد' : 'Naive Search Result'}</th>
                    <th className="p-2.5 font-semibold text-amber-400">{language === 'ar' ? 'الاسم الفعلي في TGSC' : 'TGSC Primary Name'}</th>
                    <th className="p-2.5 font-semibold text-emerald-400">CAS Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  <tr className="hover:bg-stone-800/40">
                    <td className="p-2.5 font-bold text-white">C14</td>
                    <td className="p-2.5 text-red-400">{language === 'ar' ? 'لن تجد شيئاً مفيداً!' : 'No direct match!'}</td>
                    <td className="p-2.5 text-amber-300">gamma-Undecalactone (Peach)</td>
                    <td className="p-2.5 font-mono text-emerald-300">104-67-8</td>
                  </tr>
                  <tr className="hover:bg-stone-800/40">
                    <td className="p-2.5 font-bold text-white">C16</td>
                    <td className="p-2.5 text-red-400">{language === 'ar' ? 'نتيجة فارغة' : 'Empty result'}</td>
                    <td className="p-2.5 text-amber-300">Ethyl methylphenylglycidate (Strawberry)</td>
                    <td className="p-2.5 font-mono text-emerald-300">77-83-8</td>
                  </tr>
                  <tr className="hover:bg-stone-800/40">
                    <td className="p-2.5 font-bold text-white">Hedione</td>
                    <td className="p-2.5 text-stone-400">{language === 'ar' ? 'علامة فيرمينيخ' : 'Firmenich trademark'}</td>
                    <td className="p-2.5 text-amber-300">Methyl dihydrojasmonate</td>
                    <td className="p-2.5 font-mono text-emerald-300">24851-98-7</td>
                  </tr>
                  <tr className="hover:bg-stone-800/40">
                    <td className="p-2.5 font-bold text-white">Iso E Super</td>
                    <td className="p-2.5 text-stone-400">{language === 'ar' ? 'علامة IFF' : 'IFF trademark'}</td>
                    <td className="p-2.5 text-amber-300">OTNE / Tetramethyl acetyloctahydronaphthalenes</td>
                    <td className="p-2.5 font-mono text-emerald-300">54464-57-2</td>
                  </tr>
                  <tr className="hover:bg-stone-800/40">
                    <td className="p-2.5 font-bold text-white">Ambroxan</td>
                    <td className="p-2.5 text-stone-400">{language === 'ar' ? 'اسم تجاري شهير' : 'Kao/Henkel trademark'}</td>
                    <td className="p-2.5 text-amber-300">(-)-Ambrox / Naphthofuran</td>
                    <td className="p-2.5 font-mono text-emerald-300">6790-58-5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: The Secret Formula Software Requirements */}
          <div className="bg-stone-800/60 border border-blue-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-base">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                {language === 'ar' 
                  ? '3. ما هي المواصفات التي تطلبها برامج تركيب العطور (Formulator / Waft)؟' 
                  : '3. Technical Specifications Required by Formulation Software'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-stone-900/70 p-3 rounded-lg border border-stone-800">
                <span className="font-bold text-amber-300 block mb-1">1. CAS Number</span>
                {language === 'ar' 
                  ? 'الرقم الكودي الكيميائي الموحد دولياً الذي يتعرف عليه البرنامج لمنع التكرار وحساب نسب IFRA تلقائياً.'
                  : 'Global chemical identifier used to prevent redundancy and automatically cross-reference IFRA standards.'}
              </div>
              <div className="bg-stone-900/70 p-3 rounded-lg border border-stone-800">
                <span className="font-bold text-amber-300 block mb-1">2. Pyramid & Tenacity</span>
                {language === 'ar'
                  ? 'موقع المادة في الهرم (قمة، قلب، قاعدة) وعدد ساعات بقائها على ورقة الشم (Tenacity on Blotter).'
                  : 'Pyramid classification (Top, Heart, Base) and longevity in hours on standard testing blotter strips.'}
              </div>
              <div className="bg-stone-900/70 p-3 rounded-lg border border-stone-800">
                <span className="font-bold text-amber-300 block mb-1">3. IFRA Category 4 Max %</span>
                {language === 'ar'
                  ? 'الحد الأقصى المسموح به للمادة في العطور النهائية لحماية المستهلك من الحساسية والمخالفات القانونية.'
                  : 'Maximum allowable dosage in finished hydroalcoholic fine fragrance under IFRA 51 standards.'}
              </div>
            </div>
          </div>

          {/* Section 4: Critical safety alert about Lyral */}
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                {language === 'ar' 
                  ? 'تنبيه مهني هام جداً بخصوص المادة رقم 105 (Lyral):' 
                  : 'Crucial Regulatory Alert: Material #105 (Lyral)'}
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {language === 'ar' ? (
                <>مادة <strong className="text-white">Lyral (ليرال)</strong> الموجودة في قائمتك، <span className="text-red-400 font-bold underline">محظورة وممنوعة رسمياً 100%</span> من قبل منظمة IFRA والاتحاد الأوروبي لمستحضرات التجميل. البديل العصري الآمن المعتمد لها هو <strong className="text-emerald-300">Mayol (#129) أو Florosa / Florol (#61)</strong>.</>
              ) : (
                <><strong className="text-white">Lyral</strong> is <span className="text-red-400 font-bold underline">100% prohibited globally</span> under IFRA 51 and EU Cosmetics Annex II due to potent dermal sensitization. Safe modern approved substitutes in the catalog are <strong className="text-emerald-300">Mayol (#129) and Florol / Florosa (#61)</strong>.</>
              )}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-stone-900 border-t border-stone-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            {language === 'ar' ? 'فهمت، تصفح المواد الـ 139 الآن' : 'Understood, Explore Catalog Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
