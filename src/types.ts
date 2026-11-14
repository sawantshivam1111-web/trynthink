export type User = {
  id: string
  email?: string
  guest: boolean
}

export type Challenge = {
  id: string
  title: string
  prompt: string
  difficulty: number
  stars: number
}

export type Dependency = {
  independent: number
  assisted: number
  dependent: number
  date: string
}

export type ThinkingProfile = {
  method: string
  strengths: string[]
  weaknesses: string[]
}

export type Badge = {
  name: string
  icon: string
  desc: string
  unlocked: boolean
}

export type LeaderboardEntry = {
  name: string
  stars: number
  visible: boolean
}

export type Permissions = {
  notifications: boolean
  screenUsage: boolean
  accessibility: boolean
  internet: boolean
  profileVisibility: boolean
}

export type Period = 'Weekly' | 'Monthly' | 'All-time'