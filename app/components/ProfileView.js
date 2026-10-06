"use client";

import Link from "next/link";
import { ArrowRight, Atom, BookOpen, CalendarBlank, CheckCircle, Clock, Envelope, Lightning, Target, User, ShieldCheck } from "@phosphor-icons/react";
import { activityDetails, courseSummaries } from "../lib/learning-utils.mjs";

const date = (value, time = false) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", ...(time ? { timeStyle: "short" } : {}), timeZone: "Asia/Colombo" }).format(new Date(value)) : "Not available";

export default function ProfileView({ user, learning }) {
  const stats = courseSummaries(learning.answers);
  const activity = activityDetails(learning.currentActivity);
  const initials = user.name.split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase();
  const history = [...learning.history].reverse();

  return <div className="profile-page">
    <div className="profile-page-heading"><div><span className="eyebrow">YOUR LEARNING SPACE</span><h1>My profile</h1><p>Your account, your progress, and your next discovery.</p></div><Link href="/" prefetch={false} className="profile-action">Back to learning <ArrowRight size={16} /></Link></div>
    <section className="profile-identity" aria-labelledby="profile-name">
      <div className={`profile-initials ${user.avatarUrl ? "has-photo" : ""}`} aria-hidden="true">{user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer"/> : initials}</div>
      <div className="profile-identity-copy"><span className="profile-tag"><User size={12} /> CyberQ learner</span><h2 id="profile-name">{user.name}</h2><p><Envelope size={15} />{user.email}</p></div>
      <div className="profile-member"><CalendarBlank size={17} /><div><small>MEMBER SINCE</small><b>{date(user.createdAt)}</b></div></div>
    </section>
    <div className="profile-stats" aria-label="Course statistics">
      {[{ icon: BookOpen, label: "Sections completed", value: `${stats.completed} / ${stats.totalSections}`, detail: `Across ${stats.courses.length} ${stats.courses.length === 1 ? "course" : "courses"}` }, { icon: Target, label: "Questions answered", value: `${stats.answered} / ${stats.totalQuestions}`, detail: `${stats.correct} correct answers` }, { icon: CheckCircle, label: "Quiz accuracy", value: stats.accuracy === null ? "—" : `${stats.accuracy}%`, detail: stats.answered ? "Across all current answers" : "Answer a quiz to see your score" }, { icon: Lightning, label: "Overall progress", value: `${stats.progress}%`, detail: "Based on completed section quizzes" }].map(({icon:Icon,label,value,detail})=><section className="profile-stat" key={label}><span><Icon size={19}/></span><small>{label}</small><strong>{value}</strong><p>{detail}</p></section>)}
    </div>
    <div className="profile-main-grid">
      <div className="profile-main-column">
        <section className="profile-panel profile-current"><div className="profile-panel-heading"><h2>Currently exploring</h2><span className="profile-tag"><Atom size={13}/>{activity.workspace}</span></div><h3>{activity.title}</h3><p>{activity.detail}</p><div className="profile-current-foot"><span><Clock size={14}/>{learning.lastActiveAt ? `Last activity: ${date(learning.lastActiveAt,true)}` : "No learning activity yet"}</span><Link href="/" prefetch={false} className="profile-action">{learning.currentActivity ? "Continue learning" : "Explore the lab"}<ArrowRight size={15}/></Link></div></section>
        <section className="profile-panel"><div className="profile-panel-heading"><h2>My courses</h2><span className="profile-tag">{stats.courses.length} {stats.courses.length === 1 ? "course" : "courses"}</span></div><div className="profile-course-list">{stats.courses.map((course, courseIndex) => {const started = course.answered > 0 || history.some(item => item.workspace === "course" && (item.courseId || stats.courses[0].id) === course.id && item.sectionIndex !== null);const complete = course.sections.length > 0 && course.completed === course.sections.length;return <article className="profile-course" key={course.id}><div className="profile-course-heading"><div className="profile-course-title"><span><Atom size={28} weight="duotone"/></span><div><h3>{course.title}</h3><p>{course.description}</p></div></div><span className={`profile-tag ${complete ? "complete" : ""}`}>{complete ? "Completed" : started ? "In progress" : "Not started"}</span></div><div className="profile-progress-copy"><b>{course.completed} of {course.sections.length} sections complete</b><span>{course.progress}%</span></div><div className="profile-progress" role="progressbar" aria-label={`${course.title} completion`} aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${course.progress}%`}}/></div><details className="profile-course-details" open={stats.courses.length === 1 || started}><summary>Section progress <span>{course.answered}/{course.totalQuestions} questions answered</span></summary><div className="profile-course-sections">{course.sections.map((section,i)=><div key={section.title}><span className={`profile-section-marker ${section.complete ? "complete" : section.answered ? "started" : ""}`}>{section.complete ? <CheckCircle size={16} weight="fill"/> : String(i+1).padStart(2,"0")}</span><div><b>{section.title}</b><small>{section.level} · {section.answered}/{section.total} questions answered</small></div><span className="profile-section-score">{section.answered ? `${section.correct}/${section.total}` : "—"}</span></div>)}</div></details><Link href={course.href} prefetch={false} className="profile-course-link">{started ? "Open course" : "Start learning"}<ArrowRight size={16}/></Link></article>})}</div></section>
      </div>
      <div className="profile-side-column">
        <section className="profile-panel"><div className="profile-panel-heading"><h2>Account details</h2><ShieldCheck size={19}/></div><dl className="profile-details"><div><dt>Full name</dt><dd>{user.name}</dd></div><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Joined</dt><dd>{date(user.createdAt)}</dd></div><div><dt>Learning focus</dt><dd>Quantum security & cryptography</dd></div></dl></section>
        <section className="profile-panel"><div className="profile-panel-heading"><h2>Recent activity</h2><Clock size={18}/></div>{history.length ? <ol className="profile-history">{history.map((item,i)=>{const details=activityDetails(item);return <li key={`${item.at}-${i}`}><span>{item.workspace==="lab"?<Atom size={16}/>:<BookOpen size={16}/>}</span><div><b>{details.title}</b><p>{details.detail}</p><small>{date(item.at,true)}</small></div></li>})}</ol> : <div className="profile-empty"><BookOpen size={28}/><b>Your journey starts here</b><p>Open a lesson or experiment in the lab to build your learning history.</p></div>}</section>
      </div>
    </div>
  </div>;
}
