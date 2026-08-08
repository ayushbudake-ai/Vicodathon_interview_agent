import { createContext, useContext, useMemo } from "react";
import { candidates } from "../data";
import { useInterviewSession } from "../hooks/useInterviewSession";

const InterviewContext = createContext(null);

function getCandidate() {
  const id = localStorage.getItem("selectedCandidateId");
  return candidates.find((candidate) => candidate.id === id) || candidates[0];
}

export function InterviewProvider({ children }) {
  const candidate = getCandidate();
  const interview = useInterviewSession(candidate);

  const value = useMemo(() => interview, [
    interview.candidate,
    interview.messages,
    interview.questionNumber,
    interview.totalQuestions,
    interview.topics,
    interview.isLoading,
    interview.results,
    interview.feedbackStatus,
    interview.answered,
    interview.followUpShown,
    interview.sessionState,
    interview.submitAnswer,
  ]);

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) throw new Error("useInterview must be used inside InterviewProvider");
  return context;
}
