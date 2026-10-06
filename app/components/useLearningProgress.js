"use client";

import { useCallback, useRef, useState } from "react";

export default function useLearningProgress(initialLearning) {
  const [answers, setAnswers] = useState(initialLearning.answers || {});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const queue = useRef([]);
  const active = useRef(null);
  const failed = useRef(false);

  const flush = useCallback(() => {
    if (active.current) return active.current;
    failed.current = false;
    setSaveError("");
    if (!queue.current.length) return Promise.resolve();
    setSaving(true);
    active.current = (async () => {
      try {
        while (queue.current.length) {
          const event = queue.current[0];
          const response = await fetch("/api/learning", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event), keepalive: true });
          if (!response.ok) throw new Error("Save failed");
          queue.current.shift();
        }
      } catch (error) {
        failed.current = true;
        setSaveError("Your latest progress hasn’t been saved. Check your connection and retry before leaving.");
        throw error;
      } finally {
        active.current = null;
        setSaving(false);
      }
    })();
    return active.current;
  }, []);

  const enqueue = useCallback((event) => {
    queue.current.push(event);
    if (!failed.current) flush().catch(() => {});
  }, [flush]);

  const answerQuestion = useCallback((section, question, choice, courseId = null) => {
    setAnswers(previous => courseId
      ? ({ ...previous, [courseId]: { ...(previous[courseId] || {}), [section]: { ...(previous[courseId]?.[section] || {}), [question]: choice } } })
      : ({ ...previous, [section]: { ...(previous[section] || {}), [question]: choice } }));
    enqueue({ type: "answer", ...(courseId ? { courseId } : {}), section, question, choice });
  }, [enqueue]);

  const trackActivity = useCallback(activity => enqueue({ type: "activity", activity }), [enqueue]);
  return { answers, answerQuestion, trackActivity, flush, saving, saveError };
}
