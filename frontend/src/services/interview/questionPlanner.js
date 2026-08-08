export function getCoverage(session) {
  const coveredDays = [...new Set((session.questionsAsked || []).filter((question) => question.type === "primary").map((question) => question.day))];
  return { totalQuestions: (session.questionsAsked || []).filter((question) => question.type === "primary").length, questionsAnswered: (session.answers || []).length, curriculumDaysCovered: coveredDays, uniqueDaysCovered: coveredDays.length };
}
