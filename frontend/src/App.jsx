// ============================================================
// FILE: frontend/src/App.jsx
// PURPOSE: Root component with React Router — routes between
//          the landing page and the chat interface.
// ============================================================

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import DocPage from "./pages/DocPage";
import LinkPage from "./pages/LinkPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/doc" element={<DocPage />} />
        <Route path="/link" element={<LinkPage />} />
      </Routes>
    </Router>
  );
}

export default App;
