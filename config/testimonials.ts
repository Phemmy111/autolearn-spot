export interface StudentTestimonialItem {
  id?: string;
  name: string;
  school: string;
  rating: number;
  testimonial: string;
  verified?: boolean;
  image?: string;
  course?: string;
  date?: string;
}

export const studentTestimonials: StudentTestimonialItem[] = [
  {
    id: 'test-1',
    name: 'Jimoh Naheemot Oluwakemi',
    school: 'University of Ibadan',
    course: 'AI Automation with n8n',
    rating: 5,
    testimonial: 'Before this training, I had zero experience with automation. In just 3 weeks, I went from knowing nothing to building an AI agent for customer support. I look forward to building more too.',
    verified: true,
    image: '/students/jimoh-naheemot.jpg',
    date: 'Verified Student • 2 weeks ago',
  },
  {
    id: 'test-2',
    name: 'Ruth Ngozi Nwoke',
    school: 'Imo State University',
    course: 'AI Automation with n8n',
    rating: 5,
    testimonial: 'I love their teaching techniques, especially for an online course. Learning is made easy with AutoLearn Spot.',
    verified: true,
    image: '/students/ruth-nwoke.jpg',
    date: 'Verified Student • 3 weeks ago',
  },
  {
    id: 'test-3',
    name: 'Ajagbe Emmanuel Oluwatimilehin',
    school: 'Ladoke Akintola University of Technology Graduate',
    course: 'AI Automation with n8n',
    rating: 5,
    testimonial: 'Beyond learning AI Automation, the assignments and quizzes trained my reasoning abilities to solve real problems.',
    verified: true,
    image: '/students/ajagbe-emmanuel.jpg',
    date: 'Verified Student • 1 month ago',
  },
  {
    id: 'test-4',
    name: 'Marvellous Olaoluwa',
    school: 'University of Ibadan',
    course: 'AI Automation with n8n',
    rating: 5,
    testimonial: 'AutoLearn Spot provides everything a student needs to confidently build real automated workflows. The hands-on project reviews gave me the confidence to build production systems.',
    verified: true,
    image: '/Partners/Ola.png',
    date: 'Verified Student • 1 month ago',
  }
];

export const allDynamicTestimonials = [
  {
    id: 'test-1',
    student_name: 'Jimoh Naheemot Oluwakemi',
    cohort: 'University of Ibadan',
    course: 'AI Automation with n8n',
    screenshot_url: '/students/jimoh-naheemot.jpg',
    media_url: '/students/jimoh-naheemot.jpg',
    media_type: 'image',
    thumbnail_url: '/students/jimoh-naheemot.jpg',
    profile_image_url: '/students/jimoh-naheemot.jpg',
    social_profile_url: 'https://www.linkedin.com/in/naheemot-oluwakemi-jimoh/',
    caption: 'Before this training, I had zero experience with automation. In just 3 weeks, I went from knowing nothing to building an AI agent for customer support. I look forward to building more too.',
    featured: true,
    enabled: true,
    display_order: 1,
  },
  {
    id: 'test-2',
    student_name: 'Ruth Ngozi Nwoke',
    cohort: 'Imo State University',
    course: 'AI Automation with n8n',
    screenshot_url: '/students/ruth-nwoke.jpg',
    media_url: '/students/ruth-nwoke.jpg',
    media_type: 'image',
    thumbnail_url: '/students/ruth-nwoke.jpg',
    profile_image_url: '/students/ruth-nwoke.jpg',
    social_profile_url: 'https://www.linkedin.com',
    caption: 'I love their teaching techniques, especially for an online course. Learning is made easy with AutoLearn Spot.',
    featured: true,
    enabled: true,
    display_order: 2,
  },
  {
    id: 'test-3',
    student_name: 'Ajagbe Emmanuel Oluwatimilehin',
    cohort: 'LAUTECH Graduate',
    course: 'AI Automation with n8n',
    screenshot_url: '/students/ajagbe-emmanuel.jpg',
    media_url: '/students/ajagbe-emmanuel.jpg',
    media_type: 'image',
    thumbnail_url: '/students/ajagbe-emmanuel.jpg',
    profile_image_url: '/students/ajagbe-emmanuel.jpg',
    social_profile_url: 'https://www.linkedin.com',
    caption: 'Beyond learning AI Automation, the assignments and quizzes trained my reasoning abilities to solve real problems.',
    featured: false,
    enabled: true,
    display_order: 3,
  },
  {
    id: 'test-4',
    student_name: 'Marvellous Olaoluwa',
    cohort: 'University of Ibadan',
    course: 'AI Automation with n8n',
    screenshot_url: '/Partners/Ola.png',
    media_url: '/Partners/Ola.png',
    media_type: 'image',
    thumbnail_url: '/Partners/Ola.png',
    profile_image_url: '/Partners/Ola.png',
    social_profile_url: 'https://www.linkedin.com',
    caption: 'AutoLearn Spot provides everything a student needs to confidently build real automated workflows. The hands-on project reviews gave me the confidence to build production systems.',
    featured: false,
    enabled: true,
    display_order: 4,
  },
  {
    id: 'test-5',
    student_name: 'Student Production Workflow',
    cohort: 'Live Capstone Project',
    course: 'AI Automation with n8n',
    screenshot_url: '/videos/workflow.mp4',
    media_url: '/videos/workflow.mp4',
    media_type: 'video',
    thumbnail_url: '/workflow-real.jpg',
    profile_image_url: '/autolearn-brandmark.png',
    social_profile_url: '',
    caption: 'Watch the live autonomous n8n workflow built by our students connecting Telegram, OpenAI, and Supabase database in real-time.',
    featured: true,
    enabled: true,
    display_order: 5,
  }
];
