"use client";

import { useCallback, useState } from "react";
import { CHOICES } from "@/data/choices";
import { useResultReveal } from "@/hooks/useResultReveal";
import { useScrollSteps } from "@/hooks/useScrollSteps";
import { useSurveyAnswers } from "@/hooks/useSurveyAnswers";
import ChoiceSlide from "@/components/ChoiceSlide";
import ProgressDots from "@/components/ProgressDots";
import QuestionSlide from "@/components/QuestionSlide";
import ReasonSlide from "@/components/ReasonSlide";
import ResultsSlide from "@/components/ResultsSlide";
import SlideSection from "@/components/SlideSection";
import TitleSlide from "@/components/TitleSlide";
import Toast from "@/components/Toast";
import styles from "@/components/SurveyExperience.module.css";

const STEPS = ["title", "question", "choice", "reason", "results"];

export default function SurveyExperience() {
  // state は「画面の今の状態」をReactに覚えてもらう箱です。
  // ユーザーが選択肢を押すと selectedChoice が変わり、画面も自動で更新されます。
  const [selectedChoice, setSelectedChoice] = useState("");
  const [reason, setReason] = useState("");
  const {
    answers,
    ownAnswerId,
    overallAnalysis,
    answerScores,
    status,
    message,
    error,
    isSupabaseReady,
    submitAnswer,
    incrementAnswerScore,
  } = useSurveyAnswers();

  const {
    isAnalysisVisible,
    resetAnalysisReveal,
    handleResultWheel,
  } = useResultReveal();

  const handleStepChange = useCallback(
    (nextStep, previousStep) => {
      if (nextStep === "results" && previousStep !== "results") {
        resetAnalysisReveal();
      }
    },
    [resetAnalysisReveal],
  );

  const {
    activeStep,
    scrollRef,
    registerSection,
    scrollToStep,
  } = useScrollSteps(STEPS, handleStepChange);

  const handleChoiceSelect = (choiceId) => {
    setSelectedChoice(choiceId);
    scrollToStep("reason");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedChoice || !reason.trim()) return;

    const savedAnswer = await submitAnswer({
      choice: selectedChoice,
      reason: reason.trim(),
    });

    if (savedAnswer) {
      setReason("");
      scrollToStep("results");
    }
  };

  return (
    <>
      <main ref={scrollRef} className={styles.snapScroll}>
        <SlideSection
          id="title"
          registerSection={registerSection}
          className={styles.titleSlide}
        >
          <TitleSlide onStart={() => scrollToStep("question")} />
        </SlideSection>

        <SlideSection
          id="question"
          registerSection={registerSection}
          className={styles.questionSlide}
        >
          <QuestionSlide />
        </SlideSection>

        <SlideSection
          id="choice"
          registerSection={registerSection}
          className={styles.choiceSlide}
        >
          <ChoiceSlide
            choices={CHOICES}
            selectedChoice={selectedChoice}
            onSelect={handleChoiceSelect}
          />
        </SlideSection>

        <SlideSection
          id="reason"
          registerSection={registerSection}
          className={styles.reasonSlide}
        >
          <ReasonSlide
            reason={reason}
            selectedChoice={selectedChoice}
            status={status}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            onBack={() => scrollToStep("choice")}
          />
        </SlideSection>

        <SlideSection
          id="results"
          registerSection={registerSection}
          className={styles.resultsSlide}
          isAnalysisVisible={isAnalysisVisible}
          onWheel={handleResultWheel}
        >
          <ResultsSlide
            answers={answers}
            ownAnswerId={ownAnswerId}
            answerScores={answerScores}
            overallAnalysis={overallAnalysis}
            isAnalysisVisible={isAnalysisVisible}
            isSupabaseReady={isSupabaseReady}
            status={status}
            error={error}
            onAnswerLike={incrementAnswerScore}
          />
        </SlideSection>
      </main>

      <ProgressDots steps={STEPS} activeStep={activeStep} onSelect={scrollToStep} />
      <Toast message={message || error} tone={error ? "error" : "success"} />
    </>
  );
}
