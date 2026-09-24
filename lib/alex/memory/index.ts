/**
 * ALEX Phase 4 - Memory Module
 * Phase 8: Advanced Memory & Learning
 *
 * Exports memory service and utilities
 */

export { MemoryService, memoryService } from './memory-service'
export { detectMemoryCommand, classifyMemoryFromContent, containsSensitivePattern } from './memory-commands'
export { AdvancedMemoryLearning } from './advanced-memory-learning'
export type {
  MemoryPattern,
  MemoryConsolidation,
  LearningInsight
} from './advanced-memory-learning'
