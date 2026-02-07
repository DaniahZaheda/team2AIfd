// 📚 questions.js - أسئلة الصف الرابع

const Grade4Questions = {
    // ============= الأعداد الكبيرة (ضمن 999,999) =============


    // ============= الجمع والطرح =============
    additionSubtraction: {
        easy: [
            {
                id: 1,
                question: "٤٥٢ + ٣٦٧ = ?",
                options: ["٨١٩", "٨٠٩", "٨٢٩", "٨١٥"],
                correct: 819,
                explanation: "٤٥٢ + ٣٠٠ = ٧٥٢، + ٦٠ = ٨١٢، + ٧ = ٨١٩",
                topic: "الجمع بدون حمل",
                hint: "اجمع المئات ثم العشرات ثم الآحاد"
            },
            {
                id: 2,
                question: "٨٧٦ - ٢٣٤ = ?",
                options: ["٦٤٢", "٦٥٢", "٦٣٢", "٦٤١"],
                correct: 642,
                explanation: "٨٠٠ - ٢٠٠ = ٦٠٠، ٧٠ - ٣٠ = ٤٠، ٦ - ٤ = ٢ ← ٦٤٢",
                topic: "الطرح بدون استلاف",
                hint: "اطرح المئات ثم العشرات ثم الآحاد"
            },
            {
                id: 3,
                question: "ما ناتج جمع: ٣٠٠ + ٤٠٠؟",
                options: ["٧٠٠", "٧٠", "٧٠٠٠", "٧٠٠٠٠"],
                correct: 700,
                explanation: "٣ مئات + ٤ مئات = ٧ مئات = ٧٠٠",
                topic: "جمع المئات",
                hint: "فكر في المئات: ٣ مئات + ٤ مئات"
            }
        ],
        medium: [
            {
                id: 4,
                question: "حل المعادلة: ٧٣٤ - ⬜ = ٤٨٩",
                options: ["٢٤٥", "٢٥٥", "٢٣٥", "٢٦٥"],
                correct: 245,
                explanation: "٧٣٤ - ٤٨٩ = ٢٤٥",
                topic: "المعادلات",
                hint: "اطرح ٤٨٩ من ٧٣٤"
            },
            {
                id: 5,
                question: "٥٦٧ + ٣٨٩ = ?",
                options: ["٩٥٦", "٩٤٦", "٩٦٦", "٩٥٥"],
                correct: 956,
                explanation: "٥٦٧ + ٣٠٠ = ٨٦٧، + ٨٠ = ٩٤٧، + ٩ = ٩٥٦",
                topic: "الجمع مع الحمل",
                hint: "اجمع الآحاد أولاً واحمل إذا لزم الأمر"
            },
            {
                id: 6,
                question: "٦٠٢ - ٣٧٥ = ?",
                options: ["٢٢٧", "٢٣٧", "٢١٧", "٢٠٧"],
                correct: 227,
                explanation: "استلف من ٦٠٢ ← ٥٩١٢ - ٣٧٥ = ٢٢٧",
                topic: "الطرح مع الاستلاف",
                hint: "استلف من الصفر"
            }
        ],
        hard: [
            {
                id: 7,
                question: "مجموع ثلاثة أعداد هو ٨٦٥. إذا كان العدد الأول ٢٤٥ والثاني ٣١٨، فما الثالث؟",
                options: ["٣٠٢", "٢٩٢", "٣١٢", "٣٢٢"],
                correct: 302,
                explanation: "٢٤٥ + ٣١٨ = ٥٦٣، ٨٦٥ - ٥٦٣ = ٣٠٢",
                topic: "مسائل كلامية",
                hint: "اجمع العددين الأولين ثم اطرح المجموع من الإجمالي"
            },

            {
                id: 8,
                question: "إذا أضفنا ١٥٠ إلى عدد فكان الناتج ٨٧٥، فما العدد الأصلي؟",
                options: ["٧٢٥", "٧٣٥", "٧٢٠", "٧٣٠"],
                correct: 725,
                explanation: "٨٧٥ - ١٥٠ = ٧٢٥",
                topic: "العكسية",
                hint: "اطرح ١٥٠ من ٨٧٥"
            }
        ]
    },

    // ============= الضرب والقسمة =============
    multiplicationDivision: {
        easy: [
            {
                id: 9,
                question: "٦ × ٧ = ?",
                options: ["٤٢", "٣٦", "٤٨", "٥٤"],
                correct: 42,
                explanation: "جدول الضرب: ٦ × ٧ = ٤٢",
                topic: "جدول الضرب",
                hint: "تذكر جدول الضرب ٦"
            },
            {
                id: 10,
                question: "٨ × ٩ = ?",
                options: ["٧٢", "٦٣", "٨١", "٦٤"],
                correct: 72,
                explanation: "٨ × ٩ = ٧٢",
                topic: "جدول الضرب",
                hint: "٨ × ١٠ = ٨٠، ناقص ٨ = ٧٢"
            },
            {
                id: 11,
                question: "٤٨ ÷ ٦ = ?",
                options: ["٨", "٧", "٩", "٦"],
                correct: 8,
                explanation: "٦ × ٨ = ٤٨، إذن ٤٨ ÷ ٦ = ٨",
                topic: "القسمة الأساسية",
                hint: "ما العدد الذي إذا ضربته في ٦ يعطي ٤٨؟"
            }
        ],
        medium: [
            {
                id: 12,
                question: "٧ × ٢٥ = ?",
                options: ["١٧٥", "١٦٥", "١٨٥", "١٥٥"],
                correct: 175,
                explanation: "٧ × ٢٠ = ١٤٠، ٧ × ٥ = ٣٥، المجموع ١٧٥",
                topic: "الضرب بأعداد من رقمين",
                hint: "قسّم ٢٥ إلى ٢٠ + ٥"
            },
            {
                id: 13,
                question: "٩٦ ÷ ٨ = ?",
                options: ["١٢", "١٠", "١٤", "٨"],
                correct: 96,
                explanation: "٨ × ١٢ = ٩٦",
                topic: "القسمة الطويلة",
                hint: "جرب ضرب ٨ في ١٢"
            },
            {
                id: 14,
                question: "٥ × ١٨ = ?",
                options: ["٩٠", "٨٠", "١٠٠", "٨٥"],
                correct: 90,
                explanation: "٥ × ١٠ = ٥٠، ٥ × ٨ = ٤٠، المجموع ٩٠",
                topic: "الضرب بالتحليل",
                hint: "قسّم ١٨ إلى ١٠ + ٨"
            }
        ],
        hard: [
            {
                id: 15,
                question: "إذا اشترى أحمد ٨ علب، في كل علبة ٢٤ قلماً، فكم قلماً اشترى؟",
                options: ["١٩٢", "١٨٤", "١٧٦", "٢٠٠"],
                correct: 192,
                explanation: "٨ × ٢٤ = ٨ × ٢٠ = ١٦٠، ٨ × ٤ = ٣٢، المجموع ١٩٢",
                topic: "مسائل كلامية",
                hint: "اضرب عدد العلب × عدد الأقلام في كل علبة"
            },
            {
                id: 16,
                question: "٧٥ ÷ ٥ = ?",
                options: ["١٥", "٢٥", "٣٥", "٥"],
                correct: 75,
                explanation: "٥ × ١٥ = ٧٥",
                topic: "القسمة",
                hint: "ما العدد الذي إذا ضربته في ٥ يعطي ٧٥؟"
            },
            {
                id: 17,
                question: "إذا كان ٦ × ٨ = ٤٨، فما قيمة ٦٠ × ٨٠؟",
                options: ["٤٨٠٠", "٤٨٠", "٤٨٠٠٠", "٤٨٠٠٠٠"],
                correct: 4800,
                explanation: "٦٠ × ٨٠ = (٦ × ٨) × (١٠ × ١٠) = ٤٨ × ١٠٠ = ٤٨٠٠",
                topic: "الضرب بعشرات المئات",
                hint: "اضرب ٦ × ٨ أولاً ثم أضف الأصفار"
            }
        ]
    },

};
// مستويات الصف الرابع
const Grade4Levels = {
    beginner: {
        min: 0,
        max: 40,
        color: "#FF6B6B",
        title: "مبتدئ",
        description: "تحتاج لمراجعة الأساسيات"
    },
    intermediate: {
        min: 41,
        max: 70,
        color: "#FFD93D",
        title: "متوسط",
        description: "أداء جيد، يمكنك التحسن أكثر"
    },
    advanced: {
        min: 71,
        max: 90,
        color: "#6BCF7F",
        title: "متقدم",
        description: "ممتاز! يمكنك التقدم أكثر"
    },
    expert: {
        min: 91,
        max: 100,
        color: "#4D96FF",
        title: "متميز",
        description: "رائع! أنت متميز في الرياضيات"
    }
};

