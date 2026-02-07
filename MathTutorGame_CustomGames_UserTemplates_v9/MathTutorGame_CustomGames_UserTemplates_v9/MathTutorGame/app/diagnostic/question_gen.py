from __future__ import annotations

from typing import Tuple
import random

# مولّد أسئلة: جميع الإجابات تكون "رقم" أو "اختيار برقم" قدر الإمكان
# - المقارنات: الطالب يكتب 1 أو 2
# - ترتيب الأعداد: الطالب يختار رقم الخيار 1/2/3
# - زوجي/فردي: 1=زوجي، 2=فردي
# - نعم/لا: 1=نعم، 2=لا


def _randint(a: int, b: int) -> int:
    return random.randint(a, b)


def _mcq_order(nums: list[int]) -> Tuple[str, str]:
    """سؤال ترتيب بثلاث خيارات. الإجابة هي رقم الخيار الصحيح (1/2/3)."""
    correct = sorted(nums)
    # خياران خاطئان (تبديلات)
    wrong1 = nums[:]  # as-is
    wrong2 = nums[::-1]
    # ضمان عدم تكرار نفس الصحيح
    options = [correct, wrong1, wrong2]
    # إزالة التكرارات إن حصلت
    uniq = []
    for o in options:
        if o not in uniq:
            uniq.append(o)
    while len(uniq) < 3:
        cand = random.sample(nums, len(nums))
        if cand not in uniq:
            uniq.append(cand)
    random.shuffle(uniq)
    correct_idx = uniq.index(correct) + 1
    q = (
        f"رتّب تصاعدياً الأعداد: {nums[0]} ، {nums[1]} ، {nums[2]}\n"
        f"اختر الإجابة الصحيحة (اكتب رقم الخيار):\n"
        f"1) {uniq[0][0]},{uniq[0][1]},{uniq[0][2]}\n"
        f"2) {uniq[1][0]},{uniq[1][1]},{uniq[1][2]}\n"
        f"3) {uniq[2][0]},{uniq[2][1]},{uniq[2][2]}"
    )
    return q, str(correct_idx)


