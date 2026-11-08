/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Play, 
  Layers, 
  Cpu
} from 'lucide-react';
import { KineticFragranceMaterial } from '../types/kineticModel';
import { findScientificMaterial } from '../data/scientificDatabase';
import { enrichMaterialScientifically } from '../services/scientificEnrichmentService';
import { ALL_MATERIALS } from '../data/materialsData';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';

interface ParsedMaterialRow {
  rawLine: string;
  name: string;
  cas: string;
  parts: number;
  matchedData: KineticFragranceMaterial | null;
  status: 'matched' | 'missing' | 'enriching' | 'enriched' | 'failed';
  enrichmentSource?: string;
}

interface ListScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToSimulation?: (items: { name: string; parts: number }[]) => void;
  onImportToLab?: (items: { materialId: number; parts: number }[]) => void;
  onNewMaterialsSaved?: () => void;
}

export const ListScraperModal: React.FC<ListScraperModalProps> = ({
  isOpen,
  onClose,
  onImportToSimulation,
  onImportToLab,
  onNewMaterialsSaved,
}) => {
  const { language, isRtl } = useLanguage();
  const [inputText, setInputText] = useState(`Ambroxan, 6790-58-5, 15
Hedione, 24851-98-7, 30
Iso E Super, 54464-57-2, 35
Bergamot Oil, 8007-75-8, 20
Linalool, 78-70-6, 10
Vanillin, 121-33-5, 5`);

  const [parsedRows, setParsedRows] = useState<ParsedMaterialRow[]>([]);
  const [, setIsProcessingFile] = useState(false);
  const [isBatchEnriching, setIsBatchEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Parser: converts pasted text or CSV into structured rows
  const handleParseInput = (textToParse: string) => {
    const lines = textToParse.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const results: ParsedMaterialRow[] = [];

    for (const line of lines) {
      if (line.startsWith('#') || (line.toLowerCase().includes('material') && line.toLowerCase().includes('cas'))) {
        continue;
      }

      // Check for CAS pattern
      const casMatch = line.match(/\b\d{2,7}-\d{2}-\d\b/);
      const foundCas = casMatch ? casMatch[0] : '';

      let parts = 10;
      let name = '';

      const tokens = line.split(/[,;\t|]+/).map(t => t.trim());

      if (tokens.length >= 2) {
        let numFound = false;
        const nameCandidates: string[] = [];

        for (const token of tokens) {
          if (token === foundCas) continue;
          const num = parseFloat(token.replace(/%/g, '').replace(/g/g, ''));
          if (!isNaN(num) && !numFound && num > 0 && num < 10000) {
            parts = num;
            numFound = true;
          } else {
            nameCandidates.push(token);
          }
        }
        name = nameCandidates.join(' ').trim();
      } else {
        let clean = line;
        if (foundCas) clean = clean.replace(foundCas, '');
        const numMatch = clean.match(/\b\d+(\.\d+)?\b/);
        if (numMatch) {
          parts = parseFloat(numMatch[0]) || 10;
          clean = clean.replace(numMatch[0], '');
        }
        name = clean.replace(/[,\t;|#]/g, '').trim();
      }

      if (!name && foundCas) name = `CAS_${foundCas}`;
      if (!name) continue;

      // Try matching against local verified database
      const matched = findScientificMaterial(name) || (foundCas ? findScientificMaterial(foundCas) : undefined);

      results.push({
        rawLine: line,
        name,
        cas: foundCas || (matched ? matched.cas : ''),
        parts,
        matchedData: matched || null,
        status: matched ? 'matched' : 'missing',
      });
    }

    setParsedRows(results);
  };

  // Handle file drop / upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      handleParseInput(content);
      setIsProcessingFile(false);
    };
    reader.onerror = () => {
      alert(language === 'ar' ? 'تعذر قراءة الملف' : 'Failed to read file');
      setIsProcessingFile(false);
    };
    reader.readAsText(file);
  };

  // Run Batch Multi-Tier API Enrichment for all missing items
  const handleBatchEnrich = async () => {
    const missingIndices = parsedRows
      .map((r, idx) => (r.status === 'missing' || r.status === 'failed') ? idx : -1)
      .filter(idx => idx !== -1);

    if (missingIndices.length === 0) {
      setNotification(language === 'ar' ? 'جميع المواد موثقة وموجودة بالفعل في قاعدة البيانات' : 'All materials are already validated in the database');
      return;
    }

    setIsBatchEnriching(true);
    setEnrichmentProgress({ current: 0, total: missingIndices.length });

    const updatedRows = [...parsedRows];
    let newlySavedCount = 0;

    for (let i = 0; i < missingIndices.length; i++) {
      const rowIndex = missingIndices[i];
      const row = updatedRows[rowIndex];

      updatedRows[rowIndex] = { ...row, status: 'enriching' };
      setParsedRows([...updatedRows]);

      try {
        const query = row.cas || row.name;
        const result = await enrichMaterialScientifically(query);

        updatedRows[rowIndex] = {
          ...row,
          name: result.material.name,
          cas: result.material.cas,
          matchedData: result.material,
          status: 'enriched',
          enrichmentSource: result.matchedTier,
        };

        // Persist newly discovered material into localStorage
        try {
          const key = 'dar_alkamal_custom_materials_v1';
          const saved = localStorage.getItem(key);
          const current: KineticFragranceMaterial[] = saved ? JSON.parse(saved) : [];
          if (!current.some(m => m.name.toLowerCase() === result.material.name.toLowerCase())) {
            current.push(result.material);
            localStorage.setItem(key, JSON.stringify(current));
            newlySavedCount++;
          }
        } catch (e) {
          console.error(e);
        }
      } catch (err) {
        updatedRows[rowIndex] = { ...row, status: 'failed' };
      }

      setEnrichmentProgress({ current: i + 1, total: missingIndices.length });
      setParsedRows([...updatedRows]);
    }

    setIsBatchEnriching(false);
    if (newlySavedCount > 0 && onNewMaterialsSaved) {
      onNewMaterialsSaved();
    }
    setNotification(
      language === 'ar'
        ? `اكتمل الفحص! تم إثراء وتوثيق المواد وحفظ ${newlySavedCount} مادة جديدة في قاعدة البيانات.`
        : `Enrichment complete! Saved ${newlySavedCount} new validated materials to local database.`
    );
  };

  // Send to Kinetic Simulator
  const handleSendToSimulation = () => {
    if (!onImportToSimulation) return;
    const items = parsedRows.map(r => ({
      name: r.matchedData ? r.matchedData.name : r.name,
      parts: r.parts,
    }));
    onImportToSimulation(items);
    onClose();
  };

  // Send to Formula Lab
  const handleSendToLab = () => {
    if (!onImportToLab) return;
    const items: { materialId: number; parts: number }[] = [];

    parsedRows.forEach(r => {
      const found = ALL_MATERIALS.find(m => 
        m.nameEn.toLowerCase() === r.name.toLowerCase() ||
        m.nameAr.includes(r.name) ||
        (r.cas && m.cas === r.cas)
      );
      if (found) {
        items.push({ materialId: found.id, parts: r.parts });
      }
    });

    if (items.length > 0) {
      onImportToLab(items);
      onClose();
    } else {
      alert(
        language === 'ar'
          ? 'لم يتم العثور على تطابق مباشر مع مواد كتالوج الـ 139، ولكن يمكنك استخدامها في محاكي الحركية!'
          : 'No direct ID match found in the 139 base catalog, but materials can be loaded into Kinetic Simulator!'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{language === 'ar' ? 'مستخرج القوائم الذكي والفحص التلقائي بالـ APIs' : 'Smart List Scraper & Automated API Feeder'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Smart List Scraper
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                {language === 'ar' 
                  ? 'الصق أي قائمة عطرية أو ارفع ملف CSV/TXT؛ سيتعرف النظام على المواد ويستعلم تلقائياً عن المفقود منها عبر NIH PubChem'
                  : 'Paste formula text or upload CSV/TXT files; the system identifies materials and queries NIH PubChem for missing physical constants'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          
          {/* Top Actions & Paste Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-stone-300 font-bold flex items-center gap-2">
                <span>{language === 'ar' ? 'الصق نص القائمة أو جدول المكونات:' : 'Paste formula list or ingredients table:'}</span>
                <span className="text-stone-500 text-[11px] font-normal">
                  {language === 'ar' ? '(يقبل: اسم المادة، رقم CAS، النسبة أو الأجزاء)' : '(Accepts: name, CAS, parts/percentages)'}
                </span>
              </label>

              {/* File upload input */}
              <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-stone-700 hover:border-amber-500 bg-stone-950 hover:bg-stone-800 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-all">
                <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'ar' ? 'رفع ملف CSV / TXT' : 'Upload CSV / TXT'}</span>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ambroxan, 6790-58-5, 15&#10;Hedione, 24851-98-7, 30..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-stone-100 font-mono text-xs outline-none focus:border-amber-500 transition-colors"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleParseInput(inputText)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-xl flex items-center gap-2 border border-stone-700 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'تحليل وتفكيك المواد (Parse List)' : 'Parse & Extract Materials'}</span>
              </button>

              {parsedRows.length > 0 && (
                <div className="text-[11px] text-stone-400 font-mono">
                  {language === 'ar' 
                    ? <>تم استخراج <strong className="text-amber-300">{parsedRows.length}</strong> مادة</> 
                    : <>Extracted <strong className="text-amber-300">{parsedRows.length}</strong> materials</>}
                </div>
              )}
            </div>
          </div>

          {/* Notification Banner */}
          {notification && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Parsed Results Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-stone-800 pt-3">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{language === 'ar' ? 'جدول المواد المستخرجة وحالة التوثيق الفيزيائي:' : 'Extracted Materials & Physical Verification:'}</span>
                </div>

                {/* Batch Enrich Button */}
                <button
                  type="button"
                  onClick={handleBatchEnrich}
                  disabled={isBatchEnriching}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isBatchEnriching ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'ar' ? `جاري الفحص (${enrichmentProgress.current}/${enrichmentProgress.total})...` : `Enriching (${enrichmentProgress.current}/${enrichmentProgress.total})...`}</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>{language === 'ar' ? 'فحص واستكمال المواد المفقودة عبر الـ APIs' : 'Batch Enrich Missing Materials via APIs'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-stone-800 rounded-xl max-h-[320px]">
                <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                  <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 font-mono text-[11px] sticky top-0">
                    <tr>
                      <th className="p-2.5">{language === 'ar' ? 'المادة' : 'Material'}</th>
                      <th className="p-2.5">CAS</th>
                      <th className="p-2.5">
                        <MetricTooltip type="initialMass">
                          <span className="cursor-help border-b border-dotted border-stone-600">
                            {language === 'ar' ? 'الأجزاء' : 'Parts'}
                          </span>
                        </MetricTooltip>
                      </th>
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
                      <th className="p-2.5">{language === 'ar' ? 'حالة التوثيق' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                    {parsedRows.map((row, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-stone-850/60">
                          <td className="p-2.5 font-bold text-stone-200 font-sans">{row.name}</td>
                          <td className="p-2.5 text-stone-400">{row.cas || '—'}</td>
                          <td className="p-2.5 text-amber-300 font-bold">{row.parts}</td>
                          <td className="p-2.5 text-stone-300">{row.matchedData?.molecularWeight ? row.matchedData.molecularWeight.toFixed(1) : '—'}</td>
                          <td className="p-2.5 text-stone-300">
                            {row.matchedData?.vaporPressure !== undefined ? row.matchedData.vaporPressure.toExponential(2) : '—'}
                          </td>
                          <td className="p-2.5 text-emerald-400">
                            {row.matchedData?.odt !== undefined ? row.matchedData.odt.toFixed(2) : '—'}
                          </td>
                          <td className="p-2.5">
                            {row.status === 'matched' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-sans font-bold flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>{language === 'ar' ? 'موثق بالقاعدة' : 'Verified'}</span>
                              </span>
                            )}
                            {row.status === 'enriched' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/20 font-sans font-bold flex items-center gap-1 w-max">
                                <Sparkles className="w-3 h-3 text-sky-400" />
                                <span>{language === 'ar' ? 'تم الاستعلام تلقائياً' : 'API Resolved'}</span>
                              </span>
                            )}
                            {row.status === 'enriching' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 font-sans font-bold flex items-center gap-1 w-max animate-pulse">
                                <Cpu className="w-3 h-3 animate-spin" />
                                <span>{language === 'ar' ? 'جاري الاستعلام...' : 'Resolving...'}</span>
                              </span>
                            )}
                            {row.status === 'missing' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans font-bold flex items-center gap-1 w-max">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>{language === 'ar' ? 'يحتاج استعلام API' : 'Needs Lookup'}</span>
                              </span>
                            )}
                            {row.status === 'failed' && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 font-sans font-bold w-max">
                                {language === 'ar' ? 'تعذر الجلب تلقائياً' : 'Lookup Failed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            {language === 'ar'
              ? `${parsedRows.filter(r => r.status === 'matched' || r.status === 'enriched').length} من أصل ${parsedRows.length} مادة جاهزة تماماً للحسابات الحركية`
              : `${parsedRows.filter(r => r.status === 'matched' || r.status === 'enriched').length} of ${parsedRows.length} materials ready for kinetic analysis`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendToSimulation}
              disabled={parsedRows.length === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'ar' ? 'إرسال إلى المحاكي الحركي (OV Brain)' : 'Send to Kinetic Simulator (OV)'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendToLab}
              disabled={parsedRows.length === 0}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إرسال لمختبر التركيب' : 'Send to Formula Lab'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
