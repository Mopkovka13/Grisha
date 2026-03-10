import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import CategoryPage from './pages/CategoryPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/portfolio/:category" element={<CategoryPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
