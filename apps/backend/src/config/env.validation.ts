import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  CARRIER_API_TIMEOUT_MS: Joi.number().default(5000),
  TRACKING_CACHE_IN_TRANSIT_TTL_SECONDS: Joi.number().default(300),
  TRACKING_CACHE_FINAL_TTL_SECONDS: Joi.number().default(186400),
  TRACKING_CACHE_NOT_FOUND_TTL_SECONDS: Joi.number().default(300),
  SPX_ENABLED: Joi.boolean().default(true),
  SPX_PUBLIC_SOURCE_ENABLED: Joi.boolean().default(true),
  SPX_TRAMAVANDON_SOURCE_ENABLED: Joi.boolean().default(true),
  SPX_PUBLIC_SOURCE_URL: Joi.string()
    .uri()
    .default('https://spx.vn/shipment/order/open/order/get_order_info'),
  SPX_TRAMAVANDON_SOURCE_URL: Joi.string()
    .uri()
    .default('https://tramavandon.com/api/spx.php'),
  JT_ENABLED: Joi.boolean().default(true),
  JT_TRAMAVANDON_SOURCE_ENABLED: Joi.boolean().default(true),
  JT_TRAMAVANDON_SOURCE_URL: Joi.string()
    .uri()
    .default('https://tramavandon.com/api/jtexpress.php'),
  GHTK_ENABLED: Joi.boolean().default(true),
  GHTK_MOCK_MODE: Joi.boolean().default(true),
  GHTK_API_BASE_URL: Joi.string().uri().optional(),
  GHTK_API_TOKEN: Joi.string().optional(),
});
