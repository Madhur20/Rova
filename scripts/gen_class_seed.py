# Generates the simulated class seed for Rova (D-005). Deterministic: same output every run.
# Usage: python3 scripts/gen_class_seed.py lib/data/seed   (owner: Person B)
import json, random, sys
out = sys.argv[1]
random.seed(6)
T = "2026-10-17T19:00:00.000Z"
skills = ["6.RP.A.3", "6.RP.A.1", "4.NF.A.1", "3.NF.A.3", "3.OA.C.7"]
# Maya is the README persona; classmates get generic labels (no person names), ids s02..s25.
names = ["Maya"] + [f"Student {i}" for i in range(2, 26)]
langs = {"Maya": "es", "Student 8": "es", "Student 12": "es", "Student 19": "es",
         "Student 20": "zh", "Student 23": "ar"}
# Exactly 5 share the 4th-grade equivalent-fractions gap (README: "group of 5 share this root cause").
fraction_gap = {"Maya", "Student 4", "Student 12", "Student 15", "Student 24"}
# A smaller, separate gap so the heatmap is not one-dimensional.
mult_gap = {"Student 14", "Student 18"}
def r(lo, hi): return round(random.uniform(lo, hi), 2)
students, states = [], []
for n in names:
    sid = "maya" if n == "Maya" else f"s{int(n.split()[1]):02d}"
    students.append({"id": sid, "first_name": n, "grade": 6,
                     "buddy_name": "Rova", "language_home": langs.get(n, "en"), "interests": []})
    for sk in skills:
        if sk == "4.NF.A.1":
            m = 0.3 if n == "Maya" else (r(0.2, 0.35) if n in fraction_gap else r(0.7, 0.95))
        elif sk == "3.OA.C.7":
            m = 0.9 if n == "Maya" else (r(0.25, 0.4) if n in mult_gap else r(0.75, 0.98))
        elif sk == "3.NF.A.3":
            m = 0.8 if n == "Maya" else r(0.65, 0.95)
        elif sk == "6.RP.A.1":
            m = 0.6 if n == "Maya" else (r(0.4, 0.6) if n in fraction_gap | mult_gap else r(0.6, 0.9))
        else:  # 6.RP.A.3, the current unit, just starting
            m = 0.0 if n == "Maya" else (r(0.1, 0.3) if n in fraction_gap | mult_gap else r(0.3, 0.7))
        mis = ["adds-across-ratio-table"] if (sk == "6.RP.A.3" and n in fraction_gap and n != "Maya") else []
        states.append({"student_id": sid, "skill_id": sk, "mastery": m, "misconceptions": mis, "last_seen": T})
classroom = {"id": "rivera-p3", "teacher": "Ms. Rivera", "name": "Math 6 · Period 3",
             "student_ids": [s["id"] for s in students]}
for fname, data in [("students.json", students), ("skillStates.json", states), ("classroom.json", classroom)]:
    with open(f"{out}/{fname}", "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False); f.write("\n")
