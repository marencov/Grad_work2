"use client";

import { useCallback, useState } from "react";

export function useResultReveal() {
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);

  const resetAnalysisReveal = useCallback(() => {
    setIsAnalysisVisible(false);
  }, []);

  // 結果ページだけ、マウスホイールの「もう少し下へ」を受け取って
  // ページ移動ではなく同じグラフ内のAI解析表示へ切り替えます。
  const handleResultWheel = useCallback((event) => {
    if (event.deltaY > 12 && !isAnalysisVisible) {
      event.preventDefault();
      setIsAnalysisVisible(true);
      return;
    }

    if (event.deltaY < -12 && isAnalysisVisible) {
      event.preventDefault();
      setIsAnalysisVisible(false);
    }
  }, [isAnalysisVisible]);

  return {
    isAnalysisVisible,
    setIsAnalysisVisible,
    resetAnalysisReveal,
    handleResultWheel,
  };
}
