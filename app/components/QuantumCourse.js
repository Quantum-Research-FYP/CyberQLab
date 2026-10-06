"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Atom, BookOpen, Brain, CaretLeft, CaretRight, CheckCircle, Circuitry, Function, Key, Lightning, LockKey, Medal, Play, ShieldCheck, Sparkle, Target, Warning, XCircle } from "@phosphor-icons/react";

import { sections, videos } from "../lib/course-content.mjs";
const sectionIcons = { Key, Function, Atom, Warning, LockKey, Circuitry, ShieldCheck, Brain, Lightning, Sparkle, Target, BookOpen };

function QuizRunner({ section, sectionIndex, answers, answer, openItem }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const savedChoice = answers[questionIndex];
  const [selection, setSelection] = useState(savedChoice ?? null);
  const [revealed, setRevealed] = useState(savedChoice !== undefined);
  const [question, choices, right, explanation] = section.quiz[questionIndex];
  const done = Object.keys(answers).length === section.quiz.length;
  const score = section.quiz.reduce((total, item, index) => total + (answers[index] === item[2] ? 1 : 0), 0);
  const correct = selection === right;

  useEffect(() => {
    setQuestionIndex(0);
  }, [sectionIndex]);

  useEffect(() => {
    const chosen = answers[questionIndex];
    setSelection(chosen ?? null);
    setRevealed(chosen !== undefined);
  }, [answers, questionIndex]);

  const selectQuestion = nextIndex => {
    setQuestionIndex(nextIndex);
    const chosen = answers[nextIndex];
    setSelection(chosen ?? null);
    setRevealed(chosen !== undefined);
  };

  const checkAnswer = () => {
    if (selection === null) return;
    answer(sectionIndex, questionIndex, selection);
    setRevealed(true);
  };

  return <section className="section-mcq resource-quiz quiz-runner">
    <div className="quiz-runner-topline">
      <span>SECTION {sectionIndex + 1} QUIZ</span>
      <strong>{done ? `${score}/${section.quiz.length} marks` : `${questionIndex + 1} of ${section.quiz.length}`}</strong>
    </div>
    <div className="quiz-runner-progress" role="progressbar" aria-label="Quiz progress" aria-valuenow={questionIndex + 1} aria-valuemin={1} aria-valuemax={section.quiz.length}>
      {section.quiz.map((item, index) => <i className={`${index === questionIndex ? "current" : ""} ${answers[index] !== undefined ? "answered" : ""}`} key={item[0]}/>) }
    </div>
    <article className={`quiz-question-card ${revealed ? (correct ? "correct" : "incorrect") : ""}`}>
      <h2>{question}</h2>
      <div className="quiz-answer-list" role="radiogroup" aria-label={`Question ${questionIndex + 1} answers`}>
        {choices.map((choice, choiceIndex) => {
          const selected = selection === choiceIndex;
          const isAnswer = revealed && choiceIndex === right;
          const isWrong = revealed && selected && !correct;
          return <button type="button" role="radio" aria-checked={selected} className={`${selected ? "selected" : ""} ${isAnswer ? "answer" : ""} ${isWrong ? "wrong" : ""}`} onClick={() => { setSelection(choiceIndex); setRevealed(false); }} key={choice}>
            <span className="quiz-radio" aria-hidden="true"><i/></span>
            <b>{choice}</b>
            {isAnswer && <CheckCircle size={20} weight="fill"/>}
            {isWrong && <XCircle size={20} weight="fill"/>}
          </button>;
        })}
      </div>
      {revealed && <div className="quiz-result" role="status"><b>{correct ? "Correct" : "Not quite"}</b><p>{explanation}</p></div>}
      <div className="quiz-runner-actions">
        <button className="quiz-back" type="button" disabled={questionIndex === 0} onClick={() => selectQuestion(questionIndex - 1)} aria-label="Previous question"><CaretLeft size={21} weight="bold"/></button>
        <button className="quiz-check" type="button" disabled={selection === null || revealed} onClick={checkAnswer}><CheckCircle size={19} weight="fill"/> {revealed ? "Checked" : "Check"}</button>
        {questionIndex < section.quiz.length - 1
          ? <button className="quiz-next" type="button" disabled={!revealed} onClick={() => selectQuestion(questionIndex + 1)} aria-label="Next question"><CaretRight size={24} weight="bold"/></button>
          : <button className="quiz-next" type="button" disabled={!done} onClick={() => sectionIndex < 11 && openItem(sectionIndex + 1, "lesson")} aria-label={sectionIndex < 11 ? "Next section" : "Quiz complete"}><CaretRight size={24} weight="bold"/></button>}
      </div>
    </article>
    {done && <div className="section-complete"><Medal size={28} weight="duotone"/><div><b>Section complete · {score}/{section.quiz.length}</b><span>{score === section.quiz.length ? "Excellent—every answer is correct." : "You can revisit any question and improve your answers."}</span></div>{sectionIndex < 11 && <button onClick={() => openItem(sectionIndex + 1, "lesson")}>Next section <CaretRight size={15}/></button>}</div>}
  </section>;
}

