import type { FastifyInstance } from 'fastify';
import { usersRoutes } from './users';


export const routes = (fastify: FastifyInstance) => {
    fastify.register(usersRoutes, { prefix: '/users' });
};
