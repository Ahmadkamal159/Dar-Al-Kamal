/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Dna, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AnalogItem {
    cid: number;
    name: string;
    molecularWeight: number;
    formula: string;
}

interface AnalogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    materialName: string;
    cas?: string;
    onSelectAnalog?: (analogName: string) => void;
}

export const AnalogsModal: React.FC<AnalogsModalProps> = ({
    isOpen,
    onClose,
    materialName,
    cas,
    onSelectAnalog,
}) => {
    const { language, isRtl } = useLanguage();
    const [threshold, setThreshold] = useState<number>(85);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analogs, setAnalogs] = useState<AnalogItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sourceCid, setSourceCid] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && materialName) {
            fetchAnalogs();
        }
    }, [isOpen, materialName, threshold]);

    const fetchAnalogs = async () => {
        setIsLoading(true);
        setError(null);
        setAnalogs([]);

        try {
            // 1. جلب رقم CID الخاص بالمادة الأصلية أولاً
            const query = cas || materialName;
            const cidResp = await fetch(
                `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/cids/JSON`
            );

            if (!cidResp.ok) {
                throw new Error(
                    language === 'ar'
                        ? 'تعذر العثور على المعرف الكيميائي (CID) للمادة الأصلية'
                        : 'Could not resolve CID for target material'
                );
            }

            const cidData = await cidResp.json();
            const cid = cidData?.IdentifierList?.CID?.[0];
            if (!cid) throw new Error('CID not found');
            setSourceCid(cid);

            // 2. البحث عن البدائل المتشابهة تركبياً عبر 2D Similarity (Tanimoto Search)
            const simUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastsimilarity_2d/cid/${cid}/cids/JSON?Threshold=${threshold}&MaxRecords=12`;
            const simResp = await fetch(simUrl);

            if (!simResp.ok) {
                setAnalogs([]);
                setIsLoading(false);
                return;
            }

            const simData = await simResp.json();
            const foundCids: number[] = simData?.IdentifierList?.CID || [];
            const filteredCids = foundCids.filter((id) => id !== cid).slice(0, 10);

            if (filteredCids.length === 0) {
                setAnalogs([]);
                setIsLoading(false);
                return;
            }

            // 3. جلب الخصائص الكيميائية التجميعية للبدائل بطلب واحد (Bulk Request)
            const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${filteredCids.join(
                ','
            )}/property/MolecularWeight,MolecularFormula,Title/JSON`;
            const propsResp = await fetch(propsUrl);

            if (propsResp.ok) {
                const propsData = await propsResp.json();
                const items: AnalogItem[] = (propsData?.PropertyTable?.Properties || []).map((p: any) => ({
                    cid: p.CID,
                    name: p.Title || `Compound CID-${p.CID}`,
                    molecularWeight: p.MolecularWeight,
                    formula: p.MolecularFormula,
                }));
                setAnalogs(items);
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ في الاتصال بالسيرفر');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                            <Dna className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span>{language === 'ar' ? `البدائل الجزيئية لـ: ${materialName}` : `Structural Analogs: ${materialName}`}</span>
                            </h3>
                            <p className="text-xs text-stone-400">
                                {language === 'ar'
                                    ? 'بحث الهيكل البنائي والتشابه الكيميائي 2D عبر NIH PubChem Tanimoto Search'
                                    : '2D structural similarity search using Tanimoto index algorithms'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Settings Bar */}
                <div className="p-4 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                        <span className="text-stone-400 shrink-0">
                            {language === 'ar' ? `نسبة التشابه (${threshold}%):` : `Similarity (${threshold}%):`}
                        </span>
                        <input
                            type="range"
                            min="75"
                            max="95"
                            step="5"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full accent-sky-400 cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={fetchAnalogs}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-sky-300 font-bold text-xs flex items-center gap-1.5 border border-stone-700 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{language === 'ar' ? 'تحديث النتائج' : 'Refresh'}</span>
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 overflow-y-auto space-y-3 text-xs">
                    {isLoading ? (
                        <div className="py-12 text-center text-stone-400 space-y-2">
                            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p>{language === 'ar' ? 'جاري البحث عن المركبات المتناظرة هندسياً...' : 'Scanning PubChem 2D Similarity Matrix...'}</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : analogs.length === 0 ? (
                        <div className="py-12 text-center text-stone-400 space-y-1">
                            <p className="font-bold text-stone-300">{language === 'ar' ? 'لم يتم العثور على بدائل بهذه النسبة' : 'No analogs found at this threshold'}</p>
                            <p className="text-[11px] text-stone-500">{language === 'ar' ? 'جرب تقليل نسبة التشابه لـ 80% أو 75%' : 'Try lowering the Tanimoto threshold to 80%'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {analogs.map((item) => (
                                <div
                                    key={item.cid}
                                    className="bg-stone-950 border border-stone-800 hover:border-sky-500/40 rounded-xl p-3 flex flex-col justify-between space-y-2 transition-all group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 mb-1">
                                            <span>CID: {item.cid}</span>
                                            <span className="text-sky-400 font-bold">{item.formula}</span>
                                        </div>
                                        <h4 className="font-bold text-stone-200 group-hover:text-sky-300 transition-colors line-clamp-1">
                                            {item.name}
                                        </h4>
                                        <span className="text-[11px] text-stone-400 font-mono">MW: {item.molecularWeight} g/mol</span>
                                    </div>

                                    {onSelectAnalog && (
                                        <button
                                            onClick={() => {
                                                onSelectAnalog(item.name);
                                                onClose();
                                            }}
                                            className="w-full py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-stone-950 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors mt-2"
                                        >
                                            <span>{language === 'ar' ? 'اختيار للاستبدال' : 'Select as Alternative'}</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};