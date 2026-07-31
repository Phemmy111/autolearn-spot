'use client'

import { Badge } from '@/components/ui/badge'
import { UserBadge as UserBadgeType, BADGES, Badge as BadgeType } from '@/lib/badge-definitions'

interface BadgeDisplayProps {
  userBadges: UserBadgeType[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function BadgeDisplay({ 
  userBadges, 
  maxDisplay = 5, 
  size = 'md',
  showTooltip = false 
}: BadgeDisplayProps) {
  const displayBadges = userBadges.slice(0, maxDisplay)
  const hiddenCount = userBadges.length - maxDisplay

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1'
      case 'lg': return 'text-lg px-4 py-2'
      default: return 'text-sm px-3 py-1.5'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20 border-gray-500 text-gray-300'
      case 'rare': return 'bg-blue-500/20 border-blue-500 text-blue-300'
      case 'epic': return 'bg-purple-500/20 border-purple-500 text-purple-300'
      case 'legendary': return 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
      default: return 'bg-gray-500/20 border-gray-500 text-gray-300'
    }
  }

  if (userBadges.length === 0) {
    return (
      <div className="text-sm text-[#5d5f63]">
        No badges earned yet. Keep learning!
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayBadges.map(({ badge }) => (
        <Badge 
          key={badge.id}
          className={`${getSizeClasses()} ${getRarityColor(badge.rarity)} border cursor-pointer hover:opacity-80 transition-opacity`}
          title={`${badge.name}: ${badge.description}`}
        >
          <span className="mr-1">{badge.icon}</span>
          <span className="hidden sm:inline">{badge.name}</span>
        </Badge>
      ))}
      
      {hiddenCount > 0 && (
        <Badge className={`${getSizeClasses()} bg-[#1f2229] border-[#3b494b] text-[#b9cacb]`}>
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  )
}

interface BadgeGridProps {
  userBadges: UserBadge[]
  showLocked?: boolean
}

export function BadgeGrid({ userBadges, showLocked = false }: BadgeGridProps) {
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500/20 to-gray-600/20 border-gray-500'
      case 'rare': return 'from-blue-500/20 to-blue-600/20 border-blue-500'
      case 'epic': return 'from-purple-500/20 to-purple-600/20 border-purple-500'
      case 'legendary': return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500'
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500'
    }
  }

  const badgesToShow = showLocked ? BADGES : userBadges.map(ub => ub.badge)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {badgesToShow.map((badge: BadgeType) => {
        const isEarned = earnedBadgeIds.has(badge.id)
        const userBadge = userBadges.find(ub => ub.badge_id === badge.id)

        if (!showLocked && !isEarned) return null

        return (
          <div
            key={badge.id}
            className={`
              relative p-4 rounded-lg border bg-gradient-to-br ${getRarityColor(badge.rarity)}
              ${isEarned ? 'opacity-100' : 'opacity-40 grayscale'}
              transition-all duration-300 hover:scale-105
            `}
            title={`${badge.name}: ${badge.description}`}
          >
            <div className="text-3xl mb-2 text-center">{badge.icon}</div>
            <h3 className="font-semibold text-white text-sm text-center mb-1">{badge.name}</h3>
            <p className="text-xs text-[#b9cacb] text-center">{badge.description}</p>
            
            {isEarned && userBadge && (
              <div className="mt-2 text-xs text-[#5d5f63] text-center">
                Earned {new Date(userBadge.earned_at).toLocaleDateString()}
              </div>
            )}
            
            {!isEarned && (
              <div className="mt-2 text-xs text-[#5d5f63] text-center">
                🔒 Locked
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}