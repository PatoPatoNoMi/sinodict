import { Routes, Route, useParams } from 'react-router-dom'
import SearchPage from './SearchPage'
import EntryPage from './EntryPage'
import AboutPage from './AboutPage'

function EntryPageKeyed() {
  const { word } = useParams()
  return <EntryPage key={word} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/entry/:word" element={<EntryPageKeyed />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
