import { Routes, Route, useParams } from 'react-router-dom'
import SearchPage from './SearchPage'
import EntryPage from './EntryPage'

function EntryPageKeyed() {
  const { word } = useParams()
  return <EntryPage key={word} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/entry/:word" element={<EntryPageKeyed />} />
    </Routes>
  )
}
