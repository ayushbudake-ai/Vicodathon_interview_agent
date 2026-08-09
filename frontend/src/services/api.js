const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
  } catch {
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
      // Non-JSON error
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

  startInterview: (params) => {
    const payload = typeof params === "object" ? params : { candidateId: params };
    return request("/interview/start", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  submitAnswer: (sessionId, questionId, answer) =>
    request("/interview/answer", {
      method: "POST",
      body: JSON.stringify({ sessionId, questionId, answer })
    }),

  finishInterview: (sessionId) =>
    request("/interview/feedback", {
      method: "POST",
      body: JSON.stringify({ sessionId })
    })
};
