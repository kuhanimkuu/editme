export type UserRole = 'client' | 'freelancer';

export interface Freelancer {
  id: string;
  name: string;
  avatar: string;
  category: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  bio: string;
  skills: string[];
  portfolio: string[];
  availability: 'available' | 'busy' | 'offline';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'in-progress' | 'review' | 'completed' | 'secured';
  freelancer: {
    id: string;
    name: string;
    avatar: string;
  };
  client: {
    id: string;
    name: string;
    avatar: string;
  };
  deadline: string;
  budget: number;
  progress: number;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'escrow' | 'refund' | 'withdrawal';
  status: 'completed' | 'in-escrow' | 'pending' | 'failed';
  amount: number;
  date: string;
  description: string;
  projectId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
  hasAttachment?: boolean;
}

export interface ChatRoom {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  projectId: string;
  projectTitle: string;
}

export const mockFreelancers: Freelancer[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    category: 'Video Editor',
    rating: 4.9,
    reviews: 127,
    hourlyRate: 85,
    bio: 'Award-winning video editor specializing in cinematic content',
    skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
    portfolio: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop',
    ],
    availability: 'available',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    category: 'Motion Designer',
    rating: 5.0,
    reviews: 89,
    hourlyRate: 95,
    bio: 'Creative motion designer with 8+ years of experience',
    skills: ['Cinema 4D', 'After Effects', 'Blender'],
    portfolio: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop',
    ],
    availability: 'available',
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    category: 'Video Editor',
    rating: 4.8,
    reviews: 203,
    hourlyRate: 75,
    bio: 'Documentary and corporate video specialist',
    skills: ['Final Cut Pro', 'Premiere Pro', 'Color Grading'],
    portfolio: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
    ],
    availability: 'busy',
  },
  {
    id: '4',
    name: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    category: 'Animator',
    rating: 4.9,
    reviews: 156,
    hourlyRate: 90,
    bio: '2D/3D animation expert for commercials and explainer videos',
    skills: ['After Effects', 'Animate', 'Toon Boom'],
    portfolio: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop',
    ],
    availability: 'available',
  },
  {
    id: '5',
    name: 'Olivia Martinez',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    category: 'Video Editor',
    rating: 4.7,
    reviews: 94,
    hourlyRate: 70,
    bio: 'Social media content creator and editor',
    skills: ['Premiere Pro', 'CapCut', 'Mobile Editing'],
    portfolio: [
      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
    ],
    availability: 'available',
  },
  {
    id: '6',
    name: 'Alex Thompson',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    category: 'Colorist',
    rating: 5.0,
    reviews: 78,
    hourlyRate: 100,
    bio: 'Professional colorist for film and commercial work',
    skills: ['DaVinci Resolve', 'Color Grading', 'LUT Creation'],
    portfolio: [
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=400&h=300&fit=crop',
    ],
    availability: 'busy',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'p1',
    title: 'Product Launch Video',
    description: 'Create a 60-second promotional video for new product launch',
    status: 'in-progress',
    freelancer: {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    },
    client: {
      id: 'c1',
      name: 'Tech Corp',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    },
    deadline: '2026-04-05',
    budget: 2500,
    progress: 65,
  },
  {
    id: 'p2',
    title: 'Social Media Campaign',
    description: 'Edit 10 short-form videos for Instagram and TikTok',
    status: 'review',
    freelancer: {
      id: '5',
      name: 'Olivia Martinez',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    },
    client: {
      id: 'c1',
      name: 'Tech Corp',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    },
    deadline: '2026-03-28',
    budget: 1800,
    progress: 100,
  },
  {
    id: 'p3',
    title: 'Corporate Training Video',
    description: 'Professional training video series with motion graphics',
    status: 'secured',
    freelancer: {
      id: '2',
      name: 'Marcus Johnson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
    client: {
      id: 'c1',
      name: 'Tech Corp',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    },
    deadline: '2026-04-15',
    budget: 4200,
    progress: 30,
  },
  {
    id: 'p4',
    title: 'Documentary Color Grading',
    description: 'Color grade 45-minute documentary film',
    status: 'completed',
    freelancer: {
      id: '6',
      name: 'Alex Thompson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    },
    client: {
      id: 'c1',
      name: 'Tech Corp',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    },
    deadline: '2026-03-20',
    budget: 3500,
    progress: 100,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'escrow',
    status: 'in-escrow',
    amount: 2500,
    date: '2026-03-20',
    description: 'Product Launch Video - Funds secured',
    projectId: 'p1',
  },
  {
    id: 't2',
    type: 'payment',
    status: 'completed',
    amount: -3500,
    date: '2026-03-18',
    description: 'Documentary Color Grading - Payment released',
    projectId: 'p4',
  },
  {
    id: 't3',
    type: 'escrow',
    status: 'in-escrow',
    amount: 4200,
    date: '2026-03-15',
    description: 'Corporate Training Video - Funds secured',
    projectId: 'p3',
  },
  {
    id: 't4',
    type: 'payment',
    status: 'completed',
    amount: -1800,
    date: '2026-03-10',
    description: 'Social Media Campaign - Payment released',
    projectId: 'p2',
  },
  {
    id: 't5',
    type: 'payment',
    status: 'completed',
    amount: -2200,
    date: '2026-03-05',
    description: 'Website Promo Video - Payment released',
  },
];

export const mockChatRooms: ChatRoom[] = [
  {
    id: 'chat1',
    participantId: '1',
    participantName: 'Sarah Chen',
    participantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    lastMessage: 'Just sent over the latest revision!',
    lastMessageTime: '10m ago',
    unreadCount: 2,
    projectId: 'p1',
    projectTitle: 'Product Launch Video',
  },
  {
    id: 'chat2',
    participantId: '5',
    participantName: 'Olivia Martinez',
    participantAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    lastMessage: 'All videos are ready for your review',
    lastMessageTime: '2h ago',
    unreadCount: 0,
    projectId: 'p2',
    projectTitle: 'Social Media Campaign',
  },
  {
    id: 'chat3',
    participantId: '2',
    participantName: 'Marcus Johnson',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    lastMessage: 'Starting on the storyboard today',
    lastMessageTime: '1d ago',
    unreadCount: 0,
    projectId: 'p3',
    projectTitle: 'Corporate Training Video',
  },
];

export const mockMessages: Record<string, Message[]> = {
  chat1: [
    {
      id: 'm1',
      senderId: '1',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      content: 'Hi! I\'ve started working on the product launch video. Can you share the brand guidelines?',
      timestamp: '2026-03-22T09:00:00Z',
      isCurrentUser: false,
    },
    {
      id: 'm2',
      senderId: 'current',
      senderName: 'You',
      senderAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
      content: 'Sure! I\'ll upload them right now.',
      timestamp: '2026-03-22T09:15:00Z',
      isCurrentUser: true,
    },
    {
      id: 'm3',
      senderId: 'current',
      senderName: 'You',
      senderAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
      content: 'Here\'s the complete brand kit with logos, colors, and fonts.',
      timestamp: '2026-03-22T09:18:00Z',
      isCurrentUser: true,
      hasAttachment: true,
    },
    {
      id: 'm4',
      senderId: '1',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      content: 'Perfect! I\'ll incorporate these into the edit. Should have a draft ready by tomorrow.',
      timestamp: '2026-03-22T09:30:00Z',
      isCurrentUser: false,
    },
    {
      id: 'm5',
      senderId: '1',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      content: 'Just sent over the latest revision!',
      timestamp: '2026-03-23T14:50:00Z',
      isCurrentUser: false,
    },
  ],
};

export const statsData = {
  client: {
    totalSpent: 12000,
    activeProjects: 3,
    completedProjects: 12,
    avgRating: 4.8,
  },
  freelancer: {
    totalEarned: 45000,
    activeProjects: 5,
    completedProjects: 67,
    avgRating: 4.9,
    profileViews: 1243,
  },
};
