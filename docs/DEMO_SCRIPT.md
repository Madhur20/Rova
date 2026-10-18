# Rova presentation script

Use the simulated accounts with password `rova2026`: `teacher@rova.school`, `student@rova.school`, and `parent@rova.school`.

The coach and lesson summary are scripted. Math grading, assignment progress, transcript capture, and summary counts come from the actual session. Do not describe this version as a live LLM or a proven long-term mastery assessment.

Safety checks are limited deterministic phrase matching. Flagged conversations appear at the top of every teacher section with a direct review action and the learner’s exact flagged words. This is an in-app flag, not an external or emergency notification. Opening a review does not resolve it. Use an isolated rehearsal data directory if testing this path; it intentionally leaves a persistent concern visible.

## Preparation

Use Node 24. For a fresh rehearsal without deleting existing practice, start with a new temporary data directory:

```bash
nvm use 24
ROVA_DATA_DIR="$(mktemp -d /tmp/rova-demo.XXXXXX)" npm run dev
```

Open `http://localhost:3000/login`. Sign out between roles when using one browser: the account cookie is shared across tabs. A fresh data directory also clears completed parent activities for the rehearsal.

## 1. A teacher sees the next step

Log in as the teacher.

Say: “Four numbers a teacher wants every morning: who needs me, and how the class is moving.”

- Point to the top row: **Need you today** (James and others, each with a reason), then **On track**, **Behind schedule**, and **Stagnant**, each against a 70% target by the unit’s end. Each status tile opens the progress report filtered to those learners.
- Click **James** in *Need you today*: his panel says *stagnant in fractions, at 32%, no change over two weeks*, links it to multiplication (skill map), and gives one next step. Hollow chart points are simulated history. Close it.
- Click the **Stagnant** tile: the progress report opens filtered to those learners. The intervention log at the bottom keeps its own filters.
- Return to **Overview**. In the **learning alert** (after the student run) choose **Share a fractions refresher with this group**, or open James’s panel and choose **Assign a fractions lesson**. Keep Maya in the group and share it.

Say: “The lesson lands on each selected student’s dashboard. Completion is tracked individually; assigning the lesson does not mark anyone as done.”

## 2. A student thinks with a coach

Sign out, log in as the student, and open **Start my lesson → Start our conversation** from the teacher assignment. Use the assignment rather than ordinary topic practice so the teacher sees its completion against the group.

Say: “Rova is designed around a conversation that makes the student do the thinking. This presentation uses a scripted coach with the same hint-first behavior.”

| Question | Student action | What to point out |
| --- | --- | --- |
| Garden: one half in fourths | Type `Just tell me the answer` | Rova declines to reveal it and asks a guiding question. |
| Same question | Type `3` | Code checks the answer. Rova calls attention to original pieces versus smaller pieces. |
| Same question | Click **Show me a picture** | Equivalent fraction bars appear in the conversation. The shaded amount stays fixed while pieces change. |
| Same question | Type `2` | The checked answer and explanation are saved; the lesson is still in progress. |
| Second question: `2/3 = ?/6` | Click **Next question**, then type `4` | An independent first-try success is recorded. |
| Third question: `3/4 = ?/12` | Click **Next question**, then type `Do I multiply both parts by 3?` | Rova responds to the scaling idea, without grading a concept question as a numeric answer. |
| Same question | Type `9`, then **Finish lesson** | All three answers are checked; this learner’s assignment becomes complete. |

Each question shows its picture with the question, and Rova’s first message includes a short lesson tip. On fractions, **Show me a picture** adds a second picture to the chat with the bar already split into smaller pieces. Practice uses one tall message thread with the current question pinned above it and the composer fixed below. All saved messages remain in the thread; scroll up to revisit earlier questions without loading or expanding history.

Show **My progress**: “Your growing strengths” sits beside “Your next breakthroughs.” The latter opens targeted practice for the topics that need work.

## 2b. Stuck on ratios: the root-cause loop

Still signed in as the student, scroll to **Stretch challenge · Grade 6 preview** and choose **Try the ratio challenge → Start our conversation**.

Say: “When a student is stuck, the problem often started in an earlier grade. Rova finds that skill with code, not guesswork.”

| Student action | What to point out |
| --- | --- |
| Type `7` | Code checks it. Rova names the misconception: adding the same amount to both parts instead of multiplying. |
| Type `8` | Two checked misses on one question: Rova traces the gap to **equivalent fractions (4.NF.A.1)** and says the refresher is ready on the dashboard. |
| Close the chat; on the dashboard card choose **Start refresher → Start our conversation**, then `2`, **Next question**, `4`, **Next question**, `9`, **Finish lesson** | A three-question fractions refresher; each answer is checked by code. |
| On the dashboard card choose **Back to ratios**, then type `9 cups` | The original ratio question is solved after the refresher. |

## 2c. Shapes & angles: a conversation to show the coach at its best

Log in as the student, open **Shapes & angles** from the topic grid, and choose **Start our conversation**. The picture beside each question is interactive: a ray the student turns with a slider, and for the second and third questions the known part is already drawn so the two parts visibly fill the whole angle.

Say: “Rova explains in a child’s words, draws the idea, and still never hands over the answer.”

Type the student lines exactly; the coach replies are what the app says today.

