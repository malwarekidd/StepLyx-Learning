/**
 * Sample curriculum, shaped like the output of the PDF extraction step.
 * Every unit, lesson, question and rule points back to a section/page of the
 * source PDF so the UI can show where each rule came from.
 */

export type NodeKind = "star" | "lightning" | "review" | "checkpoint";

export interface PdfSection {
  id: string;
  code: string; // e.g. "§1.2"
  title: string;
  page: number;
}

export interface Rule {
  id: string;
  sectionId: string;
  title: string;
  statement: string;
  formula: string;
  example: { problem: string; solution: string[] };
}

export interface Question {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  ruleId: string;
  /** Step-by-step guidance for this exact question (stops before the answer). */
  steps: string[];
}

export interface Lesson {
  id: string;
  title: string;
  kind: NodeKind;
  sectionId: string;
  questions: Question[];
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  tone: 1 | 2 | 3;
  lessons: Lesson[];
}

export interface Curriculum {
  source: { file: string; pages: number; subject: string; grade: string };
  sections: PdfSection[];
  rules: Rule[];
  units: Unit[];
}

const sections: PdfSection[] = [
  { id: "s1-1", code: "§1.1", title: "Natural ədədlər və onluq say sistemi", page: 4 },
  { id: "s1-2", code: "§1.2", title: "Bölünmə əlamətləri. Qalıqlı bölmə", page: 9 },
  { id: "s1-3", code: "§1.3", title: "Sadə və mürəkkəb ədədlər. ƏBOB, ƏKOB", page: 14 },
  { id: "s1-r", code: "§1.R", title: "Unit 1 üzrə təkrar", page: 19 },
  { id: "s2-1", code: "§2.1", title: "Çoxluqlar və əməllər", page: 22 },
  { id: "s2-2", code: "§2.2", title: "Adi kəsrlər", page: 27 },
  { id: "s2-3", code: "§2.3", title: "Faiz", page: 33 },
  { id: "s2-c", code: "§2.C", title: "Unit 2 yoxlama nöqtəsi", page: 38 },
  { id: "s3-1", code: "§3.1", title: "Onluq kəsrlər", page: 41 },
  { id: "s3-2", code: "§3.2", title: "Sadə tənliklər", page: 47 },
  { id: "s3-r", code: "§3.R", title: "Unit 3 üzrə təkrar", page: 52 },
];

