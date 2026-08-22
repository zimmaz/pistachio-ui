import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Overview } from '@/pages/Overview'
import { Model } from '@/pages/Model'
import { Evidence } from '@/pages/Evidence'
import { Findings } from '@/pages/Findings'
import { Agents } from '@/pages/Agents'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/model" element={<Model />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/findings" element={<Findings />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}
