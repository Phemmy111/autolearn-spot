export const CATEGORIES = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Creative Arts',
  'Health & Fitness'
];

export const SKILLS_BY_CATEGORY: Record<string, { id: string, name: string }[]> = {
  'Technology': [
    { id: 'tech-web-dev', name: 'Web Development' },
    { id: 'tech-data-sci', name: 'Data Science' },
    { id: 'tech-mobile', name: 'Mobile Development' },
    { id: 'tech-cyber', name: 'Cybersecurity' },
    { id: 'tech-cloud', name: 'Cloud Computing' }
  ],
  'Business': [
    { id: 'biz-entrepreneurship', name: 'Entrepreneurship' },
    { id: 'biz-management', name: 'Management' },
    { id: 'biz-finance', name: 'Finance' },
    { id: 'biz-sales', name: 'Sales' }
  ],
  'Design': [
    { id: 'design-ui-ux', name: 'UI/UX Design' },
    { id: 'design-graphic', name: 'Graphic Design' },
    { id: 'design-3d', name: '3D Modeling' },
    { id: 'design-animation', name: 'Animation' }
  ],
  'Marketing': [
    { id: 'mkt-digital', name: 'Digital Marketing' },
    { id: 'mkt-seo', name: 'SEO' },
    { id: 'mkt-social', name: 'Social Media' },
    { id: 'mkt-content', name: 'Content Marketing' }
  ],
  'Personal Development': [
    { id: 'pd-productivity', name: 'Productivity' },
    { id: 'pd-leadership', name: 'Leadership' },
    { id: 'pd-communication', name: 'Communication' }
  ],
  'Creative Arts': [
    { id: 'art-photography', name: 'Photography' },
    { id: 'art-music', name: 'Music Production' },
    { id: 'art-writing', name: 'Creative Writing' }
  ],
  'Health & Fitness': [
    { id: 'health-nutrition', name: 'Nutrition' },
    { id: 'health-fitness', name: 'Fitness Training' },
    { id: 'health-wellness', name: 'Wellness & Mental Health' }
  ]
};

export const ALL_SKILLS = Object.values(SKILLS_BY_CATEGORY).flat();
