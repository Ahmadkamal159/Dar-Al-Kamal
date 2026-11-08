/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Terminal, 
  Layers, 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  ExternalLink,
  Laptop,
  Cpu,
  Server
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DesktopDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopDeployModal: React.FC<DesktopDeployModalProps> = ({ isOpen, onClose }) => {
  const { language, isRtl } = useLanguage();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const batScript = `@echo off
title دار الكمال - المنظومة الفيزيائية العطرية
echo ========================================================
echo جاري تشغيل دار الكمال Smart Brain كبرنامج ديسكتوب...
echo ========================================================
cd /d "%~dp0"
call npm run preview -- --port 3000
start "" "msedge.exe" --app="http://localhost:3000" --start-maximized
exit`;

  const electronPackageJsonSnippet = `{
  "name": "dar-alkamal-smart-brain",
  "version": "2.5.0",
  "main": "electron-main.cjs",
  "scripts": {
    "electron:dev": "concurrently \\"npm run dev\\" \\"wait-on http://localhost:3000 && electron .\\"",
    "electron:build": "npm run build && electron-builder --win portable"
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="bg-stone-900 border border-amber-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-amber-300">
                {language === 'ar' ? 'دليل التثبيت والتشغيل كبرنامج Windows Desktop' : 'Windows Desktop Deployment & Installation Guide'}
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'ar' ? 'خيارات تحويل المنظومة إلى تطبيق ديسكتوب محلي يعمل بدون إنترنت' : 'Options to run the system as an offline, high-performance desktop app'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-300 leading-relaxed">

          {/* Option 1: PWA Desktop App in 10 seconds */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'الخيار 1: تثبيت مباشر كبرنامج ويندوز مستقل (PWA / Edge Mode)' : 'Option 1: Direct Windows PWA App (Fastest)'}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {language === 'ar' ? 'الأسرع والأسهل (بدون أكواد)' : 'Instant Setup'}
              </span>
            </div>

            <p className="text-stone-300">
              {language === 'ar' 
                ? 'متصفحات Microsoft Edge و Google Chrome تدعم تحويل هذا التطبيق فوراً إلى برنامج ويندوز ديسكتوب أصلي بأيقونة على سطح المكتب وشريط المهام وبدون شريط عنوان المتصفح:' 
                : 'Microsoft Edge and Google Chrome support installing this app as a standalone Windows window with desktop icon and taskbar pinning:'}
            </p>

            <ol className="list-decimal list-inside space-y-1 text-stone-400 pr-2">
              <li>{language === 'ar' ? 'افتح رابط التطبيق في متصفح Microsoft Edge أو Chrome.' : 'Open the app URL in Microsoft Edge or Google Chrome.'}</li>
              <li>{language === 'ar' ? 'اضغط على أيقونة التثبيت (🖥️ أو ➕) في أقصى يمين شريط العنوان.' : 'Click the Install icon in the browser address bar.'}</li>
              <li>{language === 'ar' ? 'أو افتح القائمة (•••) واختر: "Apps" ➔ "Install Dar Al-Kamal as an app".' : 'Or open Menu (•••) ➔ Apps ➔ "Install as App".'}</li>
              <li>{language === 'ar' ? 'اختر "Pin to Taskbar" و "Create Desktop Shortcut" وسيعمل كبرنامج ديسكتوب متكامل.' : 'Select "Pin to Taskbar" and "Desktop Shortcut".'}</li>
            </ol>
          </div>

          {/* Option 2: 1-Click Batch Launcher (.bat) */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>{language === 'ar' ? 'الخيار 2: تشغيل ديسكتوب محلي بسكربت تنفيذي (.bat)' : 'Option 2: 1-Click Windows Batch Launcher (.bat)'}</span>
              </span>
              <button 
                onClick={() => handleCopy(batScript, 1)}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center gap-1.5 transition-all"
              >
                {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 1 ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ السكربت' : 'Copy Script')}</span>
              </button>
            </div>

            <p className="text-stone-300">
              {language === 'ar'
                ? 'أنشئ ملفاً باسم run_dar_alkamal.bat بجوار مجلد المشروع ليفتح التطبيق في نافذة برنامج كاملة:'
                : 'Create a file named run_dar_alkamal.bat in the project folder to launch in full application mode:'}
            </p>

            <pre className="p-3 bg-stone-950 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto border border-stone-800/80" dir="ltr">
              {batScript}
            </pre>
          </div>

          {/* Option 3: Electron .EXE Executable Bundle */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>{language === 'ar' ? 'الخيار 3: تحزيم كبرنامج تنفيذي مستقل (Electron .exe Installer)' : 'Option 3: Standalone Electron .EXE Package'}</span>
              </span>
            </div>

            <p className="text-stone-300">
              {language === 'ar'
                ? 'لتوليد ملف تثبيت Windows Setup.exe حقيقي وتوزيعه للعملاء أو تشغيله على أجهزة المختبر بدون تثبيت أي برامج مسبقة:'
                : 'To build a standalone Windows Setup.exe distributable for lab machines:'}
            </p>

            <div className="space-y-2 font-mono text-[11px]" dir="ltr">
              <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-between">
                <span className="text-amber-400">npm install -D electron electron-builder wait-on concurrently</span>
                <button 
                  onClick={() => handleCopy('npm install -D electron electron-builder wait-on concurrently', 2)}
                  className="p-1 hover:text-white"
                >
                  {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-between">
                <span className="text-emerald-400">npm run build && npx electron-builder --win</span>
                <button 
                  onClick={() => handleCopy('npm run build && npx electron-builder --win', 3)}
                  className="p-1 hover:text-white"
                >
                  {copiedIndex === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <p className="text-stone-400 text-[11px]">
              {language === 'ar' 
                ? 'سيتولد ملف في مجلد dist/ باسم Dar-Alkamal-Setup-2.5.0.exe قابل للتثبيت على أي جهاز ويندوز 10 أو 11 بنقرة واحدة.'
                : 'A portable installer Dar-Alkamal-Setup-2.5.0.exe will be created inside the dist/ folder.'}
            </p>
          </div>

          {/* Option 4: Windows 11 Native Architecture (WinUI 3 vs WPF + Windows App SDK vs Tauri v2) */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'الخيار 4: تحويل إلى تطبيق Windows 11 أصلي (.NET / WinUI 3 / WPF)' : 'Option 4: Windows 11 Native (.NET / WinUI 3 / WPF / Tauri)'}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {language === 'ar' ? 'مقارنة معمارية' : 'Architecture Guide'}
              </span>
            </div>

            <div className="space-y-2 text-stone-300 text-[11px] leading-relaxed">
              <p>
                {language === 'ar'
                  ? 'إذا كنت تفكر في تحويل البرنامج إلى تطبيق ديسكتوب بنظام ويندوز 11، إليك التوصية التقنية الدقيقة:'
                  : 'If you are considering transforming the application into a Windows 11 native desktop app, here is the technical recommendation:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 space-y-1.5">
                  <span className="font-bold text-emerald-400 block">WPF + WPF-UI / WinAppSDK</span>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    {language === 'ar' ? 'الأعلى توافقية واستقراراً' : 'Highest Compatibility & Maturity'}
                  </span>
                  <p className="text-[11px] text-stone-300">
                    {language === 'ar'
                      ? 'يوفر أقصى درجات الاستقرار والتوافق مع مكتبات C# و NuGet القديمة والحديثة. باستخدام حزمة WPF-UI ستحصل على تصميم Windows 11 المودرن (Mica و Dark Mode) دون عيوب WinUI 3 الناشئة.'
                      : 'Recommended for maximum stability and enterprise compatibility. Using the WPF-UI library provides true Windows 11 Mica/Fluent visuals with battle-tested WPF reliability.'}
                  </p>
                  <div className="pt-1.5 border-t border-stone-800 text-[10px] text-emerald-400 font-mono">
                    {language === 'ar' ? 'تم إنشاء السوليوشن كاملاً في مجلد wpf/' : 'Full solution created in wpf/ folder'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 space-y-1.5">
                  <span className="font-bold text-sky-400 block">WinUI 3 (Windows App SDK)</span>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    {language === 'ar' ? 'واجهة مايكروسوفت الحديثة' : 'Modern Windows 11 Native'}
                  </span>
                  <p className="text-[11px] text-stone-300">
                    {language === 'ar'
                      ? 'مصمم خصيصاً لـ Windows 11 بواجهات Fluent Native، لكنه يحتاج Windows 10 (1809+) كحد أدنى ولديه دعم أدوات تصميم أصغر مقارنة بـ WPF.'
                      : 'Built natively for Windows 11 with pure Fluent controls, but requires Windows 10 (1809+) minimum and has a younger ecosystem than WPF.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-stone-900 border border-amber-500/30 space-y-1.5 bg-amber-500/5">
                  <span className="font-bold text-amber-300 block">Tauri v2 (Recommended!)</span>
                  <span className="text-[10px] text-amber-400 block font-mono">
                    {language === 'ar' ? 'بدون إعادة كتابة الكود' : 'No Code Rewrite Needed'}
                  </span>
                  <p className="text-[11px] text-stone-300">
                    {language === 'ar'
                      ? 'يسمح بتشغيل كود React/TypeScript الحالي مباشرة في تطبيق ويندوز 11 فائق الخفة والسرعة (~10MB) مع WebView2 وتأثيرات Mica دون الحاجة لإعادة كتابة الواجهة في XAML.'
                      : 'Packages this entire React/TypeScript codebase into a blazingly fast ~10MB native Windows executable using Windows WebView2 with zero UI rewrite required.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between">
          <div className="text-xs text-stone-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'البيانات والتجارب تحفظ محلياً على جهازك بأمان تام' : 'All data & formulas are safely stored locally'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all"
          >
            {language === 'ar' ? 'إغلاق الدليل' : 'Close Guide'}
          </button>
        </div>

      </div>
    </div>
  );
};
