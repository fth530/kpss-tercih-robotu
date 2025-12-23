import { z } from 'zod';
import { positions, qualifications } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  meta: {
    get: {
      method: 'GET' as const,
      path: '/api/meta',
      responses: {
        200: z.object({
          cities: z.array(z.string()),
          educationLevels: z.array(z.string()),
          qualifications: z.array(z.custom<typeof qualifications.$inferSelect>()),
        }),
      },
    },
  },
  positions: {
    search: {
      method: 'POST' as const,
      path: '/api/positions/search',
      input: z.object({
        educationLevel: z.string(),
        cities: z.array(z.string()),
        departmentCodes: z.array(z.string()), // Updated to array
      }),
      responses: {
        200: z.array(z.custom<typeof positions.$inferSelect & { qualifications: typeof qualifications.$inferSelect[] }>()),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type SearchInput = z.infer<typeof api.positions.search.input>;
export type SearchResponse = z.infer<typeof api.positions.search.responses[200]>;
export type MetaResponse = z.infer<typeof api.meta.get.responses[200]>;
