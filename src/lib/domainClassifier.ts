export type ContentDomain = 'ai-tech' | 'healthcare' | 'agriculture' | 'finance' | 'climate' | 'education';

export const DOMAINS: { id: ContentDomain; label: string; emoji: string; color: string }[] = [
  { id: 'ai-tech', label: 'AI & Technology', emoji: '🤖', color: 'text-cyan-500' },
  { id: 'healthcare', label: 'Healthcare', emoji: '🏥', color: 'text-pink-500' },
  { id: 'agriculture', label: 'Agriculture', emoji: '🌱', color: 'text-lime-500' },
  { id: 'finance', label: 'Finance', emoji: '💰', color: 'text-yellow-500' },
  { id: 'climate', label: 'Climate', emoji: '🌍', color: 'text-emerald-500' },
  { id: 'education', label: 'Education', emoji: '🎓', color: 'text-indigo-500' },
];

const DOMAIN_KEYWORDS: Record<ContentDomain, string[]> = {
  'ai-tech': [
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'nlp',
    'natural language', 'computer vision', 'reinforcement learning', 'transformer', 'gpt',
    'llm', 'language model', 'ai', 'ml', 'pytorch', 'tensorflow', 'algorithm', 'robotics',
    'automation', 'software', 'programming', 'developer', 'api', 'cloud', 'data science',
    'cybersecurity', 'blockchain', 'web3', 'iot', 'quantum computing', 'chip', 'gpu',
    'diffusion', 'generative', 'chatbot', 'copilot', 'inference', 'fine-tuning', 'rag',
    'vector', 'embedding', 'agent', 'autonomous', 'code', 'devops', 'mlops',
  ],
  healthcare: [
    'health', 'medical', 'clinical', 'patient', 'disease', 'diagnosis', 'treatment',
    'pharmaceutical', 'drug', 'biomedical', 'genomics', 'dna', 'protein', 'hospital',
    'therapy', 'pathology', 'radiology', 'imaging', 'mental health', 'cancer', 'covid',
    'vaccine', 'surgery', 'wearable health', 'telemedicine', 'ehr', 'bioinformatics',
  ],
  agriculture: [
    'agriculture', 'farming', 'crop', 'soil', 'irrigation', 'livestock', 'agritech',
    'precision farming', 'food security', 'harvest', 'pesticide', 'fertilizer', 'drone farming',
    'plant', 'seed', 'yield', 'aquaculture', 'forestry', 'sustainable farming',
  ],
  finance: [
    'finance', 'fintech', 'banking', 'trading', 'stock', 'market', 'investment', 'crypto',
    'defi', 'insurance', 'fraud detection', 'credit', 'portfolio', 'risk management',
    'algorithmic trading', 'payment', 'wallet', 'monetary', 'economic', 'fiscal',
  ],
  climate: [
    'climate', 'environment', 'carbon', 'emission', 'renewable', 'solar', 'wind energy',
    'sustainability', 'pollution', 'biodiversity', 'ecosystem', 'conservation', 'ocean',
    'deforestation', 'green', 'weather', 'natural disaster', 'recycling', 'water',
    'earth science', 'atmospheric', 'greenhouse',
  ],
  education: [
    'education', 'learning', 'teaching', 'student', 'school', 'university', 'curriculum',
    'e-learning', 'edtech', 'mooc', 'tutoring', 'assessment', 'classroom', 'pedagogy',
    'literacy', 'training', 'skill development', 'certification', 'academic',
  ],
};

export function classifyDomain(title: string, summary: string, tags: string[]): ContentDomain {
  const text = `${title} ${summary} ${tags.join(' ')}`.toLowerCase();
  
  const scores: Record<ContentDomain, number> = {
    'ai-tech': 0,
    healthcare: 0,
    agriculture: 0,
    finance: 0,
    climate: 0,
    education: 0,
  };

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        scores[domain as ContentDomain] += kw.split(' ').length; // multi-word keywords score higher
      }
    }
  }

  let maxDomain: ContentDomain = 'ai-tech';
  let maxScore = 0;
  for (const [domain, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxDomain = domain as ContentDomain;
    }
  }

  return maxDomain;
}

export function getDomainInfo(domain: ContentDomain) {
  return DOMAINS.find(d => d.id === domain) || DOMAINS[0];
}
