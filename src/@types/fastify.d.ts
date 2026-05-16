import 'fastify';

declare module 'fastify' {
    export interface FastifyRequest {
        getCurrentUserId(): Promise<string>;
        shouldBeAdmin(): Promise<void>;
        authenticate(): Promise<{ userId: string }>;
    }
}
