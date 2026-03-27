export const SYSTEMS = [
  'rca', 'casco', 'travel', 'home', 'common', 'health',
  'life', 'accidents', 'breakdown', 'cmr', 'malpraxis', 'pad',
  'casco_econom', 'accidents_taxi', 'accidents_traveler', 'rcp',
] as const

export type BlogSystem = typeof SYSTEMS[number]

export const POST_STATUSES = ['draft', 'pending_review', 'published', 'archived'] as const
export type PostStatus = typeof POST_STATUSES[number]