| Who | Says |
| --- | --- |
| Rova | Let’s work through this shapes & angles question together. A square corner is a quarter-turn. Four equal square corners fit into a full turn of 360°. Share a first idea, try an answer, or ask for a picture. |
| **Student** | What even is an angle? |
| Rova | An angle is a turn, like a door swinging open. The corner of a page is a quarter of a full spin, and a full spin is 360°. A square corner is a quarter of a full spin. |
| **Student** | Show me a picture |
| Rova | Here’s the picture again. A full spin is 360°. Four square corners fill it. What would you try? |
| **Student** | 45 |
| Rova | Picture the corner of a page. That is one right angle. Divide 360 by 4. Try again when you’re ready. |
| **Student** | 90 |
| Rova | Yes — your answer checks out. Every right angle measures 90 degrees. What did you do differently, or what helped it click? |
| Rova | Let’s work through this shapes & angles question together. The parts add up to the whole angle. A straight angle is 180°, so subtract the known part from the whole. Share a first idea, try an answer, or ask for a picture. |
| **Student** | Is it 60? |
| Rova | That doesn’t match yet. Let’s look at one step together. A straight line is a half-turn: 180°. Try again when you’re ready. |
| **Student** | I'm stuck |
| Rova | Let’s make it smaller. The slice and the rest must add up to 180. What would you try? |
| **Student** | 120 |
| Rova | Yes — your answer checks out. Adjacent angles on a straight line sum to 180 degrees. What did you do differently, or what helped it click? |
| Rova | Let’s work through this shapes & angles question together. The parts add up to the whole angle. A square corner is 90°, so subtract the known part from the whole. Share a first idea, try an answer, or ask for a picture. |
| **Student** | How do I do this one? |
| Rova | The door opens inside a square corner, 90°. Opening 35° uses part of it. What is left of the 90° is the missing part. The open part and the rest add up to the whole square corner. |
| **Student** | 55 |
| Rova | Yes — your answer checks out. You can add and subtract angle measures just like lengths. What did you do differently, or what helped it click? |

Point out: the explanation is three short sentences with a picture; a wrong guess gets one specific nudge, not a lecture; and every checked answer is graded by code.

## 3. A teacher sees what happened, quickly

Sign out and log in as the teacher.

- On **Overview**, the **learning alert** for Maya shows the evidence (her answers 7 and 8), the root cause (equivalent fractions, 4.NF.A.1), a 5-minute reteach, the family update, and “Solved after refresher”. Click **Mark reteach planned**, then **Share a fractions refresher with this group**: the classmates with the same low signal are preselected (their signal includes simulated profiles). Say the 7-day re-check is planned, not built.
- Select **Question bank**: add a course handbook under Course materials (attach the PDF if you have one), then under Fractions accept a suggested question (it now reads “Written from” that handbook) or write one. Open any learner card → **Assign a fractions lesson**: the dialog lists the exact questions the lesson will send, with a count (default 3), Shuffle, or **Choose myself**. Say: “Teachers stay in charge of what gets asked; Rova only checks the answers.”
- Select **Progress report**: tiles count lessons, code-checked questions, root causes found, teacher actions, and family updates. Show **Export intervention log (CSV)** and **Print report**. Say: “This is the paperwork MTSS already requires, produced as a by-product.”
- Select **Learning insights**. On a fresh run using the script above, the fractions graph shows **one independent success, two successes after support/retry, and one corrected question**. Seeded starting history is excluded.
- Select **My classroom** and open **Maya**. Her panel shows the group lesson with her completion and a **Review lesson** button; classmates who have not started remain not started.
- Click **Review lesson**. A dedicated modal opens above the classroom.
- Read the **Lesson summary** tab: the learning challenge, how Rova responded, learner quotes, and a suggested teacher next step are all shown.
- Switch to the **Conversation** tab to show the actual exchange. Student messages have white text on dark green and use the student’s name. Close the modal to return to the same classroom position.

Say: “The teacher can scan the summary, then inspect the evidence. Completing this lesson is a useful signal; a fresh independent problem checks whether the learning transfers.”

Optional: **My classroom → Maya’s learning story → Share family update**. Suggested text:

> Maya worked through equivalent fractions today. The picture helped her revisit how halves can be split into fourths. Ask her to show you the same amount using two pieces of paper.

## 4. A family has a clear, finite next action

Sign out and log in as the parent.

- **This week** opens with one sentence on how Maya is doing, each topic in plain words, why, what school is doing (the small group and the refresher), and wins from her live practice. Under **Messages**, two automatic updates from Rova appear after the ratios run: the at-home activity when the gap was found, and the win message. They are saved in Rova only; SMS delivery is planned.
- In **Tonight’s 10 minutes**, complete all three paper-folding checkpoints.
- Optional: **Progress** shows each topic’s confidence against the class goal.
- Show the completion celebration, the new activity, and the collapsed completed-activities history. If all six activities are completed, the page says “You’re all caught up” instead of recycling work.

Say: “Families get something specific they can do—and see that their effort counted.”

## Recovery during a rehearsal

- Closing a lesson preserves its conversation. Reopen the assignment to continue or review it.
- The current question stays pinned beside the chat on wide screens and above it on phones. Its picture stays with the question, and its lesson tip is in Rova’s opening message. **Show me a picture** adds a picture to the chat only when there is a different one (fractions); otherwise Rova points to the picture with the question.
- Sidebar destinations survive refresh and work with browser back/forward through their URL fragments.
- A new data directory starts a fresh presentation; it does not remove previous work.