def generate_question(skill_id: str) -> Tuple[str, str]:
    # ---------- Grade 1 ----------
    if skill_id == "G1_count_to_20":
        n = _randint(0, 19)
        return (f"اكتب العدد التالي بعد {n} :", str(n + 1))

    if skill_id == "G1_compare_0_20":
        a, b = _randint(0, 20), _randint(0, 20)
        while a == b:
            b = _randint(0, 20)
        # إجابة رقمية: 1 إذا الأول أكبر، 2 إذا الثاني أكبر
        ans = "1" if a > b else "2"
        q = f"قارن بين العددين: {a} و {b}.\nاكتب 1 إذا {a} أكبر، أو 2 إذا {b} أكبر."
        return q, ans

    if skill_id == "G1_order_0_20":
        nums = random.sample(range(0, 21), 3)
        return _mcq_order(nums)

    if skill_id == "G1_place_value_tens_ones":
        tens = _randint(1, 9)
        ones = _randint(0, 9)
        n = tens * 10 + ones
        return (f"اكتب العدد الذي فيه {tens} عشرات و {ones} آحاد:", str(n))

    if skill_id == "G1_add_within_10":
        a = _randint(0, 10)
        b = _randint(0, 10 - a)
        return (f"كم ناتج {a} + {b} ؟", str(a + b))

    if skill_id == "G1_add_within_18":
        a = _randint(0, 18)
        b = _randint(0, 18 - a)
        return (f"كم ناتج {a} + {b} ؟", str(a + b))

    if skill_id == "G1_sub_within_10":
        a = _randint(0, 10)
        b = _randint(0, a)
        return (f"كم ناتج {a} - {b} ؟", str(a - b))

    if skill_id == "G1_sub_within_18":
        a = _randint(0, 18)
        b = _randint(0, a)
        return (f"كم ناتج {a} - {b} ؟", str(a - b))

    if skill_id == "G1_numbers_21_99":
        tens = _randint(2, 9)
        ones = _randint(0, 9)
        n = tens * 10 + ones
        return (f"اكتب العدد الذي فيه {tens} عشرات و {ones} آحاد:", str(n))

    if skill_id == "G1_shapes_basic":
        # إجابة رقمية: عدد الأضلاع
        shape = random.choice([
            ("مثلث", 3),
            ("مربع", 4),
            ("مستطيل", 4),
            ("دائرة", 0),
        ])
        return (f"كم عدد الأضلاع في شكل {shape[0]} ؟", str(shape[1]))

    # ---------- Grade 2 ----------
    if skill_id == "G2_compare_to_999":
        a, b = _randint(0, 999), _randint(0, 999)
        while a == b:
            b = _randint(0, 999)
        ans = "1" if a > b else "2"
        q = f"قارن بين العددين: {a} و {b}.\nاكتب 1 إذا {a} أكبر، أو 2 إذا {b} أكبر."
        return q, ans

    if skill_id == "G2_odd_even":
        n = _randint(0, 999)
        ans = "1" if n % 2 == 0 else "2"
        q = f"هل العدد {n} زوجي أم فردي؟\nاكتب 1 للزوجي، أو 2 للفردي."
        return q, ans

    if skill_id == "G2_add_2digits_no_carry":
        a = _randint(10, 99)
        b = _randint(10, 99)
        b = (b // 10) * 10 + _randint(0, 9 - (a % 10))
        return (f"احسب: {a} + {b}", str(a + b))

    if skill_id == "G2_add_2digits_with_carry":
        a = _randint(10, 99)
        b = _randint(10, 99)
        if (a % 10) + (b % 10) < 10:
            b = (b // 10) * 10 + _randint(10 - (a % 10), 9)
        return (f"احسب: {a} + {b}", str(a + b))

    if skill_id == "G2_sub_2digits_no_borrow":
        a = _randint(10, 99)
        b = _randint(10, a)
        if (a % 10) < (b % 10):
            b = (b // 10) * 10 + _randint(0, a % 10)
        return (f"احسب: {a} - {b}", str(a - b))

    if skill_id == "G2_sub_2digits_with_borrow":
        a = _randint(20, 99)
        b = _randint(10, a)
        if (a % 10) >= (b % 10):
            b = (b // 10) * 10 + _randint(a % 10 + 1, 9)
        return (f"احسب: {a} - {b}", str(a - b))

    if skill_id == "G2_add_3digits_no_carry":
        a = _randint(100, 999)
        b = _randint(100, 999)
        ones_b = _randint(0, 9 - (a % 10))
        tens_b = _randint(0, 9 - ((a // 10) % 10))
        b = (b // 100) * 100 + tens_b * 10 + ones_b
        return (f"احسب: {a} + {b}", str(a + b))

    if skill_id == "G2_add_3digits_with_carry":
        a = _randint(100, 999)
        b = _randint(100, 999)
        ones_b = _randint(max(0, 10 - (a % 10)), 9)
        b = (b // 10) * 10 + ones_b
        return (f"احسب: {a} + {b}", str(a + b))

    if skill_id == "G2_sub_3digits_no_borrow":
        a = _randint(100, 999)
        b = _randint(100, a)
        if (a % 10) < (b % 10):
            b = (b // 10) * 10 + _randint(0, a % 10)
        return (f"احسب: {a} - {b}", str(a - b))

    if skill_id == "G2_sub_3digits_with_borrow":
        a = _randint(200, 999)
        b = _randint(100, a)
        if (a % 10) >= (b % 10):
            b = (b // 10) * 10 + _randint(a % 10 + 1, 9)
        return (f"احسب: {a} - {b}", str(a - b))

    if skill_id == "G2_mult_concept":
        groups = _randint(2, 9)
        size = _randint(2, 9)
        return (f"لدينا {groups} مجموعات، في كل مجموعة {size} عناصر. كم المجموع؟", str(groups * size))

    if skill_id == "G2_mult_facts_2_5_10":
        m = random.choice([2, 5, 10])
        n = _randint(0, 10)
        return (f"احسب: {m} × {n}", str(m * n))

    if skill_id == "G2_div_concept":
        divisor = random.choice([2, 3, 4, 5])
        q = _randint(1, 10)
        n = divisor * q
        return (f"اقسم: {n} ÷ {divisor}", str(q))

    if skill_id == "G2_fractions_basic":
        denom = random.choice([2, 3, 4])
        name = "نصف" if denom == 2 else "ثلث" if denom == 3 else "ربع"
        return (f"اكتب الكسر ({name}) بالأرقام (مثال: 1/2)", f"1/{denom}")

    if skill_id == "G2_time_read_clock":
        h = _randint(1, 12)
        m = random.choice([0, 30])
        txt = "تماماً" if m == 0 else "ونصف"
        return (f"اكتبي الوقت: الساعة {h} {txt} (اكتبي بصيغة HH:MM)", f"{h:02d}:{m:02d}")

    if skill_id == "G2_data_simple":
        a, b, c = _randint(1, 9), _randint(1, 9), _randint(1, 9)
        mx = max(a, b, c)
        # 1=أحمد،2=ليلى،3=سارة
        ans = "1" if a == mx else "2" if b == mx else "3"
        q = (
            f"قيم ثلاثة أطفال: أحمد={a}، ليلى={b}، سارة={c}.\n"
            f"من الأعلى؟ اكتب 1 لأحمد، 2 لليلى، 3 لسارة."
        )
        return q, ans

    # ---------- Grade 3 ----------
    if skill_id == "G3_place_value_9999":
        n = _randint(1000, 9999)
        a = (n // 1000) * 1000
        b = ((n // 100) % 10) * 100
        c = ((n // 10) % 10) * 10
        d = n % 10
        return (f"ما العدد الذي يمثله: {a}+{b}+{c}+{d} ؟", str(n))

    if skill_id == "G3_rounding":
        n = _randint(100, 9999)
        place = random.choice([10, 100, 1000])
        rounded = int(round(n / place) * place)
        return (f"قرّب العدد {n} لأقرب {place}", str(rounded))

    if skill_id == "G3_add_4digits_no_carry":
        a = _randint(1000, 9999)
        b = _randint(1000, 9999)
        ones_b = _randint(0, 9 - (a % 10))
        b = (b // 10) * 10 + ones_b
        return (f"احسب: {a} + {b}", str(a + b))

    if skill_id == "G3_add_4digits_with_carry":
        a = _randint(1000, 9999)
        b = _randint(1000, 9999)
        ones_b = _randint(max(0, 10 - (a % 10)), 9)
        b = (b // 10) * 10 + ones_b
        return (f"احسب: {a} + {b}", str(a + b))

    if skill_id == "G3_sub_4digits_no_borrow":
        a = _randint(1000, 9999)
        b = _randint(1000, a)
        if (a % 10) < (b % 10):
            b = (b // 10) * 10 + _randint(0, a % 10)
        return (f"احسب: {a} - {b}", str(a - b))

    if skill_id == "G3_sub_4digits_with_borrow":
        a = _randint(2000, 9999)
        b = _randint(1000, a)
        if (a % 10) >= (b % 10):
            b = (b // 10) * 10 + _randint(a % 10 + 1, 9)
        return (f"احسب: {a} - {b}", str(a - b))

    if skill_id == "G3_geometry_angles":
        # 1=حاد، 2=قائم، 3=منفرج
        return ("ما نوع الزاوية 90 درجة؟\nاكتب 1 حادة، 2 قائمة، 3 منفرجة.", "2")

    if skill_id == "G3_shapes_rect_square_triangle":
        return ("كم عدد أضلاع المثلث؟", "3")

    if skill_id == "G3_data_representation":
        a, b, c = _randint(5, 20), _randint(5, 20), _randint(5, 20)
        total = a + b + c
        return (f"مبيعات 3 أيام: {a}, {b}, {c}. ما المجموع؟", str(total))

    if skill_id == "G3_add_sub_99999":
        a = _randint(10000, 99999)
        b = _randint(10000, 99999)
        op = random.choice(["+", "-"])
        if op == "-" and b > a:
            a, b = b, a
        ans = a + b if op == "+" else a - b
        return (f"احسب: {a} {op} {b}", str(ans))

    if skill_id == "G3_mult_facts_to_9":
        a, b = _randint(0, 9), _randint(0, 9)
        return (f"احسب: {a} × {b}", str(a * b))

    if skill_id == "G3_div_basic":
        d = _randint(2, 9)
        q = _randint(1, 9)
        n = d * q
        return (f"احسب: {n} ÷ {d}", str(q))

    if skill_id == "G3_fractions_equivalent":
        base = random.choice([(1, 2), (1, 3), (2, 3)])
        k = random.choice([2, 3])
        return (
            f"أعطِ كسرًا مكافئًا لـ {base[0]}/{base[1]} (اكتب بالشكل a/b)",
            f"{base[0] * k}/{base[1] * k}",
        )

    if skill_id == "G3_fractions_compare":
        denom = random.choice([4, 5, 6, 8])
        a = _randint(1, denom - 1)
        b = _randint(1, denom - 1)
        while a == b:
            b = _randint(1, denom - 1)
        ans = "1" if a > b else "2"
        q = f"قارن: {a}/{denom} و {b}/{denom}.\nاكتب 1 إذا الكسر الأول أكبر، أو 2 إذا الثاني أكبر."
        return q, ans

    if skill_id == "G3_measurement_length_mass_time":
        # 1=المتر أكبر، 2=السم أكبر
        return ("أي أكبر: 1 متر أم 90 سم؟\nاكتب 1 إذا 1 متر أكبر، أو 2 إذا 90 سم أكبر.", "1")

    if skill_id == "G3_perimeter_area":
        l, w = _randint(2, 15), _randint(2, 15)
        p = 2 * (l + w)
        return (f"مستطيل طوله {l} وعرضه {w}. ما محيطه؟", str(p))

    # ---------- Grade 4 ----------
    if skill_id == "G4_large_numbers_999999":
        n = _randint(100000, 999999)
        return (f"ما قيمة رقم الآلاف في العدد {n}؟", str((n // 1000) % 10))

    if skill_id == "G4_mult_1digit_by_2_3digits":
        a = _randint(2, 9)
        b = random.choice([_randint(10, 99), _randint(100, 999)])
        return (f"احسب: {a} × {b}", str(a * b))

    if skill_id == "G4_div_2digits_by_1digit":
        d = _randint(2, 9)
        q = _randint(10, 99)
        n = d * q
        if random.random() < 0.3:
            n += _randint(1, d - 1)
            return (f"اقسم: {n} ÷ {d} (اكتب خارج القسمة فقط)", str(n // d))
        return (f"اقسم: {n} ÷ {d}", str(q))

    if skill_id == "G4_fractions_add_sub":
        denom = random.choice([4, 5, 6, 8, 10])
        a = _randint(1, denom - 1)
        b = _randint(1, denom - 1)
        op = random.choice(["+", "-"])
        if op == "-" and b > a:
            a, b = b, a
        num = a + b if op == "+" else a - b
        return (f"احسب: {a}/{denom} {op} {b}/{denom} (اكتب الناتج ككسر a/b)", f"{num}/{denom}")

    if skill_id == "G4_lines_parallel_perp":
        return ("كم درجة الزاوية بين مستقيمين متعامدين؟", "90")

    if skill_id == "G4_angles_triangle":
        return ("مجموع زوايا المثلث يساوي كم درجة؟", "180")

    if skill_id == "G4_data_tables_bars":
        a, b, c = _randint(1, 20), _randint(1, 20), _randint(1, 20)
        return (
            f"قيم الأعمدة: أ={a}، ب={b}، ج={c}. ما الفرق بين أكبر قيمة وأصغر قيمة؟",
            str(max(a, b, c) - min(a, b, c)),
        )

    if skill_id == "G4_multiples":
        n = _randint(2, 12)
        k = _randint(2, 10)
        return (f"ما المضاعف رقم {k} للعدد {n}؟", str(n * k))

    if skill_id == "G4_divisibility_2_3_5_6":
        n = _randint(10, 999)
        d = random.choice([2, 3, 5, 6])
        ans = "1" if n % d == 0 else "2"
        q = f"هل العدد {n} يقبل القسمة على {d}؟\nاكتب 1 نعم، أو 2 لا."
        return q, ans

    if skill_id == "G4_mult_2by2_3by2":
        a = random.choice([_randint(10, 99), _randint(100, 999)])
        b = _randint(10, 99)
        return (f"احسب: {a} × {b}", str(a * b))

    if skill_id == "G4_div_2by2_3by2":
        d = _randint(10, 99)
        q = _randint(10, 99)
        n = d * q
        return (f"احسب: {n} ÷ {d}", str(q))

    if skill_id == "G4_decimals_add_sub":
        a = round(random.uniform(0.1, 99.9), 1)
        b = round(random.uniform(0.1, 99.9), 1)
        op = random.choice(["+", "-"])
        if op == "-" and b > a:
            a, b = b, a
        ans = a + b if op == "+" else a - b
        return (f"احسب: {a} {op} {b} (قرّب إلى منزلة عشرية)", f"{ans:.1f}")

    if skill_id == "G4_perimeter_rectangle_square":
        l, w = _randint(2, 30), _randint(2, 30)
        p = 2 * (l + w)
        return (f"مستطيل طوله {l} وعرضه {w}. ما محيطه؟", str(p))

    if skill_id == "G4_unit_conversion":
        cm = _randint(100, 990)
        return (f"حوّل {cm} سم إلى متر (اكتب عددًا عشريًا)", f"{cm / 100:.2f}")

    if skill_id == "G4_volume_rect_prism":
        l, w, h = _randint(2, 10), _randint(2, 10), _randint(2, 10)
        return (f"متوازي مستطيلات أبعاده {l}×{w}×{h}. ما حجمه؟", str(l * w * h))

    if skill_id == "G4_probability_basic":
        return ("قطعة نقود: ما احتمال ظهور صورة؟ (اكتب كسر a/b)", "1/2")

    # fallback
    return ("سؤال غير معرف لهذه المهارة.", "")
