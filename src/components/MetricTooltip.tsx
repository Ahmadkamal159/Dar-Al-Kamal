import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type MetricType = 
  | 'k' 
  | 'ov' 
  | 'p0' 
  | 'mw' 
  | 'odt' 
  | 'xi' 
  | 'headspace' 
  | 'skinTemp' 
  | 'initialMass'
  | 't90' 
  | 'gamma' 
  | 'costEgp'
  | 'pyramidNote'
  | 'tenacity'
  | 'ifraLimit'
  | 'catalogId'
  | 'density'
  | 'flashPoint';

interface MetricDefinition {
  titleAr: string;
  titleEn: string;
  symbol: string;
  unitAr: string;
  unitEn: string;
  roleAr: string;
  roleEn: string;
  scientificFormula?: string;
}

export const METRIC_DEFINITIONS: Record<MetricType, MetricDefinition> = {
  k: {
    titleAr: 'معامل التبخر الحركي الكلي (Evaporation Constant)',
    titleEn: 'Evaporation Rate Constant (k)',
    symbol: 'k',
    unitAr: 'معامل حركي بلا أبعاد (Calibrated Scalar)',
    unitEn: 'Dimensionless Kinetic Scalar',
    scientificFormula: 'dn_i / dt = -k · x_i · (P_i / √MW_i)',
    roleAr: 'ثابت المعايرة الحركية في معادلة هيرتز-كنودسن التفاضلية. يقوم محرك Runge-Kutta بحسابه آلياً بدقة متناهية ليعاير سرعة التبخر بحيث تفقد التركيبة 90% من كتلتها وتصل إلى 10% متبقي (T90) عند 24 ساعة بالضبط على جلد الإنسان عند 32°C. زيادة قيمة k تعني أن الخليط يحتوي على مواد أثقل تحتاج طاقة انتشار أكبر للوصول للهدف المحدد.',
    roleEn: 'Kinetic calibration constant in the Hertz-Knudsen differential equation. Auto-calibrated by Runge-Kutta (RK4) ODE solver so the mixture loses 90% of its initial mass (reaches 10% T90) at exactly 24 hours on human skin at 32°C. A higher k indicates heavier, less volatile compounds requiring higher scaling to achieve the target.'
  },
  ov: {
    titleAr: 'قيمة الرائحة السيكوفيزيائية (Odor Value)',
    titleEn: 'Psychophysical Odor Value (OV)',
    symbol: 'OV',
    unitAr: 'مقياس إدراك حسي بلا أبعاد (Log Scale)',
    unitEn: 'Dimensionless Sensory Odor Ratio',
    scientificFormula: 'OV_i(t) = C_vapor,i(t) / ODT_i',
    roleAr: 'المقياس العلمي الصارم لمدى إدراك الأنف البشري لرائحة المادة في الهواء فوق الجلد. الرقم 1.0 يمثل حد الإدراك الأدنى (Detection Threshold). إذا كانت قيمة OV أقل من 1.0، فالأنف لا تشم المادة حتى لو كانت موجودة بالجرامات. القيم فوق 100 تمثل فوحاناً انفجارياً ساطعاً.',
    roleEn: 'Scientific ratio of actual headspace vapor concentration to human odor detection threshold. OV = 1.0 represents the absolute detection threshold limit. OV < 1 is subliminal / undetectable by human nose; OV > 100 represents explosive, radiant sillage.'
  },
  p0: {
    titleAr: 'الضغط البخاري النقي للمادة عند 32°C',
    titleEn: 'Pure Saturation Vapor Pressure (P₀)',
    symbol: 'P₀',
    unitAr: 'ملم زئبق (mmHg)',
    unitEn: 'mmHg at 32°C',
    scientificFormula: 'log₁₀(P₀) = A - B / (T + C) [Antoine / Clausius-Clapeyron]',
    roleAr: 'القوة الدافعة الطبيعية لجزيئات المادة النقية للهروب والتبخر إلى الهواء. المواد ذات الضغط البخاري المرتفع (مثل الليمونين 1.55 mmHg) تتطاير بسرعة البرق وتشكل القمة (Top)، بينما المواد ذات الضغط المتدني (مثل الأمبروكسان 0.0002 mmHg) تبقى ملتصقة بالجلد لترسيخ القاعدة (Base).',
    roleEn: 'Intrinsic thermodynamic escaping tendency of molecules into the vapor phase. High P₀ (>0.1 mmHg) creates flash top notes; extremely low P₀ (<0.001 mmHg) fixes base notes to the skin.'
  },
  mw: {
    titleAr: 'الوزن الجزيئي النسبي للمركب',
    titleEn: 'Molecular Weight (MW)',
    symbol: 'MW',
    unitAr: 'جرام / مول (g/mol)',
    unitEn: 'g/mol',
    scientificFormula: 'Evaporation Rate ∝ 1 / √(MW)',
    roleAr: 'كتلة المول الواحد من جزيئات المادة الكيميائية. وفقاً لقانون غراهام للانتشار وقانون هيرتز-كنودسن، تتناسب سرعة انتشار وتبخر الجزيء عكسياً مع الجذر التربيعي لكتلته الجزيئية (1/√MW). الجزيئات الخفيفة تقفز للهواء بسرعة، بينما الجزيئات الثقيلة (>200 g/mol) تتطلب طاقة أكبر وتتحرك ببطء وثبات.',
    roleEn: 'Mass of one mole of compound. Governs diffusion kinetics: evaporation rate is inversely proportional to the square root of molecular mass (1/√MW) under Graham & Hertz-Knudsen laws.'
  },
  odt: {
    titleAr: 'عتبة الشم والإدراك الحسي البشري',
    titleEn: 'Human Odor Detection Threshold (ODT)',
    symbol: 'ODT',
    unitAr: 'نانوجرام / لتر هواء (ng/L air)',
    unitEn: 'ng/L air',
    scientificFormula: 'ODT = Min detectable gas-phase concentration',
    roleAr: 'أقل تركيز لجزيئات المادة في لتر واحد من الهواء يمكن للأنف البشري تمييزه. كلما صغرت هذه القيمة (مثل الأمبروكسان 0.24 ng/L)، كان المركب خارق القوة ويفوح حتى بوجود كميات متناهية الصغر.',
    roleEn: 'Lowest airborne concentration detected by human olfactory receptors (from van Gemert & Nagata compendia). Lower values mean extreme olfactory potency (e.g., Ambroxan detects at just 0.24 ng/L).'
  },
  xi: {
    titleAr: 'الكسر المولي للمادة في الخليط السائل',
    titleEn: 'Liquid Mole Fraction (xᵢ)',
    symbol: 'xᵢ',
    unitAr: 'كسر مولي (0.000 إلى 1.000)',
    unitEn: 'Molar Fraction ratio',
    scientificFormula: 'x_i = n_i / ∑(n_j)',
    roleAr: 'النسبة الحقيقية لعدد جزيئات المادة مقارنة بإجمالي جزيئات العطر في المحلول السائل على الجلد. يحدد مساهمة المادة في قانون راؤول للضغط الجزئي (Pᵢ = xᵢ · P₀).',
    roleEn: 'Ratio of moles of compound i to total solution moles. Determines thermodynamic partial pressure contribution in Raoult\'s Law (P_i = x_i · P₀).'
  },
  headspace: {
    titleAr: 'نسبة مساهمة المادة في بخار الرأس عند الرش',
    titleEn: 'Headspace Vapor Contribution Pct',
    symbol: '% Headspace',
    unitAr: 'نسبة مئوية من إجمالي البخار (%)',
    unitEn: 'Percentage of total vapor (%)',
    scientificFormula: '% = (P_partial,i / P_total) × 100',
    roleAr: 'النسبة المئوية التي تشغلها جزيئات المادة من إجمالي الغيمة الغازية المتبخرة فوق الجلد في اللحظة صفر (t=0h). توضح من يسيطر على سحابة العطر الأولى المحيطة بالمستخدم.',
    roleEn: 'Percentage of the immediate vapor cloud composed of this material at moment zero (t=0h), defining immediate sillage composition.'
  },
  skinTemp: {
    titleAr: 'حرارة سطح جلد الإنسان القياسية',
    titleEn: 'Human Skin Surface Temperature',
    symbol: 'T_skin',
    unitAr: '32.00 °C (305.15 K)',
    unitEn: '32.00 °C (305.15 K)',
    scientificFormula: 'T = 32°C = 305.15 Kelvin',
    roleAr: 'درجة الحرارة الفسيولوجية المعتمدة علمياً لحرارة الجلد البشري في الظروف العادية (وليست حرارة الجو 25°C ولا حرارة الجسم الداخلية 37°C). هذه الحرارة هي التي تحدد قيم الضغط البخاري P₀ ومعدل التبخر الفعلي.',
    roleEn: 'Standard physiological temperature of human skin driving evaporation and boundary layer diffusion (distinct from ambient 25°C or internal 37°C).'
  },
  initialMass: {
    titleAr: 'الكتلة الابتدائية للعطر على الجلد',
    titleEn: 'Initial Formulated Scent Mass',
    symbol: 'm₀',
    unitAr: '100.00 ملليجرام (mg)',
    unitEn: '100.00 mg',
    scientificFormula: 'm_total(t=0) = 100 mg',
    roleAr: 'الكتلة النموذجية لدفعة الرذاذ الواحدة من العطر على مساحة الجلد القياسية (100 مجم تعادل رشّة كاملة مركزة).',
    roleEn: 'Standard baseline application mass representing a full concentrated spray on skin area (100 mg).'
  },
  t90: {
    titleAr: 'زمن تبخر 90% من الكتلة الكلية (T90 Target)',
    titleEn: 'T90 Mass Depletion Target',
    symbol: 'T90',
    unitAr: '24.0 ساعة (Hours)',
    unitEn: '24.0 Hours',
    scientificFormula: 'm(t=24h) = 0.10 × m₀',
    roleAr: 'الشرط الحدي الفيزيائي لنموذج دار الكمال، حيث تتم معايرة النظام ليصل المتبقي من كتلة الزيت العطري على الجلد إلى 10% بعد مرور 24 ساعة بالضبط.',
    roleEn: 'Physical boundary target in the Dar Al-Kamal solver, calibrating the equation so remaining fragrance mass equals 10% after 24 hours.'
  },
  gamma: {
    titleAr: 'معامل الفعالية الكيميائي الثرموديناميكي',
    titleEn: 'Thermodynamic Activity Coefficient (γ)',
    symbol: 'γ',
    unitAr: 'معامل تصحيح الفعالية (Activity Scalar)',
    unitEn: 'Non-Ideality Scalar (1.0 = Ideal)',
    scientificFormula: 'P_real = γ · x_i · P₀',
    roleAr: 'مقياس الانحراف عن السلوك المثالي. إذا كان γ > 1، يحدث تنافر وهروب سريع للمادة نحو الهواء (Flash Bloom). إذا كان γ < 1، يحدث تجاذب واحتجاز جزيئي بواسطة المثبتات (Fixation) مما يطيل عمر العطر.',
    roleEn: 'Quantifies deviation from ideal Raoult solution. γ > 1 indicates positive deviation / matrix eviction (enhanced flash); γ < 1 indicates molecular attraction / fixative entrapment.'
  },
  costEgp: {
    titleAr: 'التكلفة بالجنيه المصري للمادة الخام',
    titleEn: 'Material Cost in Egyptian Pounds (EGP)',
    symbol: 'ج.م',
    unitAr: 'جنيه مصري / جرام (EGP/g)',
    unitEn: 'EGP per gram',
    scientificFormula: 'Cost = Parts × Dilution × Price_per_gram',
    roleAr: 'السعر الفعلي الدقيق للجرام الواحد بالجنيه المصري، مستخرج مباشرة من قائمة أسعار المواد المعتمدة في ملف PDF الخاص بك لحساب تكلفة التركيبة والزجاجة التجارية بدقة مليمترية.',
    roleEn: 'Exact price per gram in Egyptian Pounds (EGP) extracted directly from your approved PDF catalog to compute precise bottle formulation economics.'
  },
  pyramidNote: {
    titleAr: 'موقع المادة في الهرم العطري',
    titleEn: 'Olfactory Pyramid Classification',
    symbol: 'Note',
    unitAr: 'قمة (Top) / قلب (Heart) / قاعدة (Base)',
    unitEn: 'Top / Heart / Base Note',
    scientificFormula: 'Classified by Evaporation Rate & Tenacity',
    roleAr: 'تصنيف المادة بناءً على سرعة تطايرها وثباتها على شريط الشم (Blotter): القمة (0-2 ساعة)، القلب (2-8 ساعات)، القاعدة (8-48+ ساعة).',
    roleEn: 'Classification of fragrance phase based on volatility and tenacity: Top (0-2h), Heart (2-8h), Base (8-48+h).'
  },
  tenacity: {
    titleAr: 'قوة الثبات الزمني على شريط الشم (Blotter)',
    titleEn: 'Tenacity Duration on Blotter Strip',
    symbol: 'Hours',
    unitAr: 'ساعات بقاء الرائحة المستمرة (h)',
    unitEn: 'Hours on blotter (h)',
    scientificFormula: 'Tenacity (h) = Time until olfactory fading on paper',
    roleAr: 'المدة الزمنية القياسية التي تظل فيها رائحة المادة قابلة للتمييز بوضوح على شريط الشم الورقي عند 20°C دون تداخل حرارة الجلد. المواد ذات الثبات العالي (>100h) تعمل كمثبتات دائمة، بينما المواد ذات الثبات المنخفض (<12h) تتلاشى سريعاً لتفسح المجال لقلب وقاعدة العطر.',
    roleEn: 'Standard laboratory hours the odor remains identifiable on a paper smelling strip at 20°C. Long tenacity (>100h) indicates fixative base notes; short tenacity (<12h) designates fugitive top notes.'
  },
  ifraLimit: {
    titleAr: 'الحد الأقصى المسموح به دولياً بمعايير IFRA 51',
    titleEn: 'IFRA Standard Category 4 Maximum Limit',
    symbol: 'IFRA %',
    unitAr: 'نسبة مئوية قصوى في المنتج النهائي (%)',
    unitEn: 'Max percentage in finished perfume (%)',
    scientificFormula: 'Cat 4 Limit = Max allowable concentration in hydroalcoholic spray',
    roleAr: 'أقصى نسبة مئوية مسموح بوجودها من هذه المادة في زجاجة العطر الجاهزة للاستخدام البشري (الفئة 4: العطور الكحولية) وفقاً لآخر تعديل IFRA 51 لمنع الحساسية الضوئية أو التسمم الجلدي. تجاوز هذه النسبة يجعل العطر مخالفاً دولياً وغير صالح للتسويق التجاري.',
    roleEn: 'Absolute maximum allowable concentration in consumer hydroalcoholic fine fragrances (IFRA 51 Category 4). Exceeding this boundary causes skin sensitisation or phototoxicity and violates global safety regulations.'
  },
  catalogId: {
    titleAr: 'رقم المادة المعياري في موسوعة دار الكمال',
    titleEn: 'Dar Al-Kamal Verified Catalog ID',
    symbol: '#ID',
    unitAr: 'رقم فهرسي فريد (#1 - #139)',
    unitEn: 'Unique Master Index (#1 - #139)',
    scientificFormula: 'ID ∈ [1, 139]',
    roleAr: 'الرقم المرجعي الثابت للمادة الخام في قائمة أسعار ومواصفات دار الكمال المعتمدة لتسهيل طلبها وتتبعها في برامج الديسكتوب والخلطات.',
    roleEn: 'Deterministic index in the Dar Al-Kamal 139 materials master catalog linking technical specifications, CAS, and EGP price.'
  },
  density: {
    titleAr: 'الكثافة النوعية للمادة السائلة',
    titleEn: 'Specific Gravity / Density',
    symbol: 'ρ',
    unitAr: 'جرام / سم مكعب (g/cm³ عند 20°C)',
    unitEn: 'g/cm³ at 20°C',
    scientificFormula: 'ρ = mass / volume',
    roleAr: 'الكتلة لكل وحدة حجم من الزيت العطري. بالغة الأهمية لتحويل الجرامات إلى مليلترات بدقة متناهية عند تعبئة الزجاجات وتعديل نسب الكحول في المصنع.',
    roleEn: 'Mass per unit volume at 20°C. Essential for gravimetric-to-volumetric batch conversion during production and bottle filling.'
  },
  flashPoint: {
    titleAr: 'نقطة الوميض الحراري',
    titleEn: 'Flash Point Temperature',
    symbol: 'FP',
    unitAr: 'درجة مئوية (°C)',
    unitEn: '°C (Closed Cup)',
    scientificFormula: 'Lowest temperature forming ignitable vapor',
    roleAr: 'أدنى درجة حرارة ينبعث عندها بخار كافٍ للاشتعال. تعكس مدى تطاير المواد الخفيفة وتحدد شروط النقل الجوي والشحن الدولي وتخزين المواد في المعمل.',
    roleEn: 'Lowest temperature at which the compound produces flammable vapors. Indicates volatility category and international shipping safety compliance.'
  }
};

