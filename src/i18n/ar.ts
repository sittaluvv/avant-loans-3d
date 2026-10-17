/**
 * Arabic sub-labels for the /apply form and the loan-type picker.
 * Keys are the exact English UI strings; values are Modern Standard Arabic (Gulf finance usage).
 * Edit a value here to correct a translation. A missing key simply shows no Arabic line.
 * Display only: submitted values and Telegram messages stay English.
 */
export const AR: Record<string, string> = {
  // Page
  "Online Loan Application Form": "نموذج طلب التمويل الإلكتروني",
  "Please fill in our application form. All fields marked * are required so our team can review your enquiry.":
    "يرجى تعبئة النموذج. جميع الحقول المميزة بعلامة * مطلوبة ليتمكن فريقنا من مراجعة استفسارك.",

  // Stepper
  "Personal Details": "البيانات الشخصية",
  "Employment & Income": "العمل والدخل",
  "Loan Details": "تفاصيل التمويل",
  "Mortgage Details": "تفاصيل التمويل العقاري",
  "Auto Loan Details": "تفاصيل تمويل السيارة",
  "Business Loan Details": "تفاصيل تمويل الأعمال",
  "Education Loan Details": "تفاصيل التمويل التعليمي",

  // Loan types (form ids and display labels)
  "Loan Type": "نوع التمويل",
  "Personal": "قرض شخصي",
  "Personal Loan": "قرض شخصي",
  "Mortgage": "تمويل عقاري",
  "Auto/Car": "تمويل سيارات",
  "Auto Loan": "تمويل سيارات",
  "Business": "تمويل أعمال",
  "Business Loan": "تمويل أعمال",
  "Education": "تمويل تعليمي",
  "Education Loan": "تمويل تعليمي",
  "Choose your loan type": "اختر نوع التمويل",
  "Change": "تغيير",

  // Step 1
  "Loan Amount": "مبلغ التمويل",
  "Loan Duration": "مدة التمويل",
  "Your Name": "الاسم",
  "First": "الاسم الأول",
  "Last": "اسم العائلة",
  "Home Address": "عنوان السكن",
  "Street Address": "عنوان الشارع",
  "Street Address Line 2": "عنوان الشارع (السطر الثاني)",
  "City": "المدينة",
  "Region": "المنطقة",
  "Postal / Zip Code": "الرمز البريدي",
  "Country": "الدولة",
  "Birth Date": "تاريخ الميلاد",
  "Email": "البريد الإلكتروني",
  "Marital Status": "الحالة الاجتماعية",
  "Single": "أعزب / عزباء",
  "Married": "متزوج / متزوجة",
  "Divorced": "مطلق / مطلقة",
  "Widowed": "أرمل / أرملة",
  "Separated": "منفصل / منفصلة",
  "Select…": "اختر…",
  "Select term…": "اختر المدة…",
  "Select a loan type first": "اختر نوع التمويل أولًا",
  "(optional)": "(اختياري)",

  // Countries
  "United Arab Emirates": "الإمارات العربية المتحدة",
  "Saudi Arabia": "المملكة العربية السعودية",
  "Qatar": "قطر",
  "Kuwait": "الكويت",
  "Bahrain": "البحرين",
  "Oman": "عُمان",
  "Jordan": "الأردن",
  "Egypt": "مصر",
  "Lebanon": "لبنان",
  "United Kingdom": "المملكة المتحدة",
  "United States": "الولايات المتحدة",
  "Other": "أخرى",

  // Step 2
  "Employment Status": "الحالة الوظيفية",
  "Employed full-time": "موظف بدوام كامل",
  "Employed part-time": "موظف بدوام جزئي",
  "Self-employed": "أعمال حرة",
  "Retired": "متقاعد",
  "Not currently employed": "لا أعمل حاليًا",
  "Employer": "جهة العمل",
  "Employer name": "اسم جهة العمل",
  "Job title": "المسمى الوظيفي",
  "Years with employer": "سنوات الخدمة لدى جهة العمل",
  "Your Business": "نشاطك التجاري",
  "Business name": "اسم المنشأة",
  "Years in business": "سنوات مزاولة النشاط",
  "Gross Annual Income": "إجمالي الدخل السنوي",
  "Other Monthly Income": "دخل شهري إضافي",
  "Monthly Debt Payments": "الالتزامات الشهرية",
  "Pay Frequency": "دورية صرف الراتب",
  "Monthly": "شهري",
  "Twice a month": "مرتان في الشهر",
  "Every two weeks": "كل أسبوعين",
  "Weekly": "أسبوعي",
  "Irregular": "غير منتظم",

  // Step 3: loan details
  "Loan Purpose": "الغرض من التمويل",
  "Buy a home": "شراء منزل",
  "Refinance": "إعادة التمويل",
  "Home equity": "تمويل بضمان العقار",
  "Build a home": "بناء منزل",
  "Vehicle": "المركبة",
  "Make": "الشركة المصنّعة",
  "Model": "الطراز",
  "Year": "سنة الصنع",
  "Use of Funds": "أوجه استخدام التمويل",
  "Buy new vehicle": "شراء مركبة جديدة",
  "Buy used vehicle": "شراء مركبة مستعملة",
  "Refinance auto loan": "إعادة تمويل السيارة",
  "Business Name": "اسم المنشأة",
  "Registered business name": "الاسم التجاري المسجّل",
  "Working capital": "رأس المال العامل",
  "Equipment": "المعدات",
  "Expansion": "التوسّع",
  "Start-up costs": "تكاليف التأسيس",
  "School / Program": "الجامعة / البرنامج الدراسي",
  "School or program name": "اسم الجامعة أو البرنامج",
  "Tuition": "الرسوم الدراسية",
  "Living expenses": "نفقات المعيشة",
  "Both tuition and living": "الرسوم الدراسية ونفقات المعيشة",
  "Debt consolidation": "توحيد الديون",
  "Home improvement": "تحسين المنزل",
  "Medical": "نفقات طبية",
  "Travel": "السفر",
  "Go back to step 1 and choose a loan type.": "ارجع إلى الخطوة 1 واختر نوع التمويل.",

  // Step 3: identity
  "Identity verification": "التحقق من الهوية",
  "Choose your ID type and upload a clear photo or scan.": "اختر نوع الهوية وارفع صورة أو نسخة ممسوحة واضحة.",
  "ID type": "نوع الهوية",
  "Passport": "جواز السفر",
  "Resident card (Emirates ID / Iqama / residence permit)": "بطاقة الإقامة (الهوية الإماراتية / الإقامة / تصريح الإقامة)",
  "National ID": "الهوية الوطنية",
  "National ID / Iqama": "الهوية الوطنية / الإقامة",
  "ID number": "رقم الهوية",
  "Expiry date": "تاريخ الانتهاء",
  "Upload ID": "رفع الهوية",
  "Front of ID": "الوجه الأمامي للهوية",
  "Back of ID": "الوجه الخلفي للهوية",
  "Passport photo page": "صفحة البيانات في جواز السفر",
  "Drag & drop, or choose a file": "اسحب الملف وأفلته، أو اختر ملفًا",
  "choose a file": "اختر ملفًا",
  "Take a photo": "التقط صورة",
  "Privacy: your ID is sent over an encrypted connection only to our team, and only when you submit. It is not stored on this website.":
    "الخصوصية: تُرسَل هويتك عبر اتصال مشفّر إلى فريقنا فقط وعند الإرسال فقط، ولا تُحفَظ على هذا الموقع.",

  // Step 3: contact, review, consent
  "Notes": "ملاحظات",
  "How should we contact you?": "كيف تفضّل أن نتواصل معك؟",
  "WhatsApp": "واتساب",
  "Is this your WhatsApp number? Edit if needed.": "هل هذا رقم واتساب الخاص بك؟ عدّله إذا لزم الأمر.",
  "We’ll email you at (edit if needed)": "سنراسلك على هذا البريد (عدّله إذا لزم الأمر)",
  "Review": "المراجعة",
  "Loan": "التمويل",
  "Amount": "المبلغ",
  "Applicant": "مقدّم الطلب",
  "Preferred contact": "وسيلة التواصل المفضّلة",
  "Consent": "الموافقة",
  "I confirm the details are accurate and agree that Avant Middle East may contact me about this enquiry.":
    "أؤكد صحة البيانات، وأوافق على تواصل أفانت الشرق الأوسط معي بشأن هذا الاستفسار.",
  "SUBMIT_NOTICE": "بإرسال النموذج فأنت تقدّم استفسارًا، وسيتواصل معك فريقنا بالوسيلة التي اخترتها. الإرسال لا يُعدّ عرض تمويل أو موافقة عليه.",

  // Homepage Apply buttons (/ and /v2/)
  "Apply for Loan": "قدّم طلب التمويل",
  "Apply now": "قدّم الآن",
  "Apply": "قدّم الطلب",

  // Buttons and footer note
  "Next Page": "الصفحة التالية",
  "Back": "رجوع",
  "Submit Enquiry": "إرسال الاستفسار",
  "Sending…": "جارٍ الإرسال…",
  "Your details are sent over an encrypted connection.": "تُرسَل بياناتك عبر اتصال مشفّر.",

  // Success / not sent
  "Thank you. Your enquiry was received.": "شكرًا لك. تم استلام استفسارك.",
  "Our team will contact you using your preferred contact method to discuss your request. Submitting is not a loan offer or approval.":
    "سيتواصل معك فريقنا عبر وسيلة التواصل المفضّلة لديك لمناقشة طلبك. الإرسال لا يُعدّ عرض تمويل أو موافقة عليه.",
  "Nothing was sent.": "لم يتم إرسال أي شيء.",
  "Submission is not connected on this build, so your answers were not sent, saved or shared, and they have been cleared from this page.":
    "الإرسال غير مفعّل في هذا الإصدار، لذلك لم تُرسَل إجاباتك ولم تُحفَظ أو تُشارَك، وقد مُسحت من هذه الصفحة.",
  "Start a new enquiry": "بدء استفسار جديد",

  // Validation
  "Choose a loan type to continue.": "اختر نوع التمويل للمتابعة.",
  "Please choose how we should contact you: WhatsApp or Email.": "يرجى اختيار وسيلة التواصل: واتساب أو البريد الإلكتروني.",
  "Please upload your passport photo page.": "يرجى رفع صفحة البيانات في جواز السفر.",
  "Please upload the front of your ID.": "يرجى رفع الوجه الأمامي للهوية.",
  "Please upload the back of your ID.": "يرجى رفع الوجه الخلفي للهوية.",
  "Please upload a JPG, PNG or PDF file.": "يرجى رفع ملف بصيغة JPG أو PNG أو PDF.",
  "This file is empty.": "هذا الملف فارغ.",
}

/** Patterns for dynamic strings (counts, durations, sizes). */
const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Please complete (the highlighted field|the \d+ highlighted fields) to continue\.$/, (m) => (m[1].startsWith("the highlighted") ? "يرجى إكمال الحقل المحدد للمتابعة." : "يرجى إكمال الحقول المحددة للمتابعة.")],
  [/^(\d+) months$/, (m) => `${m[1]} شهرًا`],
  [/^(\d+) years$/, (m) => `${m[1]} ${Number(m[1]) <= 10 ? "سنوات" : "سنة"}`],
  [/^Step (\d) of (\d)$/, (m) => `الخطوة ${m[1]} من ${m[2]}`],
  [/^This file is [\d.]+ MB\. The limit is 5 MB\.$/, () => "حجم الملف يتجاوز الحد الأقصى (5 ميغابايت)."],
  [/^Could not deliver the application/, () => "تعذّر إرسال الطلب. يرجى المحاولة مرة أخرى."],
]

export function ar(en?: string | null): string | undefined {
  if (!en) return undefined
  if (AR[en]) return AR[en]
  for (const [re, fn] of RULES) { const m = en.match(re); if (m) return fn(m) }
  return undefined
}
