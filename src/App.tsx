import HogwartsWorld from './hogwarts/Hogwarts'
import OnboardingGate from './components/OnboardingGate'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './screens/Auth'
import ForgotPassword from './screens/ForgotPassword'
import Permissions from './screens/Permissions'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Break from './screens/Break'
import ChallengeList from './screens/ChallengeList'
import ChallengeSolve from './screens/ChallengeSolve'
import Community from './screens/Community'
import Progress from './screens/Progress'
import Profile from './screens/Profile'
import Tutor from './screens/Tutor'
import Achievements from './screens/Achievements'
import Leaderboard from './screens/Leaderboard'
import StudyEntry from './screens/StudyEntry'
import StudyOwn from './screens/StudyOwn'
import Timer from './screens/Timer'
import GodMode from './screens/GodMode'
import Test from './screens/Test'
import Layout from './components/layout'

export default function App() {
  return (
    <BrowserRouter>
      <HogwartsWorld>
      <OnboardingGate />
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />

        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/break" element={<Break />} />
          <Route path="/challenges" element={<ChallengeList />} />
          <Route path="/challenge/:id" element={<ChallengeSolve />} />
          <Route path="/community" element={<Community />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tutor" element={<Tutor />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/study" element={<StudyEntry />} />
          <Route path="/study/own" element={<StudyOwn />} />
          <Route path="/study/god" element={<GodMode />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/test" element={<Test />} />
        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </HogwartsWorld>
    </BrowserRouter>
  )
}
