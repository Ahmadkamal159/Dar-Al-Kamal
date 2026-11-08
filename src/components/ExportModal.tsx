/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, Check, Copy } from 'lucide-react';
import { PerfumeMaterial } from '../types/perfumery';
import { exportMaterialsToCsv } from '../utils/perfumeryRules';
import { useLanguage } from '../context/LanguageContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: PerfumeMaterial[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, materials }) => {
  const { language, isRtl } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    const csvContent = exportMaterialsToCsv(materials);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `perfumery_materials_specs_${materials.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const jsonContent = JSON.stringify(materials, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `perfumery_materials_database_${materials.length}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCsv = () => {
    const csvContent = exportMaterialsToCsv(materials);
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 text-stone-100 shadow-2xl relative"
        role="dialog"
        aria-labelledby="export-title"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-title" className="text-lg font-bold text-amber-300">
                {language === 'ar' ? 'تصدير بيانات المواد العطرية' : 'Export Fragrance Materials Database'}
              </h2>
              <p className="text-xs text-stone-400">
                {language === 'ar' 
                  ? 'متوافق مع برامج تصنيع العطور (Formulator، Excel، Waft)' 
                  : 'Compatible with industry formulators (Formulator, Excel, Waft)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label={language === 'ar' ? 'إغلاق نافذة التصدير' : 'Close Export'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-stone-300 leading-relaxed">
            {language === 'ar' ? (
              <>
                يحتوي ملف التصدير على جميع البيانات التقنية لـ <strong className="text-amber-300">{materials.length} مادة</strong>:
                رقم الـ CAS، الأسماء الإنجليزية والكيميائية، النوتة الهرمية، قوة الثبات، حدود IFRA، الكثافة، وأسعار الجرام بالجنيه المصري.
              </>
            ) : (
              <>
                Export file contains validated analytical parameters for <strong className="text-amber-300">{materials.length} materials</strong>:
                CAS numbers, IUPAC nomenclature, pyramid notes, blotter tenacity, IFRA 51 safety caps, density, and unit prices in EGP.
              </>
            )}
          </p>

          <div className="space-y-3 pt-2">
            {/* CSV Export Option */}
            <div className="bg-stone-800/60 border border-stone-700/80 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {language === 'ar' ? 'ملف CSV (Excel & Formulator)' : 'CSV Spreadsheet (Excel & Formulators)'}
                  </h3>
                  <span className="text-[11px] text-stone-400 block">
                    {language === 'ar' ? 'الصيغة القياسية لبرامج إدارة العطور والجداول' : 'Standard delimiter format for spreadsheets & labs'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تحميل CSV' : 'Download CSV'}</span>
              </button>
            </div>

            {/* JSON Export Option */}
            <div className="bg-stone-800/60 border border-stone-700/80 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileCode className="w-8 h-8 text-blue-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {language === 'ar' ? 'ملف JSON (قاعدة بيانات مبرمجين)' : 'JSON Schema (API & Developer DB)'}
                  </h3>
                  <span className="text-[11px] text-stone-400 block">
                    {language === 'ar' ? 'بيانات برمجية مهيكلة لدمجها مع أي تطبيق' : 'Structured JSON data for programmatic integration'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDownloadJson}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تحميل JSON' : 'Download JSON'}</span>
              </button>
            </div>
          </div>

          {/* Quick Copy to Clipboard */}
          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-stone-400">
              {language === 'ar' ? 'أو يمكنك نسخ البيانات مباشرة للحافظة:' : 'Or copy raw CSV directly to clipboard:'}
            </span>
            <button
              onClick={handleCopyCsv}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{language === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'نسخ جدول CSV' : 'Copy CSV'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
