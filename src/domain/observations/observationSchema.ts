import { z } from 'zod';
import { catalogId } from '../lakes/catalogSchemas';

const utcDate = z.iso.datetime({
  offset: true,
  message: 'La fecha no es válida.',
});
export const observationLocationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  accuracy: z.number().finite().min(0),
  capturedAt: utcDate,
});

// Saving a draft is allowed before camera/location capture. Completing it is not.
const photoUriSchema = z
  .string()
  .regex(/^file:\/\/\/.+/, 'La fotografía debe ser un archivo local.');
export const observationDraftSchema = z.object({
  lakeId: catalogId,
  observedAt: utcDate,
  note: z.string().trim().max(2000, 'La nota admite hasta 2000 caracteres.'),
  location: observationLocationSchema.nullable(),
  photoUri: photoUriSchema.nullable(),
});
export const completeObservationSchema = observationDraftSchema.extend({
  location: observationLocationSchema,
  photoUri: photoUriSchema,
});
export type ObservationValues = z.infer<typeof observationDraftSchema>;
export const storedObservationSchema = z.object({
  version: z.literal(1),
  id: catalogId,
  ownerId: z.string().min(1),
  apiScope: z.string(),
  values: observationDraftSchema,
  savedAt: utcDate,
  status: z.literal('pending_send'),
});
export type StoredObservation = z.infer<typeof storedObservationSchema>;

export function formatObservationDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Round-trip calendar fields: Date would silently turn February 30 into March.
export function parseObservationDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  if (year < 1900 || year > 9999) return null;
  const date = new Date(year, month - 1, day, hour, minute);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  )
    return null;
  return date.toISOString();
}
