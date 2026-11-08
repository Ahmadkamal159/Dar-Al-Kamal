/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { KineticSimulationOutput } from '../types/kineticModel';
import { Activity, Clock, Zap, ZoomIn, RotateCcw, Droplets, Skull, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { MetricTooltip } from './MetricTooltip';

interface KineticChartProps {
  simulation: KineticSimulationOutput;
}

const PALETTE = [
  '#38bdf8', // sky-400
  '#f43f5e', // rose-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#a855f7', // purple-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#eab308', // yellow-500
];

type PresetSpan = '15m' | '1h' | '4h' | '8h' | '24h' | 'custom';

export const KineticChart: React.FC<KineticChartProps> = ({ simulation }) => {
  const { language, isRtl } = useLanguage();
  const [hiddenMaterials, setHiddenMaterials] = useState<Record<string, boolean>>({});
  const [activePreset, setActivePreset] = useState<PresetSpan>('24h');
  const [startMinute, setStartMinute] = useState<number>(0);
  const [endMinute, setEndMinute] = useState<number>(1440); // 24 hours
  const [customStartInput, setCustomStartInput] = useState<string>('0');
  const [customEndInput, setCustomEndInput] = useState<string>('1440');
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [hoveredMinute, setHoveredMinute] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const materials = simulation.materials;
  const timePoints = simulation.timeGridPoints;

  // Zoom preset handler
  const handleSelectPreset = (preset: PresetSpan) => {
    setActivePreset(preset);
    setStartMinute(0);
    setRangeError(null);
    let end = 1440;
    switch (preset) {
      case '15m':
        end = 15;
        break;
      case '1h':
        end = 60;
        break;
      case '4h':
        end = 240;
        break;
      case '8h':
        end = 480;
        break;
      case '24h':
      default:
        end = 1440;
        break;
    }
    setEndMinute(end);
    setCustomStartInput('0');
    setCustomEndInput(String(end));
  };

  // Custom arbitrary time span submit
  const handleApplyCustomRange = () => {
    const s = parseInt(customStartInput, 10);
    const e = parseInt(customEndInput, 10);

    if (isNaN(s) || isNaN(e)) {
      setRangeError(language === 'ar' ? 'يرجى إدخال أرقام صحيحة للدقائق' : 'Please enter valid integer minutes');
      return;
    }

    if (s < 0 || s >= 1440) {
      setRangeError(language === 'ar' ? 'دقيقة البداية يجب أن تكون بين 0 و 1439' : 'Start minute must be between 0 and 1439');
      return;
    }

    if (e <= s || e > 1440) {
      setRangeError(language === 'ar' ? `دقيقة النهاية يجب أن تكون أكبر من البداية (${s}) وحتى 1440` : `End minute must be greater than start (${s}) and <= 1440`);
      return;
    }

    setRangeError(null);
    setActivePreset('custom');
    setStartMinute(s);
    setEndMinute(e);
  };

  // Quick shift window left or right
  const handleShiftWindow = (deltaMinutes: number) => {
    const currentSpan = endMinute - startMinute;
    let newStart = startMinute + deltaMinutes;
    let newEnd = endMinute + deltaMinutes;

    if (newStart < 0) {
      newStart = 0;
      newEnd = Math.min(1440, currentSpan);
    }
    if (newEnd > 1440) {
      newEnd = 1440;
      newStart = Math.max(0, 1440 - currentSpan);
    }

    setStartMinute(newStart);
    setEndMinute(newEnd);
    setCustomStartInput(String(newStart));
    setCustomEndInput(String(newEnd));
    setActivePreset('custom');
  };

  const startTimeHours = startMinute / 60.0;
  const endTimeHours = endMinute / 60.0;
  const spanMinutes = Math.max(1, endMinute - startMinute);

  // Filter time points for active view window
  const visiblePoints = useMemo(() => {
    return timePoints.filter(p => {
      const m = p.timeMinutes ?? Math.round(p.timeHours * 60);
      return m >= startMinute && m <= endMinute;
    });
  }, [timePoints, startMinute, endMinute]);

  // Logarithmic Y axis range: 10^-3 to 10^5
  const logMin = -3;
  const logMax = 5;

  const width = 840;
  const height = 440;
  const padding = { top: 35, right: 35, bottom: 50, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const getX = (tHours: number) => {
    const fraction = (tHours - startTimeHours) / (endTimeHours - startTimeHours || 1);
    return padding.left + Math.max(0, Math.min(1, fraction)) * plotWidth;
  };

  const getY = (ov: number) => {
    if (ov <= 0) return padding.top + plotHeight; // Zero mass cut-off bottom
    const clampedOv = Math.max(1e-3, Math.min(1e5, ov));
    const logVal = Math.log10(clampedOv);
    const normalized = (logVal - logMin) / (logMax - logMin);
    return padding.top + (1 - normalized) * plotHeight;
  };

  const toggleMaterial = (mat: string) => {
    setHiddenMaterials(prev => ({ ...prev, [mat]: !prev[mat] }));
  };

  // SVG Paths for each material
  const materialPaths = useMemo(() => {
    if (visiblePoints.length === 0) return [];

    return materials.map((mat, idx) => {
      const color = PALETTE[idx % PALETTE.length];
      const points = visiblePoints.map(p => {
        const x = getX(p.timeHours);
        const ov = p.materialsOv[mat] ?? 0;
        const y = getY(ov);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });

      return {
        material: mat,
        color,
        pathD: `M ${points.join(' L ')}`
      };
    });
  }, [materials, visiblePoints, startMinute, endMinute]);

  // Generate dynamic ticks based on zoom level
  const { xTicks, tickFormat } = useMemo(() => {
    const ticks: number[] = [];
    let format: (m: number) => string;

    if (spanMinutes <= 20) {
      // Step: 2 or 5 min
      const step = spanMinutes <= 15 ? 2 : 5;
      for (let m = startMinute; m <= endMinute; m += step) ticks.push(m);
      if (ticks[ticks.length - 1] !== endMinute) ticks.push(endMinute);
      format = (m) => `${m}m`;
    } else if (spanMinutes <= 90) {
      // Step: 15 min
      for (let m = startMinute; m <= endMinute; m += 15) ticks.push(m);
      if (ticks[ticks.length - 1] !== endMinute) ticks.push(endMinute);
      format = (m) => (m % 60 === 0 ? `${m / 60}h` : `${m}m`);
    } else if (spanMinutes <= 300) {
      // Step: 30 or 60 min
      for (let m = startMinute; m <= endMinute; m += 30) ticks.push(m);
      if (ticks[ticks.length - 1] !== endMinute) ticks.push(endMinute);
      format = (m) => (m % 60 === 0 ? `${m / 60}h` : `${(m / 60).toFixed(1)}h`);
    } else {
      // Step: 2 or 4 hours
      const stepM = spanMinutes <= 720 ? 120 : 240;
      for (let m = startMinute; m <= endMinute; m += stepM) ticks.push(m);
      if (ticks[ticks.length - 1] !== endMinute) ticks.push(endMinute);
      format = (m) => `${(m / 60).toFixed(0)}h`;
    }

    return { xTicks: ticks, tickFormat: format };
  }, [startMinute, endMinute, spanMinutes]);

  const yTicks = [-3, -2, -1, 0, 1, 2, 3, 4, 5];
  const thresholdY = getY(1.0);

  // Handle mouse move over SVG to find exact minute point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    if (mouseX >= padding.left && mouseX <= width - padding.right) {
      const frac = (mouseX - padding.left) / plotWidth;
      const min = Math.round(startMinute + frac * spanMinutes);
      setHoveredMinute(Math.max(0, Math.min(1440, min)));
    } else {
      setHoveredMinute(null);
    }
  };

  const hoveredPoint = useMemo(() => {
    if (hoveredMinute === null) return null;
    return timePoints[hoveredMinute] || null;
  }, [hoveredMinute, timePoints]);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Header & Physical Engine KPIs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-base font-bold text-white">
              {language === 'ar'
                ? 'محاكي الحركية الدقيق (منحنيات OV دقيقة بدقيقة مع نقطة الموت)'
                : 'Dar Al-Kamal Minute-by-Minute Evaporation & Sillage Engine'}
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span>{language === 'ar' ? 'رشة: 50 مجم' : 'Spray: 50mg'}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Δt = 1 {language === 'ar' ? 'دقيقة' : 'min'}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {language === 'ar'
              ? 'نموذج فيزيائي صارم: خصم تراكمي دقيقة بدقيقة، انهيار فوري عند نفاد الكتلة (Zero Mass Cut-off)، وتصحيح وهم السيطرة.'
              : 'Strict chemical physics: cumulative minute depletion, zero-mass cut-off collapse, and base-note rollover extinction.'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <MetricTooltip type="ov">
            <div className="bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 flex items-center gap-1.5 cursor-help">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-stone-400">{language === 'ar' ? 'أعلى فوحان:' : 'Peak Sillage:'}</span>
              <strong className="text-white truncate max-w-[120px]">{simulation.peakOvMaterial}</strong>
            </div>
          </MetricTooltip>

          <MetricTooltip type="t90">
            <div className="bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 flex items-center gap-1.5 cursor-help">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-stone-400">{language === 'ar' ? 'أطول بقاءً:' : 'Longest Tenacity:'}</span>
              <strong className="text-emerald-400 truncate max-w-[120px]">{simulation.longestPerceivedMaterial}</strong>
            </div>
          </MetricTooltip>
        </div>
      </div>

      {/* Interactive Time-Span Zoom Bar (التقريب والتكبير الدقيق وتخصيص أي فترتين زمنيتين) */}
      <div className="bg-stone-950/90 p-4 rounded-xl border border-stone-800 space-y-3 text-xs">
        
        {/* Row 1: Presets & Shift Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-300 flex items-center gap-2 font-bold text-sm">
              <ZoomIn className="w-5 h-5 text-amber-400" />
              <span>{language === 'ar' ? 'فترات التكبير الجاهزة:' : 'Zoom Presets:'}</span>
            </span>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-900 p-1.5 rounded-xl border border-stone-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleSelectPreset('15m')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activePreset === '15m' ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="أول 15 دقيقة (افتتاحية العطر وتبخر الكحول)"
              >
                0-15m
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('1h')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activePreset === '1h' ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="الساعة الأولى (نوتات القمة والقلب المبكر)"
              >
                0-1h
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('4h')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activePreset === '4h' ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="أول 4 ساعات (مرحلة القلب والفوحان)"
              >
                0-4h
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('8h')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activePreset === '8h' ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="أول 8 ساعات (قلب وقاعدة العطر)"
              >
                0-8h
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('24h')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activePreset === '24h' ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="كامل الـ 24 ساعة (ثبات القاعدة)"
              >
                0-24h
              </button>
            </div>
          </div>

          {/* Active Range Badge & Reset */}
          <div className="flex items-center gap-2 font-mono">
            <div className="flex items-center gap-2 text-stone-200 bg-stone-900 px-3.5 py-1.5 rounded-xl border border-stone-800 text-xs">
              <span className="text-stone-400 font-sans">{language === 'ar' ? 'النافذة المعروضة:' : 'Visible Span:'}</span>
              <strong className="text-amber-400 font-bold text-sm">
                {startMinute}m {language === 'ar' ? 'إلى' : 'to'} {endMinute}m
              </strong>
              <span className="text-stone-400">
                ({(startMinute / 60).toFixed(1)}h → {(endMinute / 60).toFixed(1)}h | Δ: {spanMinutes}m)
              </span>
            </div>

            {activePreset !== '24h' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('24h')}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white flex items-center gap-1.5 border border-stone-700 font-sans font-bold text-xs transition-all"
                title="إعادة ضبط لكامل الـ 24 ساعة"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'إعادة ضبط 24h' : 'Reset 24h'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Arbitrary Custom Interval (تحديد أي وقتين بالدقيقة) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800/80">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
              <Clock className="w-4 h-4" />
              <span>{language === 'ar' ? 'تخصيص أي فترتين زمنيتين (بالدقيقة):' : 'Custom Arbitrary Span (Minutes):'}</span>
            </span>

            {/* From Minute Input */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="custom-start-min" className="text-stone-400 text-xs">{language === 'ar' ? 'من دقيقة:' : 'From:'}</label>
              <input
                id="custom-start-min"
                type="number"
                min={0}
                max={1439}
                value={customStartInput}
                onChange={(e) => setCustomStartInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomRange()}
                className="w-18 bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-center font-mono font-bold text-amber-300 text-sm focus:outline-none"
                placeholder="0"
              />
            </div>

            {/* To Minute Input */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="custom-end-min" className="text-stone-400 text-xs">{language === 'ar' ? 'إلى دقيقة:' : 'To:'}</label>
              <input
                id="custom-end-min"
                type="number"
                min={1}
                max={1440}
                value={customEndInput}
                onChange={(e) => setCustomEndInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomRange()}
                className="w-18 bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-center font-mono font-bold text-amber-300 text-sm focus:outline-none"
                placeholder="1440"
              />
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApplyCustomRange}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow flex items-center gap-1"
            >
              <span>{language === 'ar' ? 'تطبيق النطاق ▶' : 'Apply Span ▶'}</span>
            </button>

            {/* Quick Shift Window Left / Right */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleShiftWindow(-15)}
                disabled={startMinute <= 0}
                className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 border border-stone-800"
                title={language === 'ar' ? 'إزاحة النافذة 15 دقيقة للوراء' : 'Shift 15 min left'}
              >
                {isRtl ? '+15m ▶' : '◀ -15m'}
              </button>
              <button
                type="button"
                onClick={() => handleShiftWindow(15)}
                disabled={endMinute >= 1440}
                className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 border border-stone-800"
                title={language === 'ar' ? 'إزاحة النافذة 15 دقيقة للأمام' : 'Shift 15 min right'}
              >
                {isRtl ? '◀ -15m' : '+15m ▶'}
              </button>
            </div>
          </div>

          {/* Quick Examples Shortcut */}
          <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
            <span>{language === 'ar' ? 'أمثلة سريعة:' : 'Quick Examples:'}</span>
            <button
              type="button"
              onClick={() => { setCustomStartInput('10'); setCustomEndInput('45'); setStartMinute(10); setEndMinute(45); setActivePreset('custom'); }}
              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 font-mono"
            >
              10m-45m
            </button>
            <button
              type="button"
              onClick={() => { setCustomStartInput('30'); setCustomEndInput('180'); setStartMinute(30); setEndMinute(180); setActivePreset('custom'); }}
              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 font-mono"
            >
              30m-3h
            </button>
            <button
              type="button"
              onClick={() => { setCustomStartInput('120'); setCustomEndInput('600'); setStartMinute(120); setEndMinute(600); setActivePreset('custom'); }}
              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 font-mono"
            >
              2h-10h
            </button>
          </div>
        </div>

        {/* Validation Error Message */}
        {rangeError && (
          <div className="text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold">
            {rangeError}
          </div>
        )}

      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-x-auto bg-stone-950 rounded-xl border border-stone-800/80 p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[700px] select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredMinute(null)}
        >
          {/* Background Grid Lines (Y-Axis Log Ticks) */}
          {yTicks.map(exp => {
            const y = getY(Math.pow(10, exp));
            return (
              <g key={`y-${exp}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#292524"
                  strokeWidth="1"
                  strokeDasharray={exp === 0 ? '4 2' : undefined}
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill={exp === 0 ? '#f59e0b' : '#78716c'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={exp === 0 ? 'bold' : 'normal'}
                >
                  10^{exp}
                </text>
              </g>
            );
          })}

          {/* X-Axis Grid & Dynamic Minute/Hour Ticks */}
          {xTicks.map(m => {
            const x = getX(m / 60.0);
            return (
              <g key={`x-${m}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#292524"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fill="#a8a29e"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {tickFormat(m)}
                </text>
              </g>
            );
          })}

          {/* Human Olfactory Detection Threshold (OV = 1.0) Golden Line */}
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={width - padding.right}
            y2={thresholdY}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <text
            x={width - padding.right}
            y={thresholdY - 6}
            textAnchor="end"
            fill="#f59e0b"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {language === 'ar' ? 'عتبة الشم البشري (OV = 1.0)' : 'Human Detection Threshold (OV = 1.0)'}
          </text>

          {/* Zero Mass Cut-off Floor Marker */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={width - padding.right}
            y2={padding.top + plotHeight}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="2 4"
          />

          {/* Curves for Each Material */}
          {materialPaths.map(item => {
            if (hiddenMaterials[item.material]) return null;
            return (
              <path
                key={item.material}
                d={item.pathD}
                fill="none"
                stroke={item.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            );
          })}

          {/* Minute Cursor Line & Indicator */}
          {hoveredMinute !== null && (
            <g>
              <line
                x1={getX(hoveredMinute / 60.0)}
                y1={padding.top}
                x2={getX(hoveredMinute / 60.0)}
                y2={height - padding.bottom}
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredMinute / 60.0)}
                cy={height - padding.bottom}
                r="4"
                fill="#fbbf24"
              />
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 10}
            textAnchor="middle"
            fill="#d6d3d1"
            fontSize="11"
            fontWeight="bold"
          >
            {language === 'ar' ? 'الزمن بعد الرش على الجلد (بالدقائق والساعات)' : 'Time Post-Application on Skin (Minutes & Hours)'}
          </text>

          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 18)`}
            textAnchor="middle"
            fill="#d6d3d1"
            fontSize="11"
            fontWeight="bold"
          >
            {language === 'ar' ? 'قيمة الرائحة اللوغاريتمية (Odor Value - OV)' : 'Logarithmic Odor Value (OV)'}
          </text>
        </svg>

        {/* Live Minute Inspector Tooltip at Hover */}
        {hoveredPoint && (
          <div className="mt-3 p-3 bg-stone-900 border border-amber-500/30 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-mono font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'ar' ? 'الدقيقة' : 'Min'} {hoveredPoint.timeMinutes} ({(hoveredPoint.timeMinutes / 60).toFixed(2)}h)
                </span>
              </div>
              <div className="text-stone-300">
                <span className="text-stone-400">{language === 'ar' ? 'الكتلة المتبقية الإجمالية:' : 'Total Batch Mass:'}</span>{' '}
                <strong className="text-emerald-400 font-mono">{hoveredPoint.totalMass} mg</strong>{' '}
                <span className="text-stone-500 font-mono">
                  ({((hoveredPoint.totalMass / (simulation.initialSprayMassMg || 50)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Material Specific OV Breakdown */}
            <div className="flex flex-wrap items-center gap-2 max-w-full">
              {materials.map((mat, idx) => {
                if (hiddenMaterials[mat]) return null;
                const ov = hoveredPoint.materialsOv[mat] ?? 0;
                const mass = hoveredPoint.materialsMass[mat] ?? 0;
                const isDepleted = mass <= 1e-4 || ov <= 0;
                const isPerceived = ov >= 1.0;
                const color = PALETTE[idx % PALETTE.length];

                return (
                  <div
                    key={mat}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 ${
                      isDepleted
                        ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                        : isPerceived
                        ? 'bg-stone-950 border-stone-700 text-stone-200'
                        : 'bg-stone-950/60 border-stone-800 text-stone-500'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-bold truncate max-w-[100px]">{mat}:</span>
                    {isDepleted ? (
                      <span className="text-rose-400 font-bold flex items-center gap-0.5">
                        <Skull className="w-3 h-3" />
                        <span>{language === 'ar' ? 'ميتة (0mg)' : 'Dead'}</span>
                      </span>
                    ) : (
                      <>
                        <span className={isPerceived ? 'text-amber-300 font-bold' : 'text-stone-400'}>
                          OV={ov.toFixed(1)}
                        </span>
                        <span className="text-stone-400 text-[10px]">({mass.toFixed(2)}mg)</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Materials Legend & Visibility Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-800/80">
        <span className="text-xs text-stone-400 font-bold mr-2">
          {language === 'ar' ? 'المواد العطرية في المحاكاة:' : 'Materials in Simulation:'}
        </span>
        {materials.map((mat, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const isHidden = hiddenMaterials[mat];
          const summary = simulation.summaryRows.find(s => s.material === mat);

          return (
            <button
              key={mat}
              type="button"
              onClick={() => toggleMaterial(mat)}
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isHidden
                  ? 'bg-stone-950/40 border-stone-800 text-stone-600 line-through'
                  : 'bg-stone-950 border-stone-700/80 text-stone-200 hover:border-amber-500/50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="font-bold">{mat}</span>
              {summary?.deathTimeMinutes && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                  {language === 'ar' ? `موت: د${summary.deathTimeMinutes}` : `Cut-off: ${summary.deathTimeMinutes}m`}
                </span>
              )}
              {isHidden ? <EyeOff className="w-3 h-3 text-stone-500" /> : <Eye className="w-3 h-3 text-stone-400" />}
            </button>
          );
        })}
      </div>

    </div>
  );
};
