"use client";
import { useState } from "react";
import type { Workspace } from "@/lib/product/model";
import { LessonReview } from "./LessonReview";

export function SafetyConcerns({ workspace }: { workspace: Workspace }) {
  const [reviewId, setReviewId] = useState<string | null>(null);
  const flagged = (workspace.sessions ?? []).filter(s => s.messages.some(m => m.kind === "safety"));
  const review = flagged.find(s => s.id === reviewId);
  if (!flagged.length) return null;
  return <>
    <section className="safety-review" role="alert" aria-label="Safety concerns">
      <h2>Safety concern · Personal check-in needed</h2>
      <p>A learner shared a possible safety concern. Review their words and follow your school’s safeguarding process before more math practice.</p>
      <p className="safety-disclosure">Saved in Rova only. No email, text, or emergency notification is sent. Concerns remain visible; opening a review does not resolve them.</p>
      {[...flagged].reverse().map(session => <button className="btn btn-outline" key={session.id} onClick={() => setReviewId(session.id)}>Review safety concern · {workspace.students.find(s => s.id === session.studentId)?.name ?? "Student"}</button>)}
    </section>
    {review && <LessonReview key={review.id} session={review} workspace={workspace} onClose={() => setReviewId(null)} initialTab="conversation"/>}
  </>;
}
