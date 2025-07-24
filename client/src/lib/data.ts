import { ChatThread } from '@/types';

export const uploadedFiles = [
  'project-docs.pdf',
  'api-reference.md',
  'user-guide.docx'
];

export const chatThreads: ChatThread[] = [
  {
    id: '1',
    title: 'Project Documentation Analysis',
    lastMessage: 'Can you explain the authentication flow?',
    timestamp: '2 hours ago',
    messageCount: 12
  },
  {
    id: '2',
    title: 'API Reference Discussion',
    lastMessage: 'What are the rate limits for the API?',
    timestamp: '1 day ago',
    messageCount: 8
  },
  {
    id: '3',
    title: 'Database Schema Questions',
    lastMessage: 'How should I structure the user table?',
    timestamp: '3 days ago',
    messageCount: 15
  },
  {
    id: '4',
    title: 'Deployment Guide Chat',
    lastMessage: 'Steps for production deployment',
    timestamp: '1 week ago',
    messageCount: 6
  }
];
