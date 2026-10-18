// Common wrong answers for every practice question, and what each one usually means.
// Code matches a learner's checked answer against this list; nothing here is guessed by a model.
// `label` names the mistake for teachers, `why` explains its likely cause, `nudge` is the
// coach's student-facing hint (it never states the answer).

export interface Mistake {
  answers: string[];
  label: string;
  why: string;
  nudge: string;
}

export const mistakes: Record<string, Mistake[]> = {
  pv1: [
    { answers: ["4"], label: "Read the digit, not its value", why: "Names the digit without using its place.", nudge: "The digit is 4, but what is it worth in its place?" },
    { answers: ["400"], label: "Counted the wrong place", why: "Lost track of which place the digit sits in.", nudge: "Count places from the ones: ones, tens, hundreds, thousands." },
    { answers: ["40000"], label: "Counted the wrong place", why: "Lost track of which place the digit sits in.", nudge: "Count places from the ones: ones, tens, hundreds, thousands." },
  ],
  pv2: [
    { answers: ["6235", "6352", "3625"], label: "Mixed up place order", why: "Writes the digits in the order given instead of by place.", nudge: "Write each part in its own place: thousands, hundreds, tens, ones." },
    { answers: ["63250", "632500"], label: "Added extra zeros", why: "Keeps the zeros from each expanded part instead of combining them.", nudge: "6,000 + 300 + 20 + 5 makes one four-digit number." },
  ],
  pv3: [
    { answers: ["42000"], label: "Rounded down past a 7", why: "Ignores the hundreds digit when deciding to round up.", nudge: "Look at the hundreds digit. Is it 5 or more?" },
    { answers: ["42700"], label: "Rounded to the wrong place", why: "Rounds to the nearest hundred instead of thousand.", nudge: "Which place are we rounding to? Find the thousands digit first." },
    { answers: ["40000"], label: "Rounded to the wrong place", why: "Rounds to the nearest ten thousand instead of thousand.", nudge: "Which place are we rounding to? Find the thousands digit first." },
  ],
  mu1: [
    { answers: ["64"], label: "Multiplied only the tens", why: "Multiplies 6 × 10 and then adds the 4 instead of multiplying it.", nudge: "Both parts get multiplied: 6 × 10 and 6 × 4." },
    { answers: ["60", "24"], label: "Used only one partial product", why: "Finds one part of the split and stops.", nudge: "You split 14 into 10 and 4. Did you find both products and add them?" },
    { answers: ["20"], label: "Added instead of multiplied", why: "Treats equal groups as addition of the two numbers.", nudge: "6 rows of 14 means 6 equal groups. Is that 6 + 14?" },
  ],
  mu2: [
    { answers: ["83"], label: "Multiplied only the tens", why: "Multiplies 20 × 4 and then adds the 3.", nudge: "Both parts get multiplied: 20 × 4 and 3 × 4." },
    { answers: ["27"], label: "Added instead of multiplied", why: "Treats equal groups as addition.", nudge: "23 shelves with 4 books each: equal groups. Is that 23 + 4?" },
    { answers: ["812"], label: "Wrote partial products side by side", why: "Writes 80 and 12 next to each other instead of adding them.", nudge: "80 and 12 are two parts of the total. Add them together." },
  ],
  mu3: [
    { answers: ["352"], label: "Partial product slip", why: "Multiplies 32 by 10 and adds 32 once instead of twice.", nudge: "Split 12 into 10 and 2. What is 32 × 2?" },
    { answers: ["320", "64"], label: "Used only one partial product", why: "Finds one part of the split and stops.", nudge: "Did you find both 32 × 10 and 32 × 2, then add them?" },
    { answers: ["44"], label: "Added instead of multiplied", why: "Treats multiplication as addition.", nudge: "32 × 12 means 12 groups of 32. Is that 32 + 12?" },
  ],
  di1: [
    { answers: ["20"], label: "Shared only the first chunk", why: "Shares 80 but forgets the 16 that remains.", nudge: "After sharing 80, 16 stickers are left. Share those too." },
    { answers: ["4"], label: "Shared only the remainder", why: "Shares the leftover part and loses the big chunk.", nudge: "Each friend gets a share of 80 and a share of 16." },
    { answers: ["384", "100", "92"], label: "Used the wrong operation", why: "Multiplies, adds, or subtracts instead of sharing equally.", nudge: "Sharing equally means dividing. How many does each of 4 friends get?" },
  ],
  di2: [
    { answers: ["20"], label: "Shared only the first chunk", why: "Shares 120 but forgets the 36 that remains.", nudge: "After sharing 120, 36 seeds are left. Share those too." },
    { answers: ["6"], label: "Shared only the remainder", why: "Shares the leftover part and loses the big chunk.", nudge: "Each bag gets a share of 120 and a share of 36." },
    { answers: ["936", "162", "150"], label: "Used the wrong operation", why: "Multiplies, adds, or subtracts instead of sharing equally.", nudge: "Equal bags means dividing. How many seeds go in each of 6 bags?" },
  ],
  di3: [
    { answers: ["20"], label: "Shared only the first chunk", why: "Uses 7 × 20 but forgets the 28 that remains.", nudge: "140 is shared. What about the 28 left over?" },
    { answers: ["4"], label: "Shared only the remainder", why: "Divides the leftover part and loses the big chunk.", nudge: "Add the share of 140 and the share of 28." },
    { answers: ["161", "175", "1176"], label: "Used the wrong operation", why: "Subtracts, adds, or multiplies instead of dividing.", nudge: "168 ÷ 7 asks how many groups of 7 fit. Which fact helps?" },
  ],
  fr1: [
    { answers: ["1"], label: "Counted the original pieces", why: "Counts the halves instead of the smaller fourths.", nudge: "Keep the shaded amount the same and count the smaller pieces." },
    { answers: ["3"], label: "Added to the top number", why: "Adds the same amount to the top and bottom instead of splitting pieces.", nudge: "Split each half into two equal pieces. How many small pieces are shaded?" },
    { answers: ["4"], label: "Counted the whole", why: "Counts all the fourths instead of the shaded ones.", nudge: "Count only the fourths that cover the planted half." },
  ],
  fr2: [
    { answers: ["5"], label: "Added instead of multiplied", why: "Adds 3 to the top because 3 was added to the bottom.", nudge: "3 became 6 by multiplying by 2. Do the same to the top." },
    { answers: ["2"], label: "Kept the top number", why: "Changes the bottom but not the top, so the amount shrinks.", nudge: "Whatever happens to the bottom happens to the top too." },
    { answers: ["3"], label: "Copied the old bottom number", why: "Moves numbers around instead of scaling both parts.", nudge: "What did you multiply 3 by to get 6? Use it on the 2." },
  ],
  fr3: [
    { answers: ["11"], label: "Added instead of multiplied", why: "Adds 8 to the top because 8 was added to the bottom.", nudge: "4 became 12 by multiplying by 3. Do the same to the top." },
    { answers: ["3"], label: "Kept the top number", why: "Changes the bottom but not the top.", nudge: "Whatever happens to the bottom happens to the top too." },
    { answers: ["6"], label: "Used the wrong factor", why: "Doubles instead of finding the factor from 4 to 12.", nudge: "How many 4s make 12? Use that number on the 3." },
  ],
  me1: [
    { answers: ["30"], label: "Used the wrong conversion fact", why: "Multiplies by 10 instead of 100 centimeters per meter.", nudge: "How many centimeters are in one meter?" },
    { answers: ["3000"], label: "Used the wrong conversion fact", why: "Multiplies by 1,000 instead of 100.", nudge: "How many centimeters are in one meter?" },
    { answers: ["103"], label: "Added instead of multiplied", why: "Adds the units together instead of repeating them.", nudge: "Each meter is 100 cm. You have 3 meters." },
  ],
  me2: [
    { answers: ["200", "20"], label: "Used the wrong conversion fact", why: "Uses 100 or 10 instead of 1,000 grams per kilogram.", nudge: "Kilo means one thousand. How many grams in one kilogram?" },
    { answers: ["1002"], label: "Added instead of multiplied", why: "Adds the units together instead of repeating them.", nudge: "Each kilogram is 1,000 g. You have 2 kilograms." },
  ],
  me3: [
    { answers: ["300"], label: "Used 100 minutes per hour", why: "Treats time like base ten.", nudge: "An hour has 60 minutes, not 100." },
    { answers: ["63", "18"], label: "Used the wrong operation", why: "Adds or drops a zero instead of multiplying by 60.", nudge: "3 hours is 60 + 60 + 60 minutes." },
  ],
  ge1: [
    { answers: ["180"], label: "Confused right and straight angles", why: "Uses a straight line (half-turn) instead of a square corner.", nudge: "A right angle is a square corner, a quarter of a full turn." },
    { answers: ["360"], label: "Used a full turn", why: "Uses the whole turn instead of a quarter of it.", nudge: "Four square corners make a full turn of 360°. One corner is…?" },
    { answers: ["45"], label: "Halved the corner", why: "Thinks of half a square corner.", nudge: "Picture the corner of a page. That is one right angle." },
  ],
  ge2: [
    { answers: ["300"], label: "Used a full turn", why: "Subtracts from 360 instead of a straight line's 180.", nudge: "A straight line is a half-turn: 180°." },
    { answers: ["30"], label: "Used a right angle", why: "Subtracts from 90 instead of 180.", nudge: "The angle sits on a straight line, not a square corner." },
    { answers: ["240"], label: "Added instead of subtracted", why: "Adds the known part to the whole.", nudge: "The two parts add up to 180°. Which part is missing?" },
  ],
  ge3: [
    { answers: ["145"], label: "Used a straight angle", why: "Subtracts from 180 instead of a right angle's 90.", nudge: "The whole angle is a square corner: 90°." },
    { answers: ["125"], label: "Added instead of subtracted", why: "Adds the known part to the whole.", nudge: "The two parts add up to 90°. Which part is missing?" },
    { answers: ["65", "45"], label: "Subtraction slip", why: "Sets up the right subtraction but miscalculates.", nudge: "Check 90 − 35 again. Try counting up from 35 to 90." },
  ],
  ra1: [
    { answers: ["7"], label: "Added instead of multiplied", why: "Adds the same amount to both parts, which changes the ratio.", nudge: "A ratio stays the same when we multiply both parts by the same number." },
    { answers: ["4"], label: "Copied the change", why: "Uses how much the lemon grew instead of scaling the water.", nudge: "2 cups of lemon became 6. What was it multiplied by?" },
  ],
  ra2: [
    { answers: ["8"], label: "Added instead of multiplied", why: "Adds the same amount to both parts, which changes the ratio.", nudge: "A ratio stays the same when we multiply both parts by the same number." },
    { answers: ["9"], label: "Added the numbers", why: "Adds 4 and 5 instead of scaling.", nudge: "1 inch is 5 miles. 4 inches is 4 groups of 5 miles." },
  ],
  ra3: [
    { answers: ["12"], label: "Added instead of multiplied", why: "Adds the same amount to both parts, which changes the ratio.", nudge: "A ratio stays the same when we multiply both parts by the same number." },
    { answers: ["16"], label: "Used the wrong factor", why: "Adds 6 to 10 instead of finding the scale factor.", nudge: "What do you multiply 2 by to get 10? Use it on the 3." },
  ],
};

const normalize = (answer: string) => answer.replace(/[,\s]/g, "").replace(/^\+/, "");

// The known mistake a wrong answer matches, if any.
export function classifyMistake(questionId: string, answer: string): Mistake | undefined {
  const value = normalize(answer);
  return mistakes[questionId]?.find((m) => m.answers.some((a) => normalize(a) === value));
}
