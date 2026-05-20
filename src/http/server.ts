import 'dotenv/config';

import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { fastifyMultipart } from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import fastify from 'fastify';

import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod';

import { authPlugin } from '../plugins/auth';

import fastifyCookie from '@fastify/cookie';
import fastifyRateLimit from '@fastify/rate-limit';
import { COOKIE_NAME } from '../contants';
import { errorHandler } from './_errors';
import { routes } from './routes';

// ENV
const PORT = Number(process.env.PORT ?? 6000);
const JWT_SECRET = process.env.JWT_SECRET as string;
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const ALLOWED_ORIGIN = NODE_ENV === 'production' ? /\.centromedicoroma\.com\.br$/ : '*';

const server = fastify();

server.register(fastifyRateLimit, { max: 20, timeWindow: '5 minute' });

server.setSerializerCompiler(serializerCompiler);
server.setValidatorCompiler(validatorCompiler);

server.setErrorHandler(errorHandler);

server.register(fastifyCors, {
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

server.register(fastifyCookie, {
    parseOptions: {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: NODE_ENV === 'production' ? 'lax' : 'lax',
        domain: NODE_ENV === 'production' ? '.centromedicoroma.com.br' : undefined,
    },
});

server.register(fastifyJwt, {
    secret: JWT_SECRET,
    cookie: {
        cookieName: COOKIE_NAME,
        signed: NODE_ENV === 'production' ? true : false,
    },
});

server.register(fastifyMultipart, {
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 1,
        fields: 10,
    },
});

server.register(fastifySwagger, {
    openapi: {
        openapi: '3.0.4',
        info: {
            title: 'Portal Master API',
            description: 'Documentação da API',
            version: '1.0.0',
        },

        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: COOKIE_NAME,
                },
            },
        },
    },
    transform: jsonSchemaTransform,
});

server.get('/openapi.json', async () => server.swagger());

server.register(fastifyApiReference, {
    routePrefix: '/docs',
    configuration: {
        url: '/openapi.json',
        persistAuth: true,
        pageTitle: 'Portal Master - Documentação',
    },
});

//rotas
server.register(routes);

// plugins
server.register(authPlugin);

server.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
    console.clear();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Servidor iniciado com sucesso');
    console.log(`📘 Documentação: http://localhost:${PORT}/docs`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
