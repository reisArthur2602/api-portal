import { type FastifyError, type FastifyInstance } from "fastify";

import { type ZodFastifySchemaValidationError } from "fastify-type-provider-zod";
import { BadRequestError } from "./bad-request.js";
import { NotFoundError } from "./not-found.js";
import { UnauthorizedError } from "./unauthorized.js";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (error, _, reply) => {
  if (error instanceof BadRequestError)
    return reply.status(400).send({ message: error.message });

  if (error instanceof UnauthorizedError)
    return reply.status(401).send({ message: error.message });

  if (error instanceof NotFoundError)
    return reply.status(404).send({ message: error.message });

  if ((error as FastifyError).code === "FST_ERR_VALIDATION") {
    const zodError = error as unknown as {
      validation?: ZodFastifySchemaValidationError[];
    };

    const validation = zodError.validation ?? [];

    return reply.status(400).send({
      message: "Validation error",
      errors: validation.map((v) => ({
        field: v.instancePath?.replace("/", "") || "(root)",
        message: v.message,
      })),
    });
  }

  console.error(error);

  return reply.status(500).send({ message: "Erro interno do servidor" });
};
