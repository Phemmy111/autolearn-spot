export interface VideoCourse {
  id: string
  title: string
  description: string
  vdoCipherVideoId?: string // You will get this from the VdoCipher dashboard after uploading
  vimeoVideoId?: string // Used for Vimeo free hosting
  availableAt: string // ISO date string (e.g. '2026-07-13T00:00:00Z' for Monday)
  duration: string
  week: number
  resources?: { label: string; url: string }[] // Optional downloadable assets per session
}

// You can add your videos here as you upload them to VdoCipher
export const videos: VideoCourse[] = [
  {
    id: 'wk1-vid1',
    title: 'Session 1: n8n Theory & Account Setup',
    description: 'Introduction to n8n, how to set up your account, and the core concepts of nodes, triggers, and credentials.',
    vdoCipherVideoId: '3265363f31454fad9974f182387ce2b1', 
    availableAt: '2026-07-13T00:00:00Z', // Monday
    duration: '30 mins',
    week: 1,
  },
  {
    id: 'wk1-vid2',
    title: 'Session 2: Form to Email Automation',
    description: 'Build your first automation: trigger a workflow from a webhook/form and send an email automatically.',
    vdoCipherVideoId: '2cf57e7b9f9943319c6ab4f4453927c3',
    availableAt: '2026-07-15T00:00:00Z', // Wednesday
    duration: '30 mins',
    week: 1,
  },
  {
    id: 'wk1-vid3',
    title: 'Session 3: Google Sheets Integration',
    description: 'Learn how to read from and write to Google Sheets to store your automation data permanently.',
    vdoCipherVideoId: '37aba51d45174e7d81324ae262f67d4b',
    availableAt: '2026-07-17T00:00:00Z', // Friday
    duration: '35 mins',
    week: 1,
  },
  {
    id: 'wk2-vid1',
    title: 'Session 4: Connecting AI to Your Workflows',
    description: 'Learn how to integrate ChatGPT and process incoming data with AI.',
    vimeoVideoId: '1209374969',
    availableAt: '2026-07-20T00:00:00Z', // Monday Week 2
    duration: '45 mins',
    week: 2,
  },
  {
    id: 'wk2-vid2',
    title: 'Session 5: AI Email Auto-Responder',
    description: 'Learn how to automatically read incoming emails, generate a response using AI, and send it back.',
    vimeoVideoId: '1209383076',
    availableAt: '2026-07-22T00:00:00Z', // Wednesday Week 2
    duration: '40 mins',
    week: 2,
  },
  {
    id: 'wk2-vid3',
    title: 'Session 6: AI Content Summarizer',
    description: 'Learn how to scrape website content and use AI to generate concise summaries.',
    vimeoVideoId: '1209384996',
    availableAt: '2026-07-24T00:00:00Z', // Friday Week 2
    duration: '35 mins',
    week: 2,
  },
  // Add more videos for Week 3 and Week 4 here...
]

// Helper function to check if a video is available
export function isVideoAvailable(video: VideoCourse) {
  return new Date() >= new Date(video.availableAt)
}
