import {
  completeObservationSchema,
  observationDraftSchema,
  parseObservationDate,
  formatObservationDate,
} from '../observationSchema';

const draft = {
  lakeId: '11111111-1111-4111-8111-111111111111',
  observedAt: '2026-10-07T12:00:00Z',
  note: '  Agua turbia  ',
  location: null,
  photoUri: null,
};
it('allows an incomplete local draft and trims the note', () => {
  expect(observationDraftSchema.parse(draft).note).toBe('Agua turbia');
  expect(completeObservationSchema.safeParse(draft).success).toBe(false);
});
it.each([
  '2026-02-30 12:00',
  '2026-13-01 12:00',
  '2026-10-07 24:01',
  '2026-10-07 12:60',
  'ayer',
  '2026-10-07',
])('rejects impossible or ambiguous local dates: %s', (value) => {
  expect(parseObservationDate(value)).toBeNull();
});
it('preserves local calendar time while serializing UTC, including a leap day', () => {
  const date = new Date(2028, 1, 29, 14, 30);
  expect(formatObservationDate(date)).toBe('2028-02-29 14:30');
  expect(parseObservationDate(formatObservationDate(date))).toBe(
    date.toISOString(),
  );
});
const location = {
  latitude: -39.6,
  longitude: -72.3,
  accuracy: 8,
  capturedAt: draft.observedAt,
};
it.each([
  { latitude: 91 },
  { latitude: -91 },
  { longitude: 181 },
  { longitude: -181 },
  { latitude: NaN },
  { longitude: Infinity },
  { accuracy: -1 },
])('rejects invalid coordinates even in an incomplete draft: %j', (change) => {
  expect(
    observationDraftSchema.safeParse({
      ...draft,
      location: { ...location, ...change },
    }).success,
  ).toBe(false);
});
it('requires lake, timestamp, location and photograph before completing', () => {
  const complete = { ...draft, location, photoUri: 'file:///observation.jpg' };
  expect(completeObservationSchema.safeParse(complete).success).toBe(true);
  for (const change of [
    { lakeId: '' },
    { observedAt: 'wrong' },
    { location: null },
    { photoUri: null },
    { photoUri: '' },
  ]) {
    expect(
      completeObservationSchema.safeParse({ ...complete, ...change }).success,
    ).toBe(false);
  }
});
it('rejects oversized notes without truncating the user input', () => {
  expect(
    observationDraftSchema.safeParse({ ...draft, note: 'a'.repeat(2001) })
      .success,
  ).toBe(false);
});
it.each([
  'https://example.com/photo.jpg',
  'data:image/jpeg;base64,AAA',
  'file://',
])('rejects nonlocal or empty photograph references: %s', (photoUri) => {
  expect(observationDraftSchema.safeParse({ ...draft, photoUri }).success).toBe(
    false,
  );
});
