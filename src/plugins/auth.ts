import type { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { db } from '../db/prisma';
import { UnauthorizedError } from '../http/_errors/unauthorized';

export const authPlugin = fastifyPlugin(async (app: FastifyInstance) => {
    app.decorateRequest('authenticate', async () => {
        throw new UnauthorizedError('Acesso restrito. Autenticação necessária.');
    });

    app.decorateRequest('getCurrentUserId', async () => {
        throw new UnauthorizedError('Acesso restrito. Autenticação necessária.');
    });

    app.decorateRequest('shouldBeAdmin', async () => {
        throw new UnauthorizedError('Acesso restrito. Permissão insuficiente.');
    });

    app.addHook('preHandler', async (request) => {
        request.authenticate = async () => {
            try {
                const token = await request.jwtVerify<{ sub: string }>();

                const user = await db.user.findUnique({
                    where: { id: token.sub },
                    select: { id: true, role: true },
                });

                if (!user) throw new UnauthorizedError('Usuário não encontrado');

                return { userId: user.id, role: user.role };
            } catch (error) {
                throw new UnauthorizedError('Token inválido ou expirado');
            }
        };

        request.getCurrentUserId = async () => {
            const { userId } = await request.authenticate();
            return userId;
        };

        request.shouldBeAdmin = async () => {
            const { userId } = await request.authenticate();

            const user = await db.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });

            const isAdmin = user?.role === 'ADMIN';

            if (!isAdmin)
                throw new UnauthorizedError(
                    'Acesso negado. Você não possui permissão administrativa para executar esta ação.'
                );
        };
    });
});
