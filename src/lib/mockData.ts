export interface ContentItem {
  id: string;
  title: string;
  content_type: 'article' | 'repo' | 'paper' | 'video' | 'tool';
  summary: string;
  key_insights: string[];
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time: string;
  engagement_score: number;
  source: string;
  author: string;
  published_at: string;
  image?: string;
  stars?: number;
  forks?: number;
  language?: string;
}

export const mockContent: ContentItem[] = [
  {
    id: '1',
    title: 'GPT-5 Architecture Deep Dive: Understanding the Next Generation of Language Models',
    content_type: 'article',
    summary: 'An in-depth analysis of the rumored GPT-5 architecture, exploring potential improvements in reasoning, context window expansion, and multimodal capabilities that could revolutionize AI applications.',
    key_insights: [
      'Expected 10x improvement in reasoning benchmarks',
      'Native multimodal processing without adapters',
      'Real-time learning capabilities during inference'
    ],
    tags: ['GPT-5', 'LLM', 'OpenAI', 'Architecture'],
    difficulty_level: 'advanced',
    estimated_read_time: '12 min',
    engagement_score: 94,
    source: 'AI Research Weekly',
    author: 'Dr. Sarah Chen',
    published_at: '2024-01-14',
  },
  {
    id: '2',
    title: 'ollama/ollama',
    content_type: 'repo',
    summary: 'Get up and running with Llama 3, Mistral, and other large language models locally. The easiest way to run LLMs on your own machine with a simple API.',
    key_insights: [
      'One-line installation and setup',
      'Support for 50+ models out of the box',
      'GPU acceleration for fast inference'
    ],
    tags: ['LLM', 'Local AI', 'Inference', 'Go'],
    difficulty_level: 'beginner',
    estimated_read_time: '5 min',
    engagement_score: 98,
    source: 'GitHub',
    author: 'Ollama Team',
    published_at: '2024-01-13',
    stars: 125000,
    forks: 9200,
    language: 'Go'
  },
  {
    id: '3',
    title: 'Attention Is All You Need: Revisited for 2025',
    content_type: 'paper',
    summary: 'A comprehensive reanalysis of the transformer architecture with modern perspectives on attention mechanisms, efficiency improvements, and scaling laws that have emerged since the original publication.',
    key_insights: [
      'Flash Attention reduces memory complexity to O(n)',
      'Mixture of Experts scales better than dense models',
      'Rotary position embeddings outperform learned positions'
    ],
    tags: ['Transformers', 'Attention', 'Research', 'Scaling'],
    difficulty_level: 'advanced',
    estimated_read_time: '25 min',
    engagement_score: 87,
    source: 'arXiv',
    author: 'MIT AI Lab',
    published_at: '2024-01-12',
  },
  {
    id: '4',
    title: 'Building Production RAG Systems: Complete Tutorial',
    content_type: 'video',
    summary: 'Step-by-step guide to building retrieval-augmented generation systems that actually work in production. Covers embedding strategies, vector databases, and reranking techniques.',
    key_insights: [
      'Hybrid search combines BM25 with dense embeddings',
      'Chunk size of 512 tokens optimal for most use cases',
      'Reranking improves precision by 40% on average'
    ],
    tags: ['RAG', 'Tutorial', 'Production', 'Vector DB'],
    difficulty_level: 'intermediate',
    estimated_read_time: '45 min',
    engagement_score: 91,
    source: 'AI Engineering',
    author: 'Tech With Tim',
    published_at: '2024-01-14',
  },
  {
    id: '5',
    title: 'langchain-ai/langchain',
    content_type: 'repo',
    summary: 'Build context-aware reasoning applications. LangChain enables developers to create agents that can reason, use tools, and maintain memory across conversations.',
    key_insights: [
      'LCEL provides composable chain primitives',
      'Native streaming support for real-time apps',
      'Extensive integrations with 100+ providers'
    ],
    tags: ['LangChain', 'Agents', 'Python', 'Framework'],
    difficulty_level: 'intermediate',
    estimated_read_time: '8 min',
    engagement_score: 96,
    source: 'GitHub',
    author: 'LangChain AI',
    published_at: '2024-01-14',
    stars: 89000,
    forks: 14000,
    language: 'Python'
  },
  {
    id: '6',
    title: 'The Future of AI Agents: From Assistants to Autonomous Systems',
    content_type: 'article',
    summary: 'Exploring how AI agents are evolving from simple chatbots to complex autonomous systems capable of planning, executing, and learning from multi-step tasks.',
    key_insights: [
      'Agent architectures now support recursive self-improvement',
      'Tool use enables interaction with external systems',
      'Safety mechanisms critical for autonomous operation'
    ],
    tags: ['AI Agents', 'Autonomy', 'Future', 'Safety'],
    difficulty_level: 'intermediate',
    estimated_read_time: '15 min',
    engagement_score: 89,
    source: 'The Gradient',
    author: 'Alex Thompson',
    published_at: '2024-01-13',
  },
  {
    id: '7',
    title: 'Constitutional AI: Training Harmless AI Assistants',
    content_type: 'paper',
    summary: 'Anthropic\'s approach to training AI systems that are helpful, harmless, and honest using constitutional methods and RLHF without human feedback on harms.',
    key_insights: [
      'Self-critique enables scalable oversight',
      'Constitutional principles guide model behavior',
      'Reduces reliance on human labelers for safety'
    ],
    tags: ['Safety', 'RLHF', 'Anthropic', 'Alignment'],
    difficulty_level: 'advanced',
    estimated_read_time: '30 min',
    engagement_score: 85,
    source: 'arXiv',
    author: 'Anthropic Research',
    published_at: '2024-01-11',
  },
  {
    id: '8',
    title: 'Fine-tuning LLMs on Consumer Hardware: A Practical Guide',
    content_type: 'video',
    summary: 'Learn how to fine-tune large language models using QLoRA and other memory-efficient techniques on consumer GPUs with as little as 8GB VRAM.',
    key_insights: [
      'QLoRA reduces memory by 4x with minimal quality loss',
      '8-bit optimizers enable larger batch sizes',
      'Gradient checkpointing trades compute for memory'
    ],
    tags: ['Fine-tuning', 'QLoRA', 'Tutorial', 'Optimization'],
    difficulty_level: 'intermediate',
    estimated_read_time: '35 min',
    engagement_score: 93,
    source: 'AI Explained',
    author: 'Weights & Biases',
    published_at: '2024-01-14',
  },
];

export interface AnalyticsData {
  articlesRead: number;
  videosWatched: number;
  papersSaved: number;
  reposSaved: number;
  totalReadingTime: string;
  weeklyActivity: { day: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

export const mockAnalytics: AnalyticsData = {
  articlesRead: 47,
  videosWatched: 12,
  papersSaved: 8,
  reposSaved: 23,
  totalReadingTime: '14h 32m',
  weeklyActivity: [
    { day: 'Mon', count: 5 },
    { day: 'Tue', count: 8 },
    { day: 'Wed', count: 3 },
    { day: 'Thu', count: 12 },
    { day: 'Fri', count: 7 },
    { day: 'Sat', count: 2 },
    { day: 'Sun', count: 4 },
  ],
  topTags: [
    { tag: 'LLM', count: 24 },
    { tag: 'RAG', count: 18 },
    { tag: 'Fine-tuning', count: 15 },
    { tag: 'Agents', count: 12 },
    { tag: 'Python', count: 10 },
  ],
};