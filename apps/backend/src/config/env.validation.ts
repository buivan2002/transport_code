import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  CARRIER_API_TIMEOUT_MS: Joi.number().default(5000),
  GHTK_ENABLED: Joi.boolean().default(true),
  GHTK_MOCK_MODE: Joi.boolean().default(true),
  GHTK_API_BASE_URL: Joi.string().uri().optional(),
  GHTK_API_TOKEN: Joi.string().optional(),
});
