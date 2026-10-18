// Owner: Person A. Student-side reply templates for the rule-based responder (D-004).

import type { TemplateBank } from "@/lib/types";

export const studentTemplates: TemplateBank = {
  welcome_back: [
    "Welcome back, {name}! Fractions were tricky last time, so let’s finish ratios together.",
    "Good to see you, {name}! Let’s use what you know about fractions to work on ratios.",
  ],
  hint_1: [
    "{name}, which amount are you finding, and what does the starting pair tell you?",
    "Let’s think it through, {name}: what changes, and how can the ratio stay the same?",
  ],
  hint_2: [
    "In the table, how many times does {targetName} change from {start} to {target}? Use that same factor on {otherName}.",
    "Compare {start} and {target} for {targetName}, {name}. What same multiplier should you use for {otherName}?",
  ],
  hint_3: [
    "The {targetName} amount grows from {start} to {target}, so use {factor} for both parts. What is {otherName} now?",
    "Use {factor} for both quantities: {targetName} goes from {start} to {target}. What does that do to {otherName}?",
  ],
  ask_answer: [
    "I won't skip your thinking, {name}. Start by asking: what number scales both parts of the ratio?",
    "Let's figure it out together, {name}. Which two quantities need to grow by the same factor?",
  ],
  attempt_correct: [
    "Yes, {name}! Your answer checks out. Can you explain how you knew?",
    "That checks out, {name}! Tell me which math idea helped you.",
  ],
  attempt_wrong_add: [
    "I see how you got that, {name}. Adding the same amount changes the ratio. What multiplier would scale both parts?",
    "Close try! A ratio table needs equal scaling, not equal adding. What number takes the first amount to {target}?",
  ],
  attempt_wrong_reverse: [
    "Check the order, {name}: the first quantity stays first and the second stays second. Which value answers the question?",
    "Let's keep the quantities in their original order. Which amount are we solving for?",
  ],
  attempt_wrong_generic: [
    "Not quite yet, {name}. Check the model and your calculation once more.",
    "Good try. Use the math idea from the lesson and check your work once more.",
  ],
  refresher_offer: [
    "That same ratio-table move showed up again. Let's do a quick fraction refresher, then try the ratio again.",
    "I noticed you added across the ratio table again. Let’s check equivalent fractions, then revisit it.",
  ],
  refresher_correct: [
    "Correct! Those fractions name the same amount. Try the next quick check.",
    "You got it. The numerator and denominator changed by the same factor.",
  ],
  refresher_wrong: [
    "Not quite. To keep the fraction equivalent, change the top and bottom by the same factor. Try again.",
    "Let's compare the two fractions again. What same number could multiply both parts?",
  ],
  off_topic: [
    "Great question for your teacher, {name}. Want help with today's ratio mission instead?",
    "I can help with our math mission. For that question, ask Ms. Rivera.",
  ],
  unsafe: [
    "I'm glad you told me. Let's pause the math and get a trusted grown-up to help. You can tell Ms. Rivera now.",
    "Your safety matters more than this problem. Please talk with Ms. Rivera or another trusted adult.",
  ],
  explain_complete: [
    "You explained the key idea: both parts change together to make an equivalent ratio. Nice work, {name}!",
    "That's a clear explanation. You kept the same ratio by changing both values together!",
  ],
  explain_followup: [
    "Good start, {name}. Can you add why both parts must change by the same factor?",
    "Tell me one more thing: how do you know the new ratio is equivalent to the first?",
  ],
};