const rules: Rule[] = [
  {
    id: "r-place-value",
    sectionId: "s1-1",
    title: "Rəqəmin mərtəbə qiyməti",
    statement:
      "Onluq say sistemində hər rəqəmin qiyməti onun yerindən (mərtəbəsindən) asılıdır. Sağdan sola: təklik, onluq, yüzlük, minlik, on minlik, yüz minlik...",
    formula: "… | minlik | yüzlük | onluq | təklik",
    example: {
      problem: "8 315 ədədində 3 rəqəmi hansı mərtəbədədir?",
      solution: [
        "Rəqəmləri sağdan sola say: 5 – təklik, 1 – onluq, 3 – yüzlük, 8 – minlik.",
        "Deməli, 3 rəqəmi yüzlük mərtəbəsindədir və qiyməti 300-dür.",
      ],
    },
  },
  {
    id: "r-classes",
    sectionId: "s1-1",
    title: "Ədədin siniflər üzrə yazılışı",
    statement:
      "Çoxrəqəmli ədəd sağdan sola hər birində 3 mərtəbə olan siniflərə bölünür: təkliklər, minlər, milyonlar. Boş mərtəbələrə 0 yazılır.",
    formula: "milyonlar | minlər | təkliklər  →  _ _ _ | _ _ _ | _ _ _",
    example: {
      problem: "2 milyon 5 min 30 ədədini rəqəmlərlə yazın.",
      solution: [
        "Milyonlar sinfi: 2.",
        "Minlər sinfi: 5 → üç rəqəmlə 005.",
        "Təkliklər sinfi: 30 → 030.",
        "Cavab: 2 005 030.",
      ],
    },
  },
  {
    id: "r-expanded",
    sectionId: "s1-1",
    title: "Mərtəbə toplananlarının cəmi şəklində yazılış",
    statement:
      "Hər natural ədədi mərtəbə vahidlərinin cəmi kimi yazmaq olar. Olmayan mərtəbənin yerinə 0 yazılır.",
    formula: "abcd = a·1000 + b·100 + c·10 + d",
    example: {
      problem: "4·1000 + 6·10 + 2 ədədini yazın.",
      solution: [
        "Minlik: 4, yüzlük: verilməyib → 0, onluq: 6, təklik: 2.",
        "Cavab: 4 062.",
      ],
    },
  },
  {
    id: "r-digit-count",
    sectionId: "s1-1",
    title: "n-rəqəmli ən kiçik və ən böyük ədəd",
    statement:
      "n-rəqəmli ən kiçik natural ədəd 1 və ardınca (n−1) sıfırdan ibarətdir; ən böyüyü isə n dənə 9-dan.",
    formula: "ən kiçik = 10ⁿ⁻¹,  ən böyük = 10ⁿ − 1",
    example: {
      problem: "Ən böyük üçrəqəmli ədəd hansıdır?",
      solution: ["n = 3 → 10³ − 1 = 999."],
    },
  },
  {
    id: "r-div3",
    sectionId: "s1-2",
    title: "3-ə bölünmə əlaməti",
    statement: "Rəqəmlərinin cəmi 3-ə bölünən ədəd 3-ə bölünür.",
    formula: "a ⋮ 3  ⇔  (rəqəmlərin cəmi) ⋮ 3",
    example: {
      problem: "2 151 ədədi 3-ə bölünürmü?",
      solution: ["2 + 1 + 5 + 1 = 9.", "9 ədədi 3-ə bölünür → 2 151 də 3-ə bölünür."],
    },
  },
  {
    id: "r-div9",
    sectionId: "s1-2",
    title: "9-a bölünmə əlaməti",
    statement: "Rəqəmlərinin cəmi 9-a bölünən ədəd 9-a bölünür.",
    formula: "a ⋮ 9  ⇔  (rəqəmlərin cəmi) ⋮ 9",
    example: {
      problem: "7 281 ədədi 9-a bölünürmü?",
      solution: ["7 + 2 + 8 + 1 = 18.", "18 ⋮ 9 → 7 281 ədədi 9-a bölünür."],
    },
  },
  {
    id: "r-div10",
    sectionId: "s1-2",
    title: "2-yə, 5-ə və 10-a bölünmə əlamətləri",
    statement:
      "Son rəqəmi cüt olan ədəd 2-yə, son rəqəmi 0 və ya 5 olan ədəd 5-ə bölünür. Həm 2-yə, həm 5-ə bölünən ədədin son rəqəmi 0 olur, yəni o 10-a bölünür.",
    formula: "a ⋮ 2 və a ⋮ 5  ⇔  son rəqəm = 0",
    example: {
      problem: "735 ədədi 10-a bölünürmü?",
      solution: ["Son rəqəm 5-dir, cüt deyil → 2-yə bölünmür.", "Deməli 10-a da bölünmür."],
    },
  },
  {
    id: "r-remainder",
    sectionId: "s1-2",
    title: "Qalıqlı bölmə",
    statement:
      "a ədədini b-yə böldükdə q tam qismət, r qalıq alınır. Qalıq həmişə böləndən kiçik olur.",
    formula: "a = b · q + r,   0 ≤ r < b",
    example: {
      problem: "38-i 5-ə qalıqla bölün.",
      solution: ["5-ə bölünən və 38-dən böyük olmayan ən böyük ədəd: 5·7 = 35.", "r = 38 − 35 = 3.", "38 = 5·7 + 3."],
    },
  },
  {
    id: "r-prime",
    sectionId: "s1-3",
    title: "Sadə və mürəkkəb ədədlər",
    statement:
      "Yalnız iki böləni (1 və özü) olan natural ədəd sadə ədəddir. İkidən çox böləni olan ədəd mürəkkəbdir. 1 nə sadə, nə də mürəkkəbdir.",
    formula: "p sadədir  ⇔  bölənləri yalnız {1, p}",
    example: {
      problem: "15 sadə ədəddirmi?",
      solution: ["15 = 3 · 5, yəni 3 və 5 də bölənidir.", "Bölənləri: 1, 3, 5, 15 → mürəkkəb ədəddir."],
    },
  },
  {
    id: "r-factorization",
    sectionId: "s1-3",
    title: "Sadə vuruqlara ayırma",
    statement:
      "Ədədi ardıcıl olaraq ən kiçik sadə böləninə bölərək yalnız sadə ədədlərin hasili şəklində yazırıq.",
    formula: "n = p₁ · p₂ · … · pₖ  (hər pᵢ sadədir)",
    example: {
      problem: "36-nı sadə vuruqlara ayırın.",
      solution: ["36 : 2 = 18", "18 : 2 = 9", "9 : 3 = 3", "3 : 3 = 1", "36 = 2 · 2 · 3 · 3."],
    },
  },
  {
    id: "r-gcd",
    sectionId: "s1-3",
    title: "Ən böyük ortaq bölən (ƏBOB)",
    statement:
      "Ədədləri sadə vuruqlara ayırın, ortaq sadə vuruqları ən kiçik qüvvətləri ilə götürüb vurun.",
    formula: "ƏBOB(a; b) = ortaq sadə vuruqların hasili",
    example: {
      problem: "ƏBOB(12; 30) = ?",
      solution: ["12 = 2·2·3", "30 = 2·3·5", "Ortaq vuruqlar: 2 və 3 → 2·3 = 6."],
    },
  },
  {
    id: "r-lcm",
    sectionId: "s1-3",
    title: "Ən kiçik ortaq bölünən (ƏKOB)",
    statement:
      "Hər iki ədədə bölünən ən kiçik natural ədəddir. Böyük ədədin bölünənlərini sırayla yoxlamaq və ya ƏBOB-dan istifadə etmək olar.",
    formula: "ƏKOB(a; b) = a · b : ƏBOB(a; b)",
    example: {
      problem: "ƏKOB(6; 8) = ?",
      solution: ["ƏBOB(6; 8) = 2.", "6 · 8 : 2 = 48 : 2 = 24."],
    },
  },
  {
    id: "r-intersection",
    sectionId: "s2-1",
    title: "Çoxluqların kəsişməsi",
    statement: "A və B çoxluqlarının kəsişməsi hər iki çoxluqda olan elementlərdən ibarətdir.",
    formula: "A ∩ B = { x | x ∈ A və x ∈ B }",
    example: {
      problem: "A = {2, 5, 7}, B = {5, 7, 9}. A ∩ B = ?",
      solution: ["Hər ikisində olan elementlər: 5 və 7.", "A ∩ B = {5, 7}."],
    },
  },
  {
    id: "r-union",
    sectionId: "s2-1",
    title: "Çoxluqların birləşməsi",
    statement:
      "A və B çoxluqlarının birləşməsi ən azı birində olan bütün elementlərdən ibarətdir. Təkrarlanan element bir dəfə yazılır.",
    formula: "A ∪ B = { x | x ∈ A və ya x ∈ B }",
    example: {
      problem: "A = {1, 2}, B = {2, 3}. A ∪ B = ?",
      solution: ["Bütün elementləri yığ: 1, 2, 2, 3.", "Təkrarı at: A ∪ B = {1, 2, 3}."],
    },
  },
  {
    id: "r-difference",
    sectionId: "s2-1",
    title: "Çoxluqların fərqi",
    statement: "A \\ B fərqi A-da olub, B-də olmayan elementlərdən ibarətdir.",
    formula: "A \\ B = { x | x ∈ A və x ∉ B }",
    example: {
      problem: "A = {1, 3, 5}, B = {3}. A \\ B = ?",
      solution: ["A-dan B-də olan 3-ü çıxar.", "A \\ B = {1, 5}."],
    },
  },
  {
    id: "r-reduce",
    sectionId: "s2-2",
    title: "Kəsrin ixtisarı",
    statement:
      "Kəsrin surət və məxrəcini onların ƏBOB-una bölsək, ixtisar olunmayan (sadə) kəsr alırıq.",
    formula: "a/b = (a : d) / (b : d),   d = ƏBOB(a; b)",
    example: {
      problem: "12/16 kəsrini ixtisar edin.",
      solution: ["ƏBOB(12; 16) = 4.", "12 : 4 = 3, 16 : 4 = 4 → 3/4."],
    },
  },
  {
    id: "r-compare-fractions",
    sectionId: "s2-2",
    title: "Kəsrlərin müqayisəsi",
    statement:
      "Məxrəcləri müxtəlif olan kəsrləri müqayisə etmək üçün onları ortaq məxrəcə gətirin; surəti böyük olan kəsr böyükdür.",
    formula: "a/b ? c/d  →  a·d ? c·b",
    example: {
      problem: "3/4 və 5/7 kəsrlərini müqayisə edin.",
      solution: ["Çarpaz vur: 3·7 = 21, 5·4 = 20.", "21 > 20 → 3/4 > 5/7."],
    },
  },
  {
    id: "r-add-fractions",
    sectionId: "s2-2",
    title: "Müxtəlif məxrəcli kəsrlərin toplanması və çıxılması",
    statement:
      "Kəsrləri ortaq məxrəcə (ƏKOB) gətirin, surətləri toplayın/çıxın, məxrəci saxlayın, sonra ixtisar edin.",
    formula: "a/b ± c/d = (a·k₁ ± c·k₂) / ƏKOB(b; d)",
    example: {
      problem: "1/2 + 1/3 = ?",
      solution: ["ƏKOB(2; 3) = 6.", "1/2 = 3/6, 1/3 = 2/6.", "3/6 + 2/6 = 5/6."],
    },
  },
  {
    id: "r-percent-of",
    sectionId: "s2-3",
    title: "Ədədin faizini tapmaq",
    statement: "Ədədin p%-ni tapmaq üçün ədədi p-yə vurub 100-ə bölürük.",
    formula: "a-nın p%-i = a · p / 100",
    example: {
      problem: "60-ın 15%-i neçədir?",
      solution: ["60 · 15 = 900.", "900 : 100 = 9."],
    },
  },
  {
    id: "r-number-by-percent",
    sectionId: "s2-3",
    title: "Faizinə görə ədədi tapmaq",
    statement: "Ədədin p%-i b-yə bərabərdirsə, ədədi tapmaq üçün b-ni p-yə bölüb 100-ə vururuq.",
    formula: "x = b · 100 / p",
    example: {
      problem: "Hansı ədədin 20%-i 8-dir?",
      solution: ["8 · 100 = 800.", "800 : 20 = 40."],
    },
  },
  {
    id: "r-fraction-to-percent",
    sectionId: "s2-3",
    title: "Kəsri faizlə ifadə etmək",
    statement: "Kəsri faizlə ifadə etmək üçün onu 100-ə vurub % işarəsi yazırıq.",
    formula: "a/b = (a/b · 100)%",
    example: {
      problem: "1/4 kəsrini faizlə ifadə edin.",
      solution: ["1/4 · 100 = 25.", "Cavab: 25%."],
    },
  },
  {
    id: "r-rounding",
    sectionId: "s3-1",
    title: "Onluq kəsrlərin yuvarlaqlaşdırılması",
    statement:
      "Yuvarlaqlaşdırılan mərtəbədən sonrakı rəqəm 5 və ya daha böyükdürsə, həmin mərtəbəyə 1 əlavə edilir; 5-dən kiçikdirsə, dəyişmir. Sonrakı rəqəmlər atılır.",
    formula: "növbəti rəqəm ≥ 5 → +1,   < 5 → dəyişmir",
    example: {
      problem: "2,74 ədədini onda birlərə qədər yuvarlaqlaşdırın.",
      solution: ["Onda birlər mərtəbəsi: 7, növbəti rəqəm: 4.", "4 < 5 → 7 dəyişmir.", "Cavab: 2,7."],
    },
  },
  {
    id: "r-decimal-add",
    sectionId: "s3-1",
    title: "Onluq kəsrlərin toplanması",
    statement:
      "Onluq kəsrləri toplayarkən vergül vergülün altında yazılır, çatışmayan yerlərə 0 əlavə edilir və mərtəbələr üzrə toplanır.",
    formula: "  a,bc\n+ d,e0\n------",
    example: {
      problem: "1,3 + 0,45 = ?",
      solution: ["1,30 + 0,45 şəklində yaz.", "Mərtəbələr üzrə topla: 1,75."],
    },
  },
  {
    id: "r-equation",
    sectionId: "s3-2",
    title: "Naməlum toplanan, azalan və vuruq",
    statement:
      "Naməlum toplananı tapmaq üçün cəmdən məlum toplananı çıx. Naməlum azalanı tapmaq üçün çıxılana fərqi əlavə et. Naməlum vuruğu tapmaq üçün hasili məlum vuruğa böl.",
    formula: "x + a = b → x = b − a   |   x − a = b → x = b + a   |   a·x = b → x = b : a",
    example: {
      problem: "x + 12 = 30",
      solution: ["x = 30 − 12.", "x = 18."],
    },
  },
];

