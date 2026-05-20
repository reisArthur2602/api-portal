import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { db } from '../../../db/prisma';
import { UserRole } from '../../../generated/prisma/enums';
import { hashPassword } from '../../../lib/argon2';
import { BadRequestError } from '../../_errors/bad-request';

export const createUser = (app: FastifyInstance) =>
    app.withTypeProvider<ZodTypeProvider>().post(
        '/create',
        {
            schema: {
                tags: ['Users'],
                summary: 'Create User',
                operationId: 'createUser',
                body: z.object({
                    email: z.string().email().optional(),
                    userName: z.string().min(2),
                    role: z.enum(UserRole),
                }),
                response: {
                    201: z.null(),
                },
                security: [{ cookieAuth: [] }],
            },

            preHandler: [
                async (request) => await request.authenticate(),
                async (request) => await request.shouldBeAdmin(),
            ],
        },

        async (request, reply) => {
            const { email, userName, role } = request.body;

            const existingUserWithUserName = await db.user.findUnique({
                where: { userName },
            });

            if (existingUserWithUserName)
                throw new BadRequestError(
                    'Este nome de usuário já está sendo usado por outro membro'
                );

            const DEFAULT_PASSWORD_USERS = process.env.DEFAULT_PASSWORD_USERS as string;

            const passwordHash = await hashPassword(DEFAULT_PASSWORD_USERS);

            await db.user.create({
                data: { email, password: passwordHash, userName, role },
            });

            return reply.status(201).send(null);
        }
    );
