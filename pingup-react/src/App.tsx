import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/RegisterMultiStep'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import FindTutor from './pages/FindTutor'
import TutorProfile from './pages/TutorProfile'
import BookSession from './pages/BookSession'
import Dashboard from './pages/Dashboard'
import TutorDashboard from './pages/TutorDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/find-tutor" element={<FindTutor />} />
      <Route path="/tutor-profile/:tutorId" element={<TutorProfile />} />
      <Route path="/book-session/:tutorId" element={<BookSession />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tutor-dashboard" element={<TutorDashboard />} />
    </Routes>
  )
}

export default App
