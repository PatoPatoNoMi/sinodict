import { Routes, Route } from 'react-router-dom'
import SearchPage from './SearchPage'
import EntryPage from './EntryPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/entry/:word" element={<EntryPage />} />
    </Routes>
  )
}
