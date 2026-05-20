import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { db } from '../../../db/prisma';
import { UserRole } from '../../../generated/prisma/enums';

export const listUsers = (app: FastifyInstance) =>
    app.withTypeProvider<ZodTypeProvider>().get(
        '/list',
        {
            schema: {
                tags: ['Users'],
                summary: 'List Users',
                operationId: 'listUsers',
                response: {
                    200: z.object({
                        users: z.array(
                            z.object({
                                id: z.string().cuid(),
                                userName: z.string(),
                                email: z.string().email().nullable(),
                                role: z.enum(UserRole),
                                createdAt: z.date(),
                            })
                        ),
                    }),
                },
                security: [{ cookieAuth: [] }],
            },

            preHandler: [
                async (request) => await request.authenticate(),
                async (request) => await request.shouldBeAdmin(),
            ],
        },

        async (_, reply) => {
            const users = await db.user.findMany({
                select: {
                    id: true,
                    userName: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
                orderBy: {
                    userName: 'asc',
                },
            });

            return reply.status(200).send({
                users,
            });
        }
    );
