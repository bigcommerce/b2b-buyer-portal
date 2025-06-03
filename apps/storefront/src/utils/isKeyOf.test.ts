import { isKeyOf } from './isKeyOf';

it('returns true for existing keys', () => {
  const obj = { a: 1, b: 2, c: 3 };

  expect(isKeyOf(obj, 'a')).toBe(true);
  expect(isKeyOf(obj, 'b')).toBe(true);
});

it('returns false for non-existing keys', () => {
  const obj = { a: 1, b: 2, c: 3 };

  expect(isKeyOf(obj, 'd')).toBe(false);
  expect(isKeyOf(obj, 'e')).toBe(false);
});