// مجالات الصف الرابع
const Grade4Topics = [
    {
        id: "largeNumbers",
        name: "الأعداد الكبيرة",
        icon: "🔢",
        description: "القراءة، الكتابة، المقارنة، القيمة المنزلية"
    },
    {
        id: "additionSubtraction",
        name: "الجمع والطرح",
        icon: "➕➖",
        description: "الجمع والطرح بأنواعها المختلفة"
    },
    {
        id: "multiplicationDivision",
        name: "الضرب والقسمة",
        icon: "✖️➗",
        description: "جدول الضرب، القسمة، المسائل"
    },
    {
        id: "fractions",
        name: "الكسور",
        icon: "½",
        description: "المقارنة، الجمع، الطرح، التطبيقات"
    },
    {
        id: "geometry",
        name: "الهندسة",
        icon: "📐",
        description: "الأشكال، المحيط، المساحة، الحجم"
    },
    {
        id: "measurement",
        name: "القياس",
        icon: "📏",
        description: "الطول، الوزن، السعة، الزمن"
    },
    {
        id: "wordProblems",
        name: "المسائل الكلامية",
        icon: "💭",
        description: "حل المشكلات، التفكير المنطقي"
    }
];

// تصدير البيانات
window.Grade4Questions = Grade4Questions;
window.Grade4Levels = Grade4Levels;
window.Grade4Topics = Grade4Topics;

console.log('✅ تم تحميل أسئلة الصف الرابع بنجاح!');