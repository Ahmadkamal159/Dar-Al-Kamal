/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';
export type FontSizeScale = 'normal' | 'large' | 'xlarge';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  fontScale: FontSizeScale;
  setFontScale: (scale: FontSizeScale) => void;
  cycleFontScale: () => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  // App Header
  'app.title': {
    ar: 'دار الكمال للعطور',
    en: 'Dar Al-Kamal Perfumes'
  },
  'app.version': {
    ar: 'Smart Brain v2.5',
    en: 'Smart Brain v2.5'
  },
  'app.subtitle': {
    ar: 'المنظومة الفيزيائية لحسابات الحركية والـ Odor Value (OV) ومصفوفة التفاعلات',
    en: 'Physical Chemistry Engine for Kinetic Odor Values & Matrix Interactions'
  },
  
  // Navigation Tabs
  'tab.kinetic': {
    ar: 'محاكي الحركية (OV)',
    en: 'Kinetic Simulator (OV)'
  },
  'tab.feeder': {
    ar: 'مغذي البيانات (API)',
    en: 'Data Feeder (API)'
  },
  'tab.catalog': {
    ar: 'الموسوعة (139 مادة)',
    en: 'Master Catalog (139)'
  },
  'tab.lab': {
    ar: 'مختبر التركيب',
    en: 'Formula Lab'
  },
  'tab.interactions': {
    ar: 'تفاعلات وتأثيرات المصفوفة',
    en: 'Matrix Interactions Lab'
  },
  'nav.scraper': {
    ar: 'استخراج القوائم (Scraper)',
    en: 'List Scraper'
  },
  'nav.guide': {
    ar: 'دليل البحث',
    en: 'Search Guide'
  },
  'nav.splitView': {
    ar: 'المقارنة المزدوجة (Split-View)',
    en: 'Split-View Compare'
  },
  'nav.export': {
    ar: 'تصدير البيانات',
    en: 'Export Data'
  },

  // Formula Lab Header
  'lab.title': {
    ar: 'مختبر تركيب العطور وحساب التكلفة الدقيقة',
    en: 'Perfume Formulation Lab & Precise Costing'
  },
  'lab.subtitle': {
    ar: 'صمم تركيبتك، راقب توازن الهرم العطري، تحقق من أمان IFRA، واحسب التكلفة بالجنيه المصري',
    en: 'Design your formula, monitor pyramid balance, audit IFRA 51 safety, and calculate real cost in EGP'
  },
  'lab.clearFormula': {
    ar: 'تفريغ التركيبة',
    en: 'Clear Formula'
  },
  'lab.presets': {
    ar: 'نماذج أكوردات جاهزة:',
    en: 'Preset Accords:'
  },
  'lab.addMaterial': {
    ar: 'إضافة مادة للتركيبة:',
    en: 'Add Material to Formula:'
  },
  'lab.addButton': {
    ar: 'إضافة',
    en: 'Add'
  },
  'lab.ingredientsList': {
    ar: 'قائمة مكونات التركيبة',
    en: 'Formula Ingredients List'
  },
  'lab.totalWeight': {
    ar: 'إجمالي الوزن:',
    en: 'Total Weight:'
  },
  'lab.grams': {
    ar: 'جرام / جزء',
    en: 'grams / parts'
  },

  // Table Headers
  'th.material': {
    ar: 'المادة',
    en: 'Material'
  },
  'th.pyramidNote': {
    ar: 'نوتة الهرم',
    en: 'Pyramid Note'
  },
  'th.quantity': {
    ar: 'الكمية (جرام)',
    en: 'Quantity (g)'
  },
  'th.dilution': {
    ar: 'نسبة التخفيف',
    en: 'Dilution %'
  },
  'th.cost': {
    ar: 'التكلفة (ج.م)',
    en: 'Cost (EGP)'
  },
  'th.action': {
    ar: 'إجراء',
    en: 'Action'
  },

  // Scent Mood Visualizer
  'mood.title': {
    ar: 'التجسيد البصري التجريدي لطابع العطر',
    en: 'Abstract Olfactory Visual Mood Board'
  },
  'mood.subtitle': {
    ar: 'انطباع حسّي ذكي متولد من العائلات الشمية السائدة وهيكل الهرم العطري',
    en: 'Sensory visual synesthesia generated from dominant families and pyramid structure'
  },
  'mood.autoSync': {
    ar: 'تزامن ذكي مع التركيبة',
    en: 'Auto-Sync with Formula'
  },
  'mood.viewSwitcher': {
    ar: 'تبديل الرؤية البصرية:',
    en: 'Switch Visual Mood:'
  },
  'mood.citrus': {
    ar: 'صباح حمضي',
    en: 'Citrus Morning'
  },
  'mood.woody': {
    ar: 'أمسية خشبية',
    en: 'Woody Evening'
  },
  'mood.floral': {
    ar: 'تفتح زهري',
    en: 'Floral Bloom'
  },
  'mood.oriental': {
    ar: 'عنبر شرقي',
    en: 'Oriental Amber'
  },
  'mood.marine': {
    ar: 'بحري أوزوني',
    en: 'Marine Aquatic'
  },
  'mood.dominantFamilies': {
    ar: 'العائلات السائدة بالتركيبة:',
    en: 'Dominant Formula Families:'
  },

  // Pyramid Distribution
  'pyramid.title': {
    ar: 'توازن الهرم العطري (Pyramid Distribution)',
    en: 'Olfactory Pyramid Distribution'
  },
  'pyramid.top': {
    ar: 'نوتات القمة (Top Notes)',
    en: 'Top Notes'
  },
  'pyramid.heart': {
    ar: 'نوتات القلب (Heart Notes)',
    en: 'Heart Notes'
  },
  'pyramid.base': {
    ar: 'نوتات القاعدة (Base Notes)',
    en: 'Base Notes'
  },
  'pyramid.solvents': {
    ar: 'المذيبات والمثبتات الخاملة',
    en: 'Inert Solvents & Diluents'
  },

  // IFRA Audit
  'ifra.auditTitle': {
    ar: 'فحص معايير الأمان الدولية (IFRA Audit)',
    en: 'International Safety Audit (IFRA 51)'
  },
  'ifra.category4': {
    ar: 'الفئة 4 (عطور الكحول المطبقة على الجلد)',
    en: 'Category 4 (Hydroalcoholic Fine Fragrance)'
  },
  'ifra.allSafe': {
    ar: 'جميع المواد ونسبها متوافقة مع معايير IFRA 51 للفئة 4!',
    en: 'All materials and percentages comply with IFRA 51 Category 4 standards!'
  },

  // Cost Estimator
  'cost.title': {
    ar: 'حاسبة التكلفة والإنتاج التجاري (EGP)',
    en: 'Commercial Cost & Batch Calculator (EGP)'
  },
  'cost.concentration': {
    ar: 'تركيز العطر بالزجاجة:',
    en: 'Concentration in Bottle:'
  },
  'cost.bottleSize': {
    ar: 'حجم زجاجة العطر:',
    en: 'Bottle Volume:'
  },
  'cost.totalFormulaCost': {
    ar: 'إجمالي تكلفة الخلطة الحالية:',
    en: 'Total Formula Batch Cost:'
  },
  'cost.costPer100g': {
    ar: 'تكلفة 100 جرام زيت خام:',
    en: 'Raw Oil Cost per 100g:'
  },
  'cost.bottleOilCost': {
    ar: 'تكلفة الزيت العطري للزجاجة:',
    en: 'Fragrance Oil Cost per Bottle:'
  },

  // Catalog Bar
  'catalog.searchPlaceholder': {
    ar: 'ابحث بالاسم العربي، الإنجليزي، رقم CAS (مثل 54464-57-2)، أو نوتة الشم...',
    en: 'Search by Arabic, English name, CAS number (e.g. 54464-57-2), or olfactory notes...'
  },
  'catalog.sort': {
    ar: 'ترتيب:',
    en: 'Sort by:'
  },
  'catalog.pyramidFilter': {
    ar: 'الهرم:',
    en: 'Pyramid:'
  },
  'catalog.familyFilter': {
    ar: 'العائلة:',
    en: 'Family:'
  },
  'catalog.allNotes': {
    ar: 'كل النوتات',
    en: 'All Notes'
  },
  'catalog.allFamilies': {
    ar: 'جميع العائلات الشمية',
    en: 'All Olfactory Families'
  },
  'catalog.allIfra': {
    ar: 'الكل',
    en: 'All'
  },
  'catalog.showing': {
    ar: 'عرض',
    en: 'Showing'
  },
  'catalog.ofMaterials': {
    ar: 'من أصل 139 مادة معتمدة',
    en: 'of 139 verified materials'
  },

  // Deploy Guide
  'deploy.button': {
    ar: 'دليل التثبيت الديسكتوب',
    en: 'Desktop Install Guide'
  }
};

const defaultT = (key: string): string => {
  const entry = translations[key];
  if (!entry) return key;
  return entry.ar || entry.en || key;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
  toggleLanguage: () => {},
  fontScale: 'normal',
  setFontScale: () => {},
  cycleFontScale: () => {},
  t: defaultT,
  isRtl: true,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('perfumery_app_lang');
      return (saved === 'en' || saved === 'ar') ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  const [fontScale, setFontScale] = useState<FontSizeScale>(() => {
    try {
      const saved = localStorage.getItem('perfumery_app_font_scale');
      return (saved === 'large' || saved === 'xlarge' || saved === 'normal') ? saved : 'large'; // default to 'large' for comfortable viewing
    } catch {
      return 'large';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('perfumery_app_lang', language);
    } catch {
      // ignore
    }
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('perfumery_app_font_scale', fontScale);
    } catch {
      // ignore
    }
    const scaleMap: Record<FontSizeScale, string> = {
      normal: '100%',
      large: '115%',
      xlarge: '130%',
    };
    document.documentElement.style.fontSize = scaleMap[fontScale];
  }, [fontScale]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const cycleFontScale = () => {
    setFontScale(prev => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.ar || key;
  };

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, fontScale, setFontScale, cycleFontScale, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
