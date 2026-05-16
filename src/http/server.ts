import 'dotenv/config';

import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { fastifyMultipart } from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifyApiReference from '@scalar/fastify-api-reference';
import fastify from 'fastify';

import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod';

import { authPlugin } from '../plugins/auth';

import { errorHandler } from './_errors';
import { routes } from './routes';

const PORT = Number(process.env.PORT ?? 6000);
const HOST = process.env.HOST ?? '0.0.0.0';

const server = fastify();

// rate limit
server.register(fastifyRateLimit, { max: 20, timeWindow: '1 minute' });

server.setSerializerCompiler(serializerCompiler);
server.setValidatorCompiler(validatorCompiler);

// tratamento de erros
server.setErrorHandler(errorHandler);

server.register(fastifyCors, { origin: true });

server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET as string,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
});

server.register(fastifyMultipart, {
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 1,
        fields: 10,
    },
});

//documentação

server.register(fastifySwagger, {
    openapi: {
        openapi: '3.0.3',
        info: {
            title: 'API - Portal Master',
            version: '1.0.0',
            description: 'API do sistema de gestão Portal Master',
        },

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
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
        theme: 'purple',
        layout: 'classic',
        showSidebar: true,
        hideSearch: false,
        hideClientButton: true,
        hideDarkModeToggle: false,
        darkMode: true,
        hideModels: true,
        persistAuth: true,
        pageTitle: 'Portal Master - Documentação',
        favicon: 'https://img.icons8.com/?size=100&id=35588&format=png&color=0082FF',
    },
});

//rotas
server.register(routes);

// plugins
server.register(authPlugin);

server.listen({ port: PORT, host: HOST }).then(() => {
    console.clear();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Servidor iniciado com sucesso');
    console.log(`📘 Documentação: http://localhost:${PORT}/docs`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
