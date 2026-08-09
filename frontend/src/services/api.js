const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
  } catch {
    // fetch() throws (not a rejected response) on network failure/CORS block —
    // this is almost always "the backend isn't running" or a wrong VITE_API_URL.
    throw new Error(
      `Can't reach the backend at ${API_BASE_URL}. Make sure the backend is running ` +
      `(cd backend && npm run dev) and that VITE_API_URL points to it.`
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // A non-JSON error response should still be actionable to the candidate.
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  getInterviewQuote: (candidateId) =>
    request("/interview/quote", {
      method: "POST",
      body: JSON.stringify({ candidateId })
    }),

  getSession: (sessionId) =>
    request(`/interview/${sessionId}`, {
      method: "GET"
    }),

  startInterview: (candidateId, domain, difficulty) =>
    request("/interview/start", {
      method: "POST",
      body: JSON.stringify({ candidateId, domain, difficulty })
    }),

  submitAnswer: (sessionId, questionId, answer) =>
    request("/interview/answer", {
      method: "POST",
      body: JSON.stringify({ sessionId, questionId, answer })
    }),

  finishInterview: (sessionId) =>
    request("/interview/feedback", {
      method: "POST",
      body: JSON.stringify({ sessionId })
    }),

  chatEvaluation: (sessionId, candidateId, message, history = []) =>
    request(`/interview/${sessionId}/evaluation/chat`, {
      method: "POST",
      body: JSON.stringify({ candidateId, message, history })
    })
};

