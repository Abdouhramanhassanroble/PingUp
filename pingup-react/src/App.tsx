import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/RegisterMultiStep'
import Profile from './pages/Profile'
import FindTutor from './pages/FindTutor'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/find-tutor" element={<FindTutor />} />
    </Routes>
  )
}

export default App
