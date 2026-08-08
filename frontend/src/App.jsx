import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Landing from "./pages/Landing";
import Candidates from "./pages/Candidates";
import CandidateDetails from "./pages/CandidateDetails";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewQuote from "./pages/InterviewQuote";
import Interview from "./pages/Interview";
import Complete from "./pages/Complete";
import Results from "./pages/Results";
import { InterviewProvider } from "./context/InterviewContext";

function InterviewFlow() {
  return (
    <InterviewProvider>
      <Outlet />
    </InterviewProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/candidates" element={<Candidates />} />
      <Route path="/candidate/:candidateId" element={<CandidateDetails />} />
      <Route path="/interview/:candidateId" element={<InterviewSetup />} />
      <Route path="/quote" element={<InterviewQuote />} />

      <Route element={<InterviewFlow />}>
        <Route path="/interview" element={<Interview />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/results" element={<Results />} />
      </Route>

      <Route path="/feedback/:candidateId" element={<Results />} />
      <Route path="/curriculum" element={<InterviewSetup />} />
      <Route path="/documentation" element={<Landing />} />
      <Route path="/about" element={<Landing />} />
      <Route path="/profile" element={<Candidates />} />
      <Route path="/settings" element={<Candidates />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
