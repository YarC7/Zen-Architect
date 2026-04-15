export interface Label {
  id: string;
  name: string;
  color: string; // HSL color string
}

export interface Assignee {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'move' | 'create' | 'update' | 'delete' | 'comment';
  user: string;
  description: string;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  labels: Label[];
  dueDate: string | null; // ISO date string
  startDate: string | null; // ISO date string
  dueTime: string | null; // HH:mm 24h format
  startTime: string | null; // HH:mm 24h format
  assignees: Assignee[];
  checklist: ChecklistItem[];
  completed: boolean;
  comments?: Comment[];
  activities?: Activity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Column {
  id: string;
  title: string;
  color: string; // header accent color
  cardIds: string[];
}

export type BackgroundType = 'color' | 'image' | 'gradient';

export interface BoardBackground {
  type: BackgroundType;
  value: string; // color hex, image URL, or gradient CSS
}

export interface BoardState {
  projectId: string;
  title: string;
  background: BoardBackground;
  columns: Column[];
  cards: Record<string, Card>;
  labels: Label[];
  archivedCards: Record<string, Card>;
  activities: Activity[];
}

export const LABEL_PRESETS: Label[] = [
  { id: 'l1', name: 'Bug', color: '0 84% 60%' },
  { id: 'l2', name: 'Feature', color: '142 71% 45%' },
  { id: 'l3', name: 'Urgent', color: '25 95% 53%' },
  { id: 'l4', name: 'Design', color: '262 83% 58%' },
  { id: 'l5', name: 'Backend', color: '199 89% 48%' },
  { id: 'l6', name: 'Frontend', color: '330 81% 60%' },
];

export const ASSIGNEE_COLORS = [
  '199 89% 48%',
  '142 71% 45%',
  '262 83% 58%',
  '25 95% 53%',
  '330 81% 60%',
  '0 84% 60%',
];

export const DEFAULT_BOARD: BoardState = {
  projectId: '',
  title: 'My Project Board',
  background: { type: 'color', value: '#ffffff' },
  labels: LABEL_PRESETS,
  archivedCards: {},
  activities: [],
  columns: [
    { id: 'col-todo', title: 'To Do', color: '199 89% 48%', cardIds: ['card-1', 'card-2', 'card-3'] },
    { id: 'col-progress', title: 'In Progress', color: '25 95% 53%', cardIds: ['card-4', 'card-5'] },
    { id: 'col-review', title: 'Review', color: '262 83% 58%', cardIds: ['card-6'] },
    { id: 'col-done', title: 'Done', color: '142 71% 45%', cardIds: ['card-7', 'card-8'] },
  ],
  cards: {
    'card-1': {
      id: 'card-1', title: 'Set up project repository',
      description: 'Initialize the repo with proper folder structure and CI/CD pipeline.',
      labels: [{ id: 'l5', name: 'Backend', color: '199 89% 48%' }],
      startDate: '2026-04-12', dueDate: '2026-04-15', dueTime: null, startTime: null, assignees: [{ id: 'a1', name: 'Alice', color: '199 89% 48%' }],
      checklist: [
        { id: 'cl1', text: 'Init repo', checked: true },
        { id: 'cl2', text: 'Add CI/CD pipeline', checked: false },
        { id: 'cl3', text: 'Set up folder structure', checked: true },
      ], completed: false,
    },
    'card-2': { id: 'card-2', title: 'Design landing page mockup', description: 'Create high-fidelity mockups for the landing page.', labels: [{ id: 'l4', name: 'Design', color: '262 83% 58%' }], startDate: null, dueDate: null, dueTime: null, startTime: null, assignees: [{ id: 'a2', name: 'Bob', color: '142 71% 45%' }], checklist: [], completed: false },
    'card-3': { id: 'card-3', title: 'Fix login redirect bug', description: '', labels: [{ id: 'l1', name: 'Bug', color: '0 84% 60%' }, { id: 'l3', name: 'Urgent', color: '25 95% 53%' }], startDate: '2026-04-05', dueDate: '2026-04-08', dueTime: null, startTime: null, assignees: [], checklist: [], completed: false },
    'card-4': { id: 'card-4', title: 'Implement user dashboard', description: 'Build the main dashboard with analytics widgets.', labels: [{ id: 'l2', name: 'Feature', color: '142 71% 45%' }, { id: 'l6', name: 'Frontend', color: '330 81% 60%' }], startDate: '2026-04-17', dueDate: '2026-04-20', dueTime: null, startTime: null, assignees: [{ id: 'a1', name: 'Alice', color: '199 89% 48%' }, { id: 'a3', name: 'Charlie', color: '262 83% 58%' }], checklist: [], completed: false },
    'card-5': { id: 'card-5', title: 'Write API documentation', description: 'Document all REST endpoints with examples.', labels: [{ id: 'l5', name: 'Backend', color: '199 89% 48%' }], startDate: null, dueDate: null, dueTime: null, startTime: null, assignees: [{ id: 'a2', name: 'Bob', color: '142 71% 45%' }], checklist: [], completed: false },
    'card-6': { id: 'card-6', title: 'Review PR #42 — Auth refactor', description: 'Check the authentication refactor for security issues.', labels: [{ id: 'l5', name: 'Backend', color: '199 89% 48%' }], startDate: '2026-04-07', dueDate: '2026-04-10', dueTime: null, startTime: null, assignees: [{ id: 'a3', name: 'Charlie', color: '262 83% 58%' }], checklist: [], completed: false },
    'card-7': { id: 'card-7', title: 'Set up monitoring alerts', description: 'Configure PagerDuty alerts for production.', labels: [{ id: 'l5', name: 'Backend', color: '199 89% 48%' }], startDate: null, dueDate: null, dueTime: null, startTime: null, assignees: [{ id: 'a1', name: 'Alice', color: '199 89% 48%' }], checklist: [], completed: true },
    'card-8': { id: 'card-8', title: 'Update onboarding flow', description: 'Simplified the onboarding to 3 steps.', labels: [{ id: 'l2', name: 'Feature', color: '142 71% 45%' }, { id: 'l4', name: 'Design', color: '262 83% 58%' }], startDate: '2026-04-02', dueDate: '2026-04-05', dueTime: null, startTime: null, assignees: [{ id: 'a2', name: 'Bob', color: '142 71% 45%' }, { id: 'a1', name: 'Alice', color: '199 89% 48%' }], checklist: [], completed: true },
  },
};
