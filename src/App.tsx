import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { HomePage } from './pages/HomePage'
import { IdeasPage } from './pages/IdeasPage'
import { ProfilePage } from './pages/ProfilePage'
import { WishlistPage } from './pages/WishlistPage'
import { NotesPage } from './pages/NotesPage'
import { ErrorPage } from './pages/ErrorPage'
import { IconOptionsPage } from './pages/IconOptionsPage'

export default function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/customize" element={<Navigate to="/?page=me" replace />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/icon-options" element={<IconOptionsPage />} />
        <Route path="/error/:kind" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage kind="not-found" />} />
      </Routes>
    </AppErrorBoundary>
  )
}