export default function QuantumCourse({answers,onAnswer,onOpenAlgorithm,activeItem,setActiveItem}){
  const [courseQuery,setCourseQuery]=useState("");
  const answer=onAnswer;
  const openItem=(sectionIndex,type)=>{setActiveItem({sectionIndex,type});window.scrollTo({top:0,behavior:"smooth"})};

  if(!activeItem){
    return <div className="course-shell course-library">
      <section className="library-hero"><span className="eyebrow">CYBERQ LAB LEARNING</span><h1>Find all courses</h1><p>Build practical skills in quantum computing, cybersecurity, and quantum-safe system design.</p></section>
      <div className="library-toolbar"><div><b>Available courses</b><span>1 course</span></div><label><span>Search courses</span><input type="search" value={courseQuery} onChange={event=>setCourseQuery(event.target.value)} placeholder="Search by topic" aria-label="Search courses"/></label></div>
      <div className="course-library-grid">{"quantum cryptography qkd bb84 post-quantum cybersecurity".includes(courseQuery.trim().toLowerCase())?<article className="course-card"><div className="course-card-cover"><span><Atom size={34} weight="duotone"/></span><small>FOUNDATIONS</small><strong>Quantum<br/>Cryptography</strong><i>CyberQ Lab</i></div><div className="course-card-copy"><div className="course-card-tags"><span>Quantum security</span><span>Beginner → intermediate</span></div><h2>Quantum Cryptography</h2><p>Learn QKD, BB84, implementation security, quantum threats, post-quantum cryptography, and hybrid system design.</p><div className="course-card-meta"><span><BookOpen size={16}/>12 sections</span><span><Target size={16}/>60 quiz questions</span></div><button onClick={()=>openItem(0,"lesson")}>View course <CaretRight size={17}/></button></div></article>:<div className="course-library-empty"><BookOpen size={28}/><b>No courses found</b><span>Try a different topic or keyword.</span></div>}</div>
    </div>;
  }

  if(activeItem){
    const {sectionIndex,type}=activeItem, section=sections[sectionIndex], Icon=sectionIcons[section.icon] || BookOpen, a=answers[sectionIndex]||{}, video=videos[section.video];
    const labels={lesson:"Lesson and video",practice:"Algorithm practice",quiz:"Section quiz"};
    return <div className="course-reader-shell">
      <aside className="course-reader-nav">
        <button className="reader-back" onClick={()=>setActiveItem(null)}><ArrowLeft size={19}/> <span>All courses</span></button>
        <div className="reader-course-name"><small>CYBERQ LAB COURSE</small><h2>Quantum Cryptography</h2><p>Basic to intermediate</p></div>
        <div className="reader-nav-divider"/><b className="reader-nav-label">Lessons</b>
        <nav>{sections.map((navSection,navIndex)=>{const current=navIndex===sectionIndex;return <div className={`reader-nav-section ${current?"current":""}`} key={navSection.title}><button onClick={()=>openItem(navIndex,"lesson")}><span>{String(navIndex+1).padStart(2,"0")}</span>{navSection.title}<CaretRight size={14}/></button>{current&&<div className="reader-subnav"><button className={type==="lesson"?"active":""} onClick={()=>openItem(navIndex,"lesson")}>Lesson and video</button>{navSection.algorithms&&<button className={type==="practice"?"active":""} onClick={()=>openItem(navIndex,"practice")}>Algorithm practice</button>}<button className={type==="quiz"?"active":""} onClick={()=>openItem(navIndex,"quiz")}>Section quiz</button></div>}</div>})}</nav>
      </aside>
      <main className="course-resource-page">
      <div className="resource-topbar"><span>{section.level}</span><span>Section {sectionIndex+1} of 12</span></div>
      <section className="reader-hero"><span className="lesson-icon"><Icon size={27} weight="duotone"/></span><div><small>{section.level} · {labels[type]}</small><h1>{section.title}</h1><p>{section.objectives[0]}</p></div></section>
      {type==="lesson"&&<main className="resource-content"><section className="reader-objectives"><Target size={19}/><div><b>Learning objectives</b><ul>{section.objectives.map(x=><li key={x}>{x}</li>)}</ul></div></section><div className="reader-content">{section.content.map(([title,copy],contentIndex)=><article key={title}><span>{String(contentIndex+1).padStart(2,"0")}</span><div><h2>{title}</h2><p>{copy}</p></div></article>)}</div><section className="reader-key-idea"><Sparkle size={21} weight="fill"/><div><b>Key idea</b><p>{section.keyIdea}</p></div></section><section className="lesson-activity"><Circuitry size={24} weight="duotone"/><div><small>PRACTICAL ACTIVITY</small><h2>Apply what you learned</h2><p>{section.lab}</p></div></section><section className="course-video resource-video"><div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${video[0]}?rel=0`} title={video[1]} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div><div><span><Play size={16} weight="fill"/> RECOMMENDED VIDEO</span><h3>{video[1]}</h3><p>{video[2]} · YouTube privacy-enhanced embed.</p><a href={`https://www.youtube.com/watch?v=${video[0]}`} target="_blank" rel="noreferrer">Open on YouTube ↗</a></div></section></main>}
      {type==="practice"&&<section className="resource-practice"><Function size={28} weight="duotone"/><div><small>INTERACTIVE PRACTICE</small><h2>{section.algorithms?"Choose an algorithm whiteboard":"Review this section in the cryptography lab"}</h2><p>Use an animated playground to connect the lesson with each calculation and security step.</p>{section.algorithms&&<div>{section.algorithms.map(name=><button onClick={()=>onOpenAlgorithm(name)} key={name}>{name}<CaretRight size={15}/></button>)}</div>}</div></section>}
      {type==="quiz"&&<QuizRunner key={sectionIndex} section={section} sectionIndex={sectionIndex} answers={a} answer={answer} openItem={openItem}/>}
      </main>
    </div>;
  }

}
