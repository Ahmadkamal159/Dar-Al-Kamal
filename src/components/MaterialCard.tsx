/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Clock, Plus, ExternalLink, ShieldAlert, ShieldCheck, Columns } from 'lucide-react';
import { PerfumeMaterial } from '../types/perfumery';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';

interface MaterialCardProps {
  material: PerfumeMaterial;
  onSelect: (material: PerfumeMaterial) => void;
  onQuickAdd: (materialId: number) => void;
  onCompare?: (material: PerfumeMaterial) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ 
  material, 
  onSelect, 
  onQuickAdd,
  onCompare 
}) => {
  const { language, isRtl } = useLanguage();
  const [copiedCas, setCopiedCas] = useState(false);

  const handleCopyCas = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (material.cas) {
      navigator.clipboard.writeText(material.cas);
      setCopiedCas(true);
      setTimeout(() => setCopiedCas(false), 2000);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd(material.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompare) {
      onCompare(material);
    }
  };

  const getNoteBadgeStyle = () => {
    switch (material.pyramidNote) {
      case 'Top':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Top-Heart':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'Heart':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Heart-Base':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Base':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Solvent':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  // State translation
  const displayState = language === 'ar'
    ? material.pdfState
    : (material.pdfState === 'سائل' ? 'Liquid' : material.pdfState === 'بلورات' ? 'Crystals' : material.pdfState === 'راتنج' ? 'Resinoid' : material.pdfState);

  return (
    <div
      onClick={() => onSelect(material)}
      className="group relative bg-stone-900/80 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <MetricTooltip type="catalogId" showIcon={false}>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help">
                #{material.id}
              </span>
            </MetricTooltip>

            <MetricTooltip type="pyramidNote" showIcon={false}>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getNoteBadgeStyle()} cursor-help`}>
                {material.pyramidNote}
              </span>
            </MetricTooltip>

            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-800 text-stone-300 border border-stone-700">
              {material.family}
            </span>
          </div>

          {/* IFRA Status Mini Icon */}
          <div>
            {material.ifraStatus === 'Prohibited / Banned' ? (
              <MetricTooltip type="ifraLimit" showIcon={false}>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-1.5 py-0.5 rounded cursor-help">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{language === 'ar' ? 'محظور' : 'Banned'}</span>
                </span>
              </MetricTooltip>
            ) : material.ifraStatus === 'Restricted' ? (
              <MetricTooltip type="ifraLimit" showIcon={false}>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded cursor-help">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{language === 'ar' ? `مقيد ${material.ifraCat4LimitPercent}%` : `Restricted ${material.ifraCat4LimitPercent}%`}</span>
                </span>
              </MetricTooltip>
            ) : (
              <MetricTooltip type="ifraLimit" showIcon={false}>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded cursor-help">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'ar' ? 'آمن' : 'Safe'}</span>
                </span>
              </MetricTooltip>
            )}
          </div>
        </div>

        {/* Name in Arabic and English dynamically prioritized */}
        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
          {language === 'ar' ? material.nameAr : material.nameEn}
        </h3>
        <p className="text-xs text-stone-400 font-sans line-clamp-1 mb-2" dir="ltr">
          {language === 'ar' ? material.nameEn : material.nameAr}
        </p>

        {/* CAS Number Box with 1-click copy */}
        <div className="flex items-center justify-between bg-stone-950/60 px-2 py-1.5 rounded-lg border border-stone-800/80 mb-2.5">
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-[10px] text-stone-400 shrink-0">CAS:</span>
            <span className="text-xs font-mono text-amber-300 font-semibold truncate" dir="ltr">
              {material.cas}
            </span>
          </div>
          <button
            onClick={handleCopyCas}
            className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors shrink-0"
            title={language === 'ar' ? 'نسخ رقم CAS' : 'Copy CAS number'}
            aria-label={`Copy CAS ${material.nameEn}`}
          >
            {copiedCas ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Olfactory Snippet in selected language */}
        <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed mb-3">
          {language === 'ar' ? material.odorProfileAr : material.odorProfileEn}
        </p>
      </div>

      {/* Bottom Footer Info */}
      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
        {/* Price & State with Tooltip */}
        <MetricTooltip type="costEgp" showIcon={false}>
          <div className="flex items-baseline gap-1 cursor-help">
            <span className="font-black text-emerald-400 text-sm">{material.pricePerGram}</span>
            <span className="text-[10px] text-stone-400">{language === 'ar' ? 'ج.م / ج' : 'EGP/g'}</span>
            <span className="text-stone-600">|</span>
            <span className="text-[10px] text-stone-400 truncate max-w-[60px]">{displayState}</span>
          </div>
        </MetricTooltip>

        {/* Actions: Compare + Tenacity + Quick Add */}
        <div className="flex items-center gap-1">
          <MetricTooltip type="tenacity" showIcon={false}>
            <div className="flex items-center gap-1 text-[11px] text-stone-400 px-1.5 py-0.5 rounded bg-stone-950/50 cursor-help">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{material.tenacityHours}h</span>
            </div>
          </MetricTooltip>

          {onCompare && (
            <button
              onClick={handleCompare}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-sky-300 transition-colors"
              title={language === 'ar' ? 'مقارنة وتقييم الاستبدال (Split-View)' : 'Compare & evaluate substitution (Split-View)'}
              aria-label={`Compare ${material.nameEn}`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleQuickAdd}
            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-stone-950 transition-colors"
            title={language === 'ar' ? 'إضافة سريعة لمختبر التركيب' : 'Quick add to Formula Lab'}
            aria-label={`Add ${material.nameEn} to formula`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