const units: Unit[] = [
  {
    id: "u1",
    number: 1,
    title: "Natural ədədlər",
    subtitle: "Unit 1",
    tone: 1,
    lessons: [
      {
        id: "natural-onluq",
        title: "Natural ədədlər və onların onluq yazılışı",
        kind: "star",
        sectionId: "s1-1",
        questions: [
          {
            id: "q1",
            prompt: "5 042 ədədində 0 rəqəmi hansı mərtəbədədir?",
            options: ["Təklik", "Onluq", "Yüzlük", "Minlik"],
            answer: 2,
            ruleId: "r-place-value",
            steps: [
              "Ədədin rəqəmlərini sağdan sola yaz: 2, 4, 0, 5.",
              "Hər birinə mərtəbə adını ver: 1-ci – təklik, 2-ci – onluq, 3-cü – ...",
              "0 rəqəmi sağdan neçənci yerdədir? Ona uyğun mərtəbəni seç.",
            ],
          },
          {
            id: "q2",
            prompt: "«3 milyon 40 min 7» ədədi rəqəmlərlə necə yazılır?",
            options: ["3 040 007", "3 400 007", "340 007", "3 040 070"],
            answer: 0,
            ruleId: "r-classes",
            steps: [
              "Milyonlar sinfinə 3 yaz.",
              "Minlər sinfi 3 rəqəmli olmalıdır: 40 → 040.",
              "Təkliklər sinfi: 7 → 007. Üç sinfi yan-yana birləşdir.",
            ],
          },
          {
            id: "q3",
            prompt: "7 · 1000 + 3 · 100 + 5 ifadəsi hansı ədədə bərabərdir?",
            options: ["7 035", "7 305", "7 350", "73 005"],
            answer: 1,
            ruleId: "r-expanded",
            steps: [
              "Minlik rəqəmi: 7, yüzlük rəqəmi: 3.",
              "Onluq verilməyib → onun yerinə 0 yaz.",
              "Təklik: 5. Rəqəmləri sırayla yaz.",
            ],
          },
          {
            id: "q4",
            prompt: "Ən kiçik dördrəqəmli natural ədəd hansıdır?",
            options: ["999", "1 000", "1 001", "1 111"],
            answer: 1,
            ruleId: "r-digit-count",
            steps: [
              "Dördrəqəmli → n = 4.",
              "Ən kiçik n-rəqəmli ədəd = 10ⁿ⁻¹.",
              "10³ hesabla və variantlarla müqayisə et.",
            ],
          },
        ],
      },
      {
        id: "bolunme",
        title: "Bölünmə əlamətləri və qalıqlı bölmə",
        kind: "lightning",
        sectionId: "s1-2",
        questions: [
          {
            id: "q1",
            prompt: "Aşağıdakı ədədlərdən hansı 3-ə bölünür?",
            options: ["1 024", "2 341", "4 512", "7 105"],
            answer: 2,
            ruleId: "r-div3",
            steps: [
              "Hər variant üçün rəqəmlərin cəmini tap. Məs.: 1 024 → 1+0+2+4 = 7.",
              "Hansı cəm 3-ə qalıqsız bölünür?",
              "Həmin cəmə uyğun ədədi seç.",
            ],
          },
          {
            id: "q2",
            prompt: "Hansı ədəd həm 2-yə, həm də 5-ə bölünür?",
            options: ["125", "342", "560", "905"],
            answer: 2,
            ruleId: "r-div10",
            steps: [
              "Həm 2-yə, həm 5-ə bölünən ədəd 10-a bölünür.",
              "10-a bölünən ədədin son rəqəmi nədir?",
              "Variantların son rəqəmlərinə bax.",
            ],
          },
          {
            id: "q3",
            prompt: "47-ni 6-ya böldükdə qalıq neçə olur?",
            options: ["3", "5", "7", "1"],
            answer: 1,
            ruleId: "r-remainder",
            steps: [
              "6-ya bölünən və 47-dən böyük olmayan ən böyük ədədi tap (6 · ? ≤ 47).",
              "Qalıq = 47 − həmin ədəd.",
              "Yadda saxla: qalıq 6-dan kiçik olmalıdır.",
            ],
          },
          {
            id: "q4",
            prompt: "9-a bölünən ədədi seçin.",
            options: ["3 456", "2 345", "1 234", "5 551"],
            answer: 0,
            ruleId: "r-div9",
            steps: [
              "Hər variantın rəqəmlər cəmini hesabla.",
              "Cəmi 9-a (9, 18, 27...) bölünən variantı tap.",
            ],
          },
        ],
      },
      {
        id: "sade-murekkeb",
        title: "Sadə və mürəkkəb ədədlər, ƏBOB və ƏKOB",
        kind: "star",
        sectionId: "s1-3",
        questions: [
          {
            id: "q1",
            prompt: "Hansı ədəd sadə ədəddir?",
            options: ["21", "27", "29", "33"],
            answer: 2,
            ruleId: "r-prime",
            steps: [
              "Hər ədədin 1 və özündən başqa böləni varmı? 2, 3, 5, 7 ilə yoxla.",
              "21 = 3 · 7 kimi ayrılan ədədlər mürəkkəbdir.",
              "Heç bir əlavə böləni olmayan ədədi seç.",
            ],
          },
          {
            id: "q2",
            prompt: "ƏBOB(18; 24) neçəyə bərabərdir?",
            options: ["3", "6", "12", "72"],
            answer: 1,
            ruleId: "r-gcd",
            steps: [
              "18 = 2 · 3 · 3",
              "24 = 2 · 2 · 2 · 3",
              "Hər ikisində olan sadə vuruqları seç və vur.",
            ],
          },
          {
            id: "q3",
            prompt: "ƏKOB(4; 6) neçəyə bərabərdir?",
            options: ["2", "10", "12", "24"],
            answer: 2,
            ruleId: "r-lcm",
            steps: [
              "Əvvəlcə ƏBOB(4; 6)-nı tap.",
              "Düsturu tətbiq et: 4 · 6 : ƏBOB.",
            ],
          },
          {
            id: "q4",
            prompt: "60 ədədinin sadə vuruqlara ayrılışı hansıdır?",
            options: ["2 · 2 · 3 · 5", "2 · 3 · 10", "4 · 15", "2 · 2 · 15"],
            answer: 0,
            ruleId: "r-factorization",
            steps: [
              "60-ı ardıcıl 2-yə böl: 60 → 30 → 15.",
              "15-i 3-ə, sonra 5-ə böl.",
              "Bütün vuruqları sadə olan variantı seç (10, 4, 15 sadə deyil).",
            ],
          },
        ],
      },
      {
        id: "unit1-review",
        title: "Unit 1 Review",
        kind: "review",
        sectionId: "s1-r",
        questions: [
          {
            id: "q1",
            prompt: "8 _ 4 ədədində boş xanaya hansı rəqəm yazılsa, ədəd 3-ə bölünər?",
            options: ["1", "2", "3", "5"],
            answer: 2,
            ruleId: "r-div3",
            steps: [
              "Məlum rəqəmlərin cəmi: 8 + 4 = 12.",
              "12 + x cəmi 3-ə bölünməlidir.",
              "Variantları bir-bir əlavə edib yoxla.",
            ],
          },
          {
            id: "q2",
            prompt: "ƏBOB(12; 18) + ƏKOB(12; 18) = ?",
            options: ["42", "36", "48", "30"],
            answer: 0,
            ruleId: "r-lcm",
            steps: [
              "12 = 2·2·3, 18 = 2·3·3 → ƏBOB-u tap.",
              "ƏKOB = 12 · 18 : ƏBOB.",
              "İki nəticəni topla.",
            ],
          },
          {
            id: "q3",
            prompt: "«Altı yüz min iki yüz» ədədi necə yazılır?",
            options: ["600 200", "60 200", "6 000 200", "620 000"],
            answer: 0,
            ruleId: "r-classes",
            steps: [
              "Minlər sinfi: altı yüz → 600.",
              "Təkliklər sinfi: iki yüz → 200.",
              "Sinifləri yan-yana yaz.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "u2",
    number: 2,
    title: "Çoxluqlar, kəsrlər və faiz",
    subtitle: "Unit 2",
    tone: 2,
    lessons: [
      {
        id: "coxluqlar",
        title: "Çoxluqlar və onlar üzərində əməllər",
        kind: "star",
        sectionId: "s2-1",
        questions: [
          {
            id: "q1",
            prompt: "A = {1, 2, 3, 4}, B = {3, 4, 5}. A ∩ B = ?",
            options: ["{1, 2}", "{3, 4}", "{1, 2, 3, 4, 5}", "{5}"],
            answer: 1,
            ruleId: "r-intersection",
            steps: [
              "A-nın hər elementini götür və B-də olub-olmadığını yoxla.",
              "Yalnız hər ikisində olanları saxla.",
            ],
          },
          {
            id: "q2",
            prompt: "A = {1, 2, 3, 4}, B = {3, 4, 5}. A ∪ B = ?",
            options: ["{3, 4}", "{1, 2, 5}", "{1, 2, 3, 4, 5}", "{1, 2, 3, 3, 4, 4, 5}"],
            answer: 2,
            ruleId: "r-union",
            steps: [
              "Hər iki çoxluğun elementlərini bir yerə yığ.",
              "Təkrarlanan elementləri yalnız bir dəfə yaz.",
            ],
          },
          {
            id: "q3",
            prompt: "A = {2, 4, 6, 8}, B = {4, 8}. A \\ B = ?",
            options: ["{2, 6}", "{4, 8}", "{2, 4, 6, 8}", "∅"],
            answer: 0,
            ruleId: "r-difference",
            steps: ["A-nın elementlərindən B-də olanları sil.", "Qalan elementləri seç."],
          },
        ],
      },
      {
        id: "kesrler",
        title: "Adi kəsrlər: ixtisar və müqayisə",
        kind: "lightning",
        sectionId: "s2-2",
        questions: [
          {
            id: "q1",
            prompt: "18/24 kəsrini sona qədər ixtisar edin.",
            options: ["9/12", "3/4", "2/3", "6/8"],
            answer: 1,
            ruleId: "r-reduce",
            steps: [
              "ƏBOB(18; 24)-ü tap.",
              "Surəti və məxrəci həmin ədədə böl.",
              "Diqqət: 9/12 və 6/8 hələ ixtisar oluna bilər.",
            ],
          },
          {
            id: "q2",
            prompt: "Hansı kəsr ən böyükdür?",
            options: ["2/3", "3/5", "5/8", "7/12"],
            answer: 0,
            ruleId: "r-compare-fractions",
            steps: [
              "Ortaq məxrəc seç: ƏKOB(3; 5; 8; 12) = 120.",
              "Hər kəsri 120 məxrəcinə gətir (məs. 3/5 = 72/120).",
              "Surəti ən böyük olanı seç.",
            ],
          },
          {
            id: "q3",
            prompt: "1/4 + 2/3 = ?",
            options: ["3/7", "11/12", "3/12", "2/12"],
            answer: 1,
            ruleId: "r-add-fractions",
            steps: [
              "ƏKOB(4; 3) = 12.",
              "1/4 = 3/12, 2/3 = ?/12.",
              "Surətləri topla, məxrəc 12 qalır.",
            ],
          },
        ],
      },
      {
        id: "faiz",
        title: "Faiz anlayışı və faizin tapılması",
        kind: "star",
        sectionId: "s2-3",
        questions: [
          {
            id: "q1",
            prompt: "80-in 25%-i neçədir?",
            options: ["20", "25", "16", "32"],
            answer: 0,
            ruleId: "r-percent-of",
            steps: ["80 · 25 hasilini tap.", "Nəticəni 100-ə böl."],
          },
          {
            id: "q2",
            prompt: "Hansı ədədin 10%-i 15-dir?",
            options: ["1,5", "15", "150", "1 500"],
            answer: 2,
            ruleId: "r-number-by-percent",
            steps: ["Düstur: x = b · 100 / p.", "b = 15, p = 10 qoy və hesabla."],
          },
          {
            id: "q3",
            prompt: "3/5 kəsrini faizlə ifadə edin.",
            options: ["35%", "53%", "60%", "6%"],
            answer: 2,
            ruleId: "r-fraction-to-percent",
            steps: ["3/5 · 100 hesabla.", "Nəticənin yanına % işarəsi yaz."],
          },
        ],
      },
      {
        id: "unit2-checkpoint",
        title: "Unit 2 Checkpoint",
        kind: "checkpoint",
        sectionId: "s2-c",
        questions: [
          {
            id: "q1",
            prompt: "A = {1, 3, 5, 7}, B = {5, 7, 9}. A ∩ B neçə elementdən ibarətdir?",
            options: ["1", "2", "3", "5"],
            answer: 1,
            ruleId: "r-intersection",
            steps: ["Hər iki çoxluqda olan elementləri yaz.", "Onları say."],
          },
          {
            id: "q2",
            prompt: "200 manatlıq malın qiyməti 15% endirildi. Yeni qiymət neçə manatdır?",
            options: ["185", "170", "150", "30"],
            answer: 1,
            ruleId: "r-percent-of",
            steps: [
              "Endirimin məbləğini tap: 200-ün 15%-i.",
              "Köhnə qiymətdən endirimi çıx.",
            ],
          },
          {
            id: "q3",
            prompt: "5/6 − 1/3 = ?",
            options: ["4/3", "1/2", "2/3", "1/6"],
            answer: 1,
            ruleId: "r-add-fractions",
            steps: ["1/3-ü 6 məxrəcinə gətir.", "Surətləri çıx.", "Alınan kəsri ixtisar et."],
          },
        ],
      },
    ],
  },
  {
    id: "u3",
    number: 3,
    title: "Onluq kəsrlər və tənliklər",
    subtitle: "Unit 3",
    tone: 3,
    lessons: [
      {
        id: "onluq-kesrler",
        title: "Onluq kəsrlər və yuvarlaqlaşdırma",
        kind: "star",
        sectionId: "s3-1",
        questions: [
          {
            id: "q1",
            prompt: "3,476 ədədini onda birlərə qədər yuvarlaqlaşdırın.",
            options: ["3,4", "3,5", "3,48", "4"],
            answer: 1,
            ruleId: "r-rounding",
            steps: [
              "Onda birlər mərtəbəsindəki rəqəm: 4.",
              "Ondan sonrakı rəqəm: 7. 7 ≥ 5-dir?",
              "Qaydaya görə onda birlər rəqəmini dəyiş və qalanları at.",
            ],
          },
          {
            id: "q2",
            prompt: "0,25 + 1,7 = ?",
            options: ["0,42", "1,95", "1,72", "2,05"],
            answer: 1,
            ruleId: "r-decimal-add",
            steps: ["1,7-ni 1,70 kimi yaz.", "Vergülü vergülün altına qoyub topla."],
          },
        ],
      },
      {
        id: "tenlikler",
        title: "Sadə tənliklər",
        kind: "lightning",
        sectionId: "s3-2",
        questions: [
          {
            id: "q1",
            prompt: "x + 17 = 45 olarsa, x = ?",
            options: ["62", "28", "38", "18"],
            answer: 1,
            ruleId: "r-equation",
            steps: ["x naməlum toplanandır.", "Cəmdən (45) məlum toplananı (17) çıx."],
          },
          {
            id: "q2",
            prompt: "3x = 27 olarsa, x = ?",
            options: ["24", "30", "9", "81"],
            answer: 2,
            ruleId: "r-equation",
            steps: ["x naməlum vuruqdur.", "Hasili (27) məlum vuruğa (3) böl."],
          },
        ],
      },
      {
        id: "unit3-review",
        title: "Unit 3 Review",
        kind: "review",
        sectionId: "s3-r",
        questions: [
          {
            id: "q1",
            prompt: "12,96 ədədini tam ədədə qədər yuvarlaqlaşdırın.",
            options: ["12", "13", "12,9", "12,1"],
            answer: 1,
            ruleId: "r-rounding",
            steps: ["Təkliklər rəqəmi: 2, növbəti rəqəm: 9.", "9 ≥ 5 → qaydanı tətbiq et."],
          },
          {
            id: "q2",
            prompt: "x − 8 = 15 olarsa, x = ?",
            options: ["7", "23", "120", "13"],
            answer: 1,
            ruleId: "r-equation",
            steps: ["x naməlum azalandır.", "Çıxılana (8) fərqi (15) əlavə et."],
          },
        ],
      },
    ],
  },
];

export const curriculum: Curriculum = {
  source: {
    file: "Riyaziyyat-5_Kurikulum.pdf",
    pages: 56,
    subject: "Riyaziyyat",
    grade: "5-ci sinif",
  },
  sections,
  rules,
  units,
};

export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export function allLessons(c: Curriculum = curriculum): Lesson[] {
  return c.units.flatMap((u) => u.lessons);
}

export function findLesson(id: string, c: Curriculum = curriculum) {
  for (const unit of c.units) {
    const lesson = unit.lessons.find((l) => l.id === id);
    if (lesson) return { unit, lesson };
  }
  return undefined;
}

export function getRule(id: string, c: Curriculum = curriculum): Rule | undefined {
  return c.rules.find((r) => r.id === id);
}

export function getSection(id: string, c: Curriculum = curriculum): PdfSection | undefined {
  return c.sections.find((s) => s.id === id);
}

export function curriculumStats(c: Curriculum = curriculum) {
  const lessons = allLessons(c);
  return {
    units: c.units.length,
    lessons: lessons.length,
    questions: lessons.reduce((n, l) => n + l.questions.length, 0),
    rules: c.rules.length,
    sections: c.sections.length,
  };
}
