import { courses, defaultCourse, sections } from "./course-content.mjs";

export const labAlgorithms = ["RSA", "Diffie–Hellman", "ECDH", "DSA", "ECDSA", "EdDSA / Ed25519"];
export const stageLabels = { foundation: "Classical foundation", attack: "Quantum attack", protect: "Post-quantum path" };
export const resourceLabels = { lesson: "Lesson and video", practice: "Algorithm practice", quiz: "Section quiz" };
const index = (value, max) => Number.isInteger(value) && value >= 0 && value < max;

export function validateLearningEvent(event) {
  if (!event || typeof event !== "object") return null;
  if (event.type === "answer") {
    const course = event.courseId ? courses.find(item => item.id === event.courseId) : defaultCourse;
    if (!course || !index(event.section, course.sections.length)) return null;
    const section = course.sections[event.section];
    if (!index(event.question, section.quiz.length) || !index(event.choice, section.quiz[event.question][1].length)) return null;
    return { type: "answer", ...(event.courseId ? { courseId: course.id } : {}), section: event.section, question: event.question, choice: event.choice };
  }
  if (event.type === "activity") {
    const activity = event.activity;
    if (!activity || typeof activity !== "object") return null;
    if (activity.workspace === "lab" && labAlgorithms.includes(activity.algorithm) && Object.hasOwn(stageLabels, activity.stage)) {
      return { type: "activity", activity: { workspace: "lab", algorithm: activity.algorithm, stage: activity.stage } };
    }
    if (activity.workspace === "course") {
      const course = activity.courseId ? courses.find(item => item.id === activity.courseId) : defaultCourse;
      if (!course) return null;
      const courseIdentity = activity.courseId ? { courseId: course.id } : {};
      if (activity.sectionIndex === null) return { type: "activity", activity: { workspace: "course", ...courseIdentity, sectionIndex: null } };
      if (index(activity.sectionIndex, course.sections.length) && Object.hasOwn(resourceLabels, activity.resource)) {
        if (activity.resource === "practice" && !course.sections[activity.sectionIndex].algorithms) return null;
        return { type: "activity", activity: { workspace: "course", ...courseIdentity, sectionIndex: activity.sectionIndex, resource: activity.resource } };
      }
    }
  }
  return null;
}

export function courseStats(answers = {}, course = defaultCourse) {
  const courseSections = course.sections || [];
  const sectionStats = courseSections.map((section, i) => {
    const selected = answers[i] || {};
    const answered = section.quiz.filter((q, j) => index(selected[j], q[1].length)).length;
    const correct = section.quiz.filter((q, j) => selected[j] === q[2]).length;
    return { title: section.title, level: section.level, answered, correct, total: section.quiz.length, complete: answered === section.quiz.length };
  });
  const completed = sectionStats.filter(s => s.complete).length;
  const answered = sectionStats.reduce((sum,s) => sum+s.answered,0);
  const correct = sectionStats.reduce((sum,s) => sum+s.correct,0);
  const totalQuestions = sectionStats.reduce((sum,s) => sum+s.total,0);
  return { sections: sectionStats, completed, answered, correct, totalQuestions, progress: courseSections.length ? Math.round(completed/courseSections.length*100) : 0, accuracy: answered ? Math.round(correct/answered*100) : null };
}

export function courseSummaries(answers = {}, catalog = courses) {
  const summaries = catalog.map((course, courseIndex) => {
    // Existing learners use the original section-indexed shape. New courses can
    // store answers under their stable course id without changing profile code.
    const selected = answers[course.id] || (courseIndex === 0 ? answers : {});
    return { ...course, ...courseStats(selected, course) };
  });
  const completed = summaries.reduce((sum, course) => sum + course.completed, 0);
  const totalSections = summaries.reduce((sum, course) => sum + course.sections.length, 0);
  const answered = summaries.reduce((sum, course) => sum + course.answered, 0);
  const correct = summaries.reduce((sum, course) => sum + course.correct, 0);
  const totalQuestions = summaries.reduce((sum, course) => sum + course.totalQuestions, 0);
  return {
    courses: summaries,
    completed,
    totalSections,
    answered,
    correct,
    totalQuestions,
    progress: totalSections ? Math.round(completed / totalSections * 100) : 0,
    accuracy: answered ? Math.round(correct / answered * 100) : null,
  };
}

export function activityDetails(activity) {
  if (!activity) return { title: "Ready for your first discovery", detail: "Choose a lesson or explore the learning lab.", workspace: "Not started" };
  if (activity.workspace === "lab") return { title: `${activity.algorithm} learning lab`, detail: stageLabels[activity.stage], workspace: "Learning lab" };
  const course = courses.find(item => item.id === activity.courseId) || defaultCourse;
  if (activity.sectionIndex === null) return { title: "Exploring the course library", detail: `${courses.length} ${courses.length === 1 ? "course" : "courses"} available`, workspace: "Foundations" };
  return { title: course.sections[activity.sectionIndex]?.title || course.title, detail: `${course.title} · Section ${activity.sectionIndex+1} · ${resourceLabels[activity.resource]}`, workspace: "Foundations" };
}
