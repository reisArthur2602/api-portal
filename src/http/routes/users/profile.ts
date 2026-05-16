import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import z from 'zod';
import { UserRole } from '../../../../generated/prisma/enums';
import { db } from '../../../db/prisma';
import { NotFoundError } from '../../_errors/not-found';

export const profile = async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/profile',
        {
            schema: {
                tags: ['Users'],
                summary: 'Get User Profile',
                operationId: 'getProfile',
                response: {
                    200: z.object({
                        user: z.object({
                            id: z.cuid(),
                            email: z.string().email().nullable(),
                            userName: z.string(),
                            role: z.enum(UserRole).default('Staff'),
                        }),
                    }),
                },
                security: [{ bearerAuth: [] }],
            },

            preHandler: [async (request) => await request.authenticate()],
        },
        async (request, reply) => {
            const userId = await request.getCurrentUserId();

            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    userName: true,
                    role: true,
                },
            });
            if (!user) throw new NotFoundError('Usuário não encontrado.');

            return reply.status(200).send({ user });
        }
    );
};
