import {
  UI_NUMERIC_CONSTANTS,
  TIME_CONSTANTS,
  TICKET_STATUSES,
  ORDER_STATUSES,
  type TicketStatus,
} from '@repo/constants';
import { userManager, orderManager } from '@repo/exchange-core';
import {
  searchKnowledgeSchema,
  createTicketAdminSchema,
  getTicketsSchema,
  updateTicketStatusSchema,
  getByIdSchema,
  createSupportError,
  createNotFoundError,
} from '@repo/utils';

import { createTRPCRouter } from '../init';
import { supportOnly } from '../middleware/auth';

// Мок база знаний
const KNOWLEDGE_BASE = [
  {
    id: '1',
    category: 'Обмен валют',
    title: 'Как работает процесс обмена?',
    content: 'Пользователь создает заявку, указывает сумму и реквизиты...',
    tags: ['обмен', 'процесс', 'FAQ'],
    updatedAt: new Date(),
  },
  {
    id: '2',
    category: 'Техподдержка',
    title: 'Проблемы с подтверждением email',
    content: 'Если письмо не приходит, проверьте папку спам...',
    tags: ['email', 'подтверждение', 'проблемы'],
    updatedAt: new Date(),
  },
  {
    id: '3',
    category: 'Безопасность',
    title: 'Защита аккаунта',
    content: 'Используйте надежные пароли и двухфакторную аутентификацию...',
    tags: ['безопасность', 'пароль', '2FA'],
    updatedAt: new Date(),
  },
];

// Мок система тикетов
const supportTickets: Array<{
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  status: TicketStatus;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  messages: Array<{
    id: string;
    text: string;
    author: string;
    timestamp: Date;
    type: string;
  }>;
}> = [];
let ticketCounter = 1;

/**
 * Support API роутер
 * Доступен только для пользователей с ролью SUPPORT
 * Включает операции техподдержки, работу с тикетами
 */
export const supportRouter = createTRPCRouter({
  // Поиск в базе знаний
  searchKnowledge: supportOnly.input(searchKnowledgeSchema).query(async ({ input }) => {
    const { query, category, limit } = input;

    const results = KNOWLEDGE_BASE.filter(item => {
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesCategory = !category || item.category === category;

      return matchesQuery && matchesCategory;
    });

    return results.slice(0, limit);
  }),

  // Создать тикет для пользователя
  createTicket: supportOnly.input(createTicketAdminSchema).mutation(async ({ input, ctx }) => {
    const user = userManager.findById(input.userId);

    if (!user) {
      throw createNotFoundError('Пользователь');
    }

    const ticket = {
      id: `ticket_${ticketCounter++}`,
      userId: input.userId,
      userEmail: user.email,
      subject: input.subject,
      description: input.description,
      priority: input.priority,
      category: input.category,
      status: TICKET_STATUSES.OPEN,
      createdBy: ctx.user.email,
      createdAt: new Date(),
      messages: [],
    };

    supportTickets.push(ticket);

    console.log(
      `🎫 Тикет ${ticket.id} создан для пользователя ${user.email} саппортом ${ctx.user.email}`
    );

    return {
      success: true,
      ticket,
      message: 'Тикет создан',
    };
  }),

  // Получить тикеты саппорта
  getTickets: supportOnly.input(getTicketsSchema).query(async ({ input }) => {
    let tickets = supportTickets.filter(ticket => {
      const matchesStatus = !input.status || ticket.status === input.status;
      const matchesPriority = !input.priority || ticket.priority === input.priority;
      return matchesStatus && matchesPriority;
    });

    tickets = tickets
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, input.limit);

    return tickets;
  }),

  // Обновить статус тикета
  updateTicketStatus: supportOnly
    .input(updateTicketStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const ticketIndex = supportTickets.findIndex(t => t.id === input.ticketId);

      if (ticketIndex === -1) {
        throw createSupportError('ticket_not_found', input.ticketId);
      }

      const ticket = supportTickets.at(ticketIndex);
      if (!ticket) {
        throw createSupportError('ticket_not_found', input.ticketId);
      }

      ticket.status = input.status as TicketStatus;
      ticket.updatedBy = ctx.user.email;
      ticket.updatedAt = new Date();

      if (input.comment) {
        ticket.messages.push({
          id: `msg_${Date.now()}`,
          text: input.comment,
          author: ctx.user.email,
          timestamp: new Date(),
          type: 'STATUS_UPDATE',
        });
      }

      console.log(
        `🔄 Статус тикета ${input.ticketId} изменен на ${input.status} саппортом ${ctx.user.email}`
      );

      return {
        success: true,
        ticket,
        message: `Статус тикета изменен на ${input.status}`,
      };
    }),

  // Получить информацию о пользователе для консультации
  getUserInfo: supportOnly
    .input(getByIdSchema.extend({ userId: getByIdSchema.shape.id }))
    .query(async ({ input }) => {
      const user = userManager.findById(input.userId);

      if (!user) {
        throw createNotFoundError('Пользователь');
      }

      const userOrders = orderManager.getAll().filter(order => order.email === user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        stats: {
          totalOrders: userOrders.length,
          completedOrders: userOrders.filter(o => o.status === ORDER_STATUSES.COMPLETED).length,
          totalVolume: userOrders.reduce((sum, o) => sum + o.uahAmount, 0),
          registrationDays: Math.floor(
            (Date.now() - user.createdAt.getTime()) /
              (TIME_CONSTANTS.HOURS_IN_DAY *
                TIME_CONSTANTS.MINUTES_IN_HOUR *
                TIME_CONSTANTS.SECONDS_IN_MINUTE *
                UI_NUMERIC_CONSTANTS.MILLISECONDS_PER_SECOND)
          ),
        },
        recentOrders: userOrders
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, UI_NUMERIC_CONSTANTS.MAX_RECENT_ORDERS),
      };
    }),

  // Статистика работы саппорта
  getMyStats: supportOnly.query(async ({ ctx }) => {
    const myTickets = supportTickets.filter(
      ticket => ticket.createdBy === ctx.user.email || ticket.updatedBy === ctx.user.email
    );

    const today = new Date().toDateString();
    const todayTickets = myTickets.filter(ticket => ticket.createdAt.toDateString() === today);

    return {
      totalTickets: myTickets.length,
      todayTickets: todayTickets.length,
      openTickets: myTickets.filter(t => t.status === TICKET_STATUSES.OPEN).length,
      resolvedTickets: myTickets.filter(t => t.status === TICKET_STATUSES.RESOLVED).length,
      inProgressTickets: myTickets.filter(t => t.status === TICKET_STATUSES.IN_PROGRESS).length,
      avgResponseTime: '2 часа', // Заглушка
      knowledgeBaseArticles: KNOWLEDGE_BASE.length,
    };
  }),
});
