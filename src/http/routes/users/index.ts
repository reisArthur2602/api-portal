import { type FastifyInstance } from 'fastify';
import { createUser } from './create-user';

import { getUserRole } from './get-user-role';
import { listUsers } from './list-users';
import { login } from './login';
import { profile } from './profile';

export const usersRoutes = (app: FastifyInstance) => {
    app.register(login);
    app.register(createUser);
    app.register(profile);
    app.register(getUserRole);
    app.register(listUsers);
};
