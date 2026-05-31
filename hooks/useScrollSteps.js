"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollSteps(stepIds, onStepChange) {
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeStep, setActiveStep] = useState(stepIds[0]);

  const registerSection = (id) => (element) => {
    if (element) {
      sectionRefs.current[id] = element;
    }
  };

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;

    // Scrollama のような役割を、まずはブラウザ標準の IntersectionObserver で再現します。
    // React版では「今どのセクションが見えているか」を state に入れて、
    // ドット表示や結果表示のリセットに使います。
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const nextStep = visibleEntry.target.dataset.step;
        setActiveStep((previousStep) => {
          if (previousStep !== nextStep) {
            onStepChange?.(nextStep, previousStep);
          }
          return nextStep;
        });
      },
      {
        root,
        threshold: [0.45, 0.7],
      },
    );

    stepIds.forEach((id) => {
      const element = sectionRefs.current[id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [onStepChange, stepIds]);

  const scrollToStep = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return {
    activeStep,
    scrollRef,
    registerSection,
    scrollToStep,
  };
}
