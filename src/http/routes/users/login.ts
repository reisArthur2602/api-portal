import type { FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';

import z from 'zod';
import { db } from '../../../db/prisma';
import { verifyPassword } from '../../../lib/argon2';
import { BadRequestError } from '../../_errors/bad-request';

export const login = (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/login',
        {
            schema: {
                tags: ['Users'],
                summary: 'Login',
                operationId: 'login',
                body: z.object({
                    userName: z.string().email(),
                    password: z.string().min(6),
                }),
                response: {
                    200: z.object({
                        accessToken: z.string().jwt(),
                    }),
                },
            },
        },
        async (request, reply) => {
            const { userName, password } = request.body;

            const user = await db.user.findUnique({
                where: { userName },
                select: {
                    id: true,
                    password: true,
                },
            });

            if (!user) throw new BadRequestError('Credenciais inválidas');

            const isPasswordValid = await verifyPassword(user.password, password);
            
            if (!isPasswordValid) throw new BadRequestError('Credenciais inválidas');

            const accessToken = await reply.jwtSign({ sub: user.id }, { expiresIn: '7d' });

            return reply.status(200).send({
                accessToken,
            });
        }
    );
};