interface MetricTooltipProps {
  type: MetricType;
  children?: React.ReactNode;
  showIcon?: boolean;
  inline?: boolean;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({
  type,
  children,
  showIcon = true,
  inline = true
}) => {
  const { language, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true,
  });

  const def = METRIC_DEFINITIONS[type] || METRIC_DEFINITIONS.k;
  const title = language === 'ar' ? def.titleAr : def.titleEn;
  const unit = language === 'ar' ? def.unitAr : def.unitEn;
  const role = language === 'ar' ? def.roleAr : def.roleEn;

  const updateCoordinates = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320; // max expected width
    const tooltipHeight = 210; // approximate height

    // Determine vertical placement: above or below
    const spaceAbove = rect.top;
    const placeAbove = spaceAbove >= tooltipHeight + 16;

    const top = placeAbove
      ? rect.top - tooltipHeight - 8
      : rect.bottom + 8;

    // Determine horizontal placement centered on trigger, clamped to viewport margins
    const idealLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const left = Math.max(12, Math.min(idealLeft, window.innerWidth - tooltipWidth - 12));

    setCoords({ top, left, placeAbove });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateCoordinates();

    const handleScrollOrResize = () => {
      updateCoordinates();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateCoordinates]);

  return (
    <span
      ref={triggerRef}
      className={`relative ${inline ? 'inline-flex items-center gap-1' : 'block'}`}
      onMouseEnter={() => {
        updateCoordinates();
        setIsOpen(true);
      }}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}

      {showIcon && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isOpen) updateCoordinates();
            setIsOpen(!isOpen);
          }}
          className="text-stone-400 hover:text-amber-400 focus:outline-none transition-colors p-0.5 rounded cursor-help"
          title={title}
          aria-label={title}
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-500/80 hover:text-amber-300" />
        </button>
      )}

      {/* Tooltip Rendered at Document Body Level via Portal to Guarantee No Frame Clipping */}
      {isOpen &&
        createPortal(
          <div
            className="fixed z-[99999] w-72 sm:w-80 p-3.5 rounded-2xl bg-stone-950 text-stone-200 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs animate-fadeIn pointer-events-auto leading-normal"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            dir={isRtl ? 'rtl' : 'ltr'}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
              <span className="font-black text-amber-300 text-xs flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold border border-amber-500/30">
                  {def.symbol}
                </span>
                <span>{title}</span>
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-stone-400 text-[10px]">
                <span>{language === 'ar' ? 'الوحدة / المقياس:' : 'Unit / Scale:'}</span>
                <span className="font-mono text-stone-300 font-bold">{unit}</span>
              </div>

              {def.scientificFormula && (
                <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-800/80 font-mono text-[10px] text-amber-200/90 text-center font-bold">
                  {def.scientificFormula}
                </div>
              )}

              <p className="text-stone-300 leading-relaxed text-[11px] pt-1">
                {role}
              </p>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
};
