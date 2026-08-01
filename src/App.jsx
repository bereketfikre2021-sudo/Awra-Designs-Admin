import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UnreadProvider } from './context/UnreadContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectForm from './pages/ProjectForm'
import About from './pages/About'
import Testimonials from './pages/Testimonials'
import TestimonialForm from './pages/TestimonialForm'
import Blog from './pages/Blog'
import BlogForm from './pages/BlogForm'
import Messages from './pages/Messages'
import FAQ from './pages/FAQ'
import Settings from './pages/Settings'
import Categories from './pages/Categories'
import ActivityLog from './pages/ActivityLog'
import Analytics from './pages/Analytics'
import Team from './pages/Team'
import MediaLibrary from './pages/MediaLibrary'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { admin } = useAuth()
  return admin ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <UnreadProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/:id" element={<ProjectForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="team" element={<Team />} />
            <Route path="about" element={<About />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="testimonials/new" element={<TestimonialForm />} />
            <Route path="testimonials/:id" element={<TestimonialForm />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/new" element={<BlogForm />} />
            <Route path="blog/:id" element={<BlogForm />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </UnreadProvider>
    </AuthProvider>
  )
}
