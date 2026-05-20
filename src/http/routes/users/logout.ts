import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import z from 'zod';
import { COOKIE_NAME } from '../../../contants';

export const logout = async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/logout',
        {
            schema: {
                tags: ['Users'],
                summary: 'Logout User',
                operationId: 'logout',
                response: {
                    200: z.null(),
                },
                security: [{ cookieAuth: [] }],
            },

            preHandler: [async (request) => await request.authenticate()],
        },
        async (_, reply) => {
            reply.clearCookie(COOKIE_NAME);
            return reply.status(200).send(null);
        }
    );
};
