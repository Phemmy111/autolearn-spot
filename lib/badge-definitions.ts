export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'achievement' | 'engagement' | 'performance' | 'milestone'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const BADGES: Badge[] = [
  {
    id: 'first_assignment',
    name: '🥇 First Assignment Submitted',
    description: 'Submitted your first assignment',
    icon: '🥇',
    category: 'achievement',
    rarity: 'common'
  },
  {
    id: 'lesson_master',
    name: '📚 Lesson Master',
    description: 'Completed all video lessons',
    icon: '📚',
    category: 'achievement',
    rarity: 'rare'
  },
  {
    id: 'fast_learner',
    name: '⚡ Fast Learner',
    description: 'Completed course within 2 weeks',
    icon: '⚡',
    category: 'performance',
    rarity: 'rare'
  },
  {
    id: 'perfect_quiz',
    name: '🎯 Perfect Quiz',
    description: 'Scored 100% on a quiz',
    icon: '🎯',
    category: 'performance',
    rarity: 'epic'
  },
  {
    id: 'streak_7',
    name: '🔥 7-Day Streak',
    description: '7 consecutive days of learning',
    icon: '🔥',
    category: 'engagement',
    rarity: 'rare'
  },
  {
    id: 'course_graduate',
    name: '🏆 Course Graduate',
    description: 'Successfully completed the course',
    icon: '🏆',
    category: 'milestone',
    rarity: 'legendary'
  },
  {
    id: 'quiz_master',
    name: '🧠 Quiz Master',
    description: 'Average quiz score above 80%',
    icon: '🧠',
    category: 'performance',
    rarity: 'epic'
  },
  {
    id: 'assignment_excellence',
    name: '✨ Assignment Excellence',
    description: 'Average assignment score above 90%',
    icon: '✨',
    category: 'performance',
    rarity: 'epic'
  },
  {
    id: 'early_bird',
    name: '🌅 Early Bird',
    description: 'Started learning within 3 days of enrollment',
    icon: '🌅',
    category: 'engagement',
    rarity: 'common'
  },
  {
    id: 'consistent_learner',
    name: '📈 Consistent Learner',
    description: '80%+ on-time assignment submission rate',
    icon: '📈',
    category: 'engagement',
    rarity: 'rare'
  }
]

export interface UserBadge {
  badge_id: string
  user_id: string
  earned_at: string
  badge: Badge
}
