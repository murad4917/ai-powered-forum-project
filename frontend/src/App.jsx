/**
 * Route map: public pages live outside `Layout`; forum tools use `Layout` + `ProtectedRoute`.
 * Add new `<Route>` entries here, then wire navigation in `Sidebar.jsx` and
 * `Layout.jsx` (`getTitle` / `getSubtitle`) so the shell stays in sync.
 */
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Auth from "./pages/Auth/Auth";
import Dashboard from "./pages/Dashboard/Dashboard";
import MyQuestions from "./pages/MyQuestions/MyQuestions";
import Landing from "./pages/Landing/Landing";
import PostQuestion from "./pages/PostQuestion/PostQuestion";
import QuestionDetail from "./pages/QuestionDetail/QuestionDetail";
import RagDocuments from "./pages/RagDocuments/RagDocuments";
import Settings from "./pages/Settings/Settings";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes with Layout */}
            <Route element={<Layout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/questions/ask"
                element={
                  <ProtectedRoute>
                    <PostQuestion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-questions"
                element={
                  <ProtectedRoute>
                    <MyQuestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question/:questionHash"
                element={
                  <ProtectedRoute>
                    <QuestionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rag-documents"
                element={
                  <ProtectedRoute>
                    <RagDocuments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
