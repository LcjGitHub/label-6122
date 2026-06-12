import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ConvertPage from './pages/ConvertPage'
import PracticePage from './pages/PracticePage'
import ChartPage from './pages/ChartPage'
import TapCodePage from './pages/TapCodePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ConvertPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/对照表" element={<ChartPage />} />
          <Route path="/斜杠敲码" element={<TapCodePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
