export type ExerciseType = 'machine' | 'dumbbell' | 'free'
export type SessionKind = 'workout' | 'cardio' | 'rest'
export type PostKind = 'workout' | 'pr' | 'streak' | 'note'
export type ReactionKind = 'heart' | 'fire' | 'muscle' | 'clap'
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'
export type ChallengeKind = 'streak' | 'volume' | '1rm' | 'reps'

export interface DropSet {
  w?: number | null
  r?: number | null
  p?: number | null
}

export interface ResolvedSet {
  w: number | null
  r: number | null
  p: number | null
  drop: DropSet | null
  assisted: boolean
}

export interface SetRow {
  id?: string
  position?: number
  w?: number | null
  r?: number | null
  p?: number | null
  weight_kg?: number | null
  reps?: number | null
  plates?: number | null
  is_assisted?: boolean
  drop?: DropSet | null
  drop_of_id?: string | null
  rpe?: number | null
  raw?: string
}

export interface SessionExercise {
  id?: string
  name: string
  exercise_id?: string
  position?: number
  notes?: string
  sets: SetRow[]
}

export interface Session {
  id?: string
  user_id?: string
  date: string
  kind: SessionKind
  name?: string | null
  notes?: string
  source?: 'manual' | 'healthkit'
  healthkit_uuid?: string | null
  exercises?: SessionExercise[]
}

export interface ExerciseMeta {
  type: ExerciseType
  unit: string
  plate?: { n: number; unit: 'lb' | 'kg' }
  support?: boolean
}

export interface Template {
  id?: string
  user_id?: string
  name: string
  is_shared?: boolean
  exercises: string[]
}

export interface Profile {
  id: string
  handle: string
  display_name: string | null
  avatar_url: string | null
  units: 'kg' | 'lb'
  bio: string | null
  share_workouts: boolean
  auto_post_workout: boolean
  auto_post_pr: boolean
  auto_post_streak: boolean
  created_at?: string
}

export interface Friendship {
  id: string
  requester: string
  addressee: string
  status: FriendshipStatus
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  kind: PostKind
  session_id: string | null
  pr_id: string | null
  body: string | null
  photo_url: string | null
  created_at: string
  profile?: Pick<Profile, 'handle' | 'display_name' | 'avatar_url'>
  reactions?: PostReaction[]
  comments?: PostComment[]
}

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  kind: ReactionKind
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  profile?: Pick<Profile, 'handle' | 'display_name'>
}

export interface PR {
  id: string
  user_id: string
  exercise_id: string
  weight_kg: number
  reps: number
  est_1rm: number
  set_id: string | null
  achieved_at: string
  exercise?: { name: string }
}

export interface Streak {
  user_id: string
  current_count: number
  longest_count: number
  last_log_date: string | null
}

export interface Program {
  id: string
  owner_id: string
  name: string
  weeks: number
  days?: ProgramDay[]
}

export interface ProgramDay {
  id: string
  program_id: string
  week: number
  dow: number
  template_id: string | null
  template?: Template
}

export interface Challenge {
  id: string
  owner_id: string
  name: string
  kind: ChallengeKind
  exercise_id: string | null
  target: number
  ends_at: string
  participants?: ChallengeParticipant[]
}

export interface ChallengeParticipant {
  challenge_id: string
  user_id: string
  current_value: number
  joined_at: string
  profile?: Pick<Profile, 'handle' | 'display_name'>
}
