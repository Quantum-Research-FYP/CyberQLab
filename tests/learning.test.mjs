import test from "node:test";
import assert from "node:assert/strict";
import { sections } from "../app/lib/course-content.mjs";
import { courseStats, courseSummaries, validateLearningEvent, activityDetails } from "../app/lib/learning-utils.mjs";

test("new learners have honest empty course statistics", () => {
  const stats = courseStats();
  assert.equal(stats.completed, 0);
  assert.equal(stats.answered, 0);
  assert.equal(stats.totalQuestions, 60);
  assert.equal(stats.accuracy, null);
});

test("section completion and accuracy reflect actual valid answers", () => {
  const answers = { 0: Object.fromEntries(sections[0].quiz.map((question,i)=>[i,question[2]])), 1: { 0: (sections[1].quiz[0][2]+1)%3, 1: 99 } };
  const stats = courseStats(answers);
  assert.equal(stats.completed, 1);
  assert.equal(stats.progress, 8);
  assert.equal(stats.answered, 6);
  assert.equal(stats.correct, 5);
  assert.equal(stats.accuracy, 83);
  answers[0][0] = (sections[0].quiz[0][2]+1)%3;
  assert.equal(courseStats(answers).correct, 4);
});

test("only existing quiz questions and valid activities can be saved", () => {
  assert.ok(validateLearningEvent({ type: "answer", section: 0, question: 0, choice: 1 }));
  for (const event of [null, { type: "answer", section: -1, question: 0, choice: 0 }, { type: "answer", section: 12, question: 0, choice: 0 }, { type: "answer", section: 0, question: 5, choice: 0 }, { type: "answer", section: 0, question: 0, choice: 3 }, { type: "answer", section: "0", question: 0, choice: 0 }, { type: "activity", activity: { workspace: "lab", algorithm: "injected", stage: "foundation" } }, { type: "activity", activity: { workspace: "course", sectionIndex: 1, resource: "practice" } }]) assert.equal(validateLearningEvent(event), null);
  assert.deepEqual(validateLearningEvent({ type: "activity", activity: { workspace: "lab", algorithm: "RSA", stage: "attack", userId: "someone else" } }), { type: "activity", activity: { workspace: "lab", algorithm: "RSA", stage: "attack" } });
  assert.ok(validateLearningEvent({ type: "activity", activity: { workspace: "course", sectionIndex: 0, resource: "quiz" } }));
  assert.equal(activityDetails(null).workspace, "Not started");
});

test("profile summaries aggregate multiple courses without mixing their answers", () => {
  const catalog = [
    { id: "first", title: "First", sections: [sections[0]] },
    { id: "second", title: "Second", sections: [sections[1], sections[2]] },
  ];
  const answers = {
    first: { 0: Object.fromEntries(sections[0].quiz.map((question, index) => [index, question[2]])) },
    second: { 0: { 0: sections[1].quiz[0][2] } },
  };
  const summary = courseSummaries(answers, catalog);
  assert.equal(summary.courses.length, 2);
  assert.equal(summary.totalSections, 3);
  assert.equal(summary.completed, 1);
  assert.equal(summary.totalQuestions, 15);
  assert.equal(summary.answered, 6);
  assert.equal(summary.correct, 6);
  assert.equal(summary.progress, 33);
});
