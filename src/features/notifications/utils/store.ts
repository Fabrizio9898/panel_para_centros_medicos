import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to your dashboard',
    body: 'Start by reviewing the overview analytics and exploring your data.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actions: [
      {
        id: 'view',
        label: 'View overview',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '2',
    title: 'New product added',
    body: 'A new product "Dashboard Pro" has been added to the catalog.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actions: [
      {
        id: 'view-product',
        label: 'View products',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '3',
    title: 'Profile updated',
    body: 'Your profile details were updated successfully.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actions: [
      {
        id: 'billing',
        label: 'View profile',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '4',
    title: 'User management',
    body: 'Review and manage your team members from the Users page.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actions: [
      {
        id: 'open',
        label: 'View users',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '5',
    title: 'Welcome',
    body: 'Thanks for choosing this dashboard as your starting point.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    actions: [
      {
        id: 'open-chat',
        label: 'Get started',
        type: 'redirect',
        style: 'primary'
      }
    ]
  }
];

export const useNotificationStore = create<NotificationState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set, get) => ({
    notifications: mockNotifications,

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [{ ...notification, status: 'unread' as const }, ...state.notifications]
      })),

    unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
  })
  //   ,
  //   { name: 'notifications' }
  // )
);
