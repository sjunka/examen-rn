import { parseWebToNativeMessage } from './webMessages';

describe('parseWebToNativeMessage', () => {
  it('parses a valid WEB_APP_READY message', () => {
    expect(parseWebToNativeMessage(JSON.stringify({ type: 'WEB_APP_READY' }))).toEqual({
      type: 'WEB_APP_READY',
    });
  });

  it('parses a valid DEPOSIT_CONFIRMED message', () => {
    const raw = JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: '1', amount: 1000 } });

    expect(parseWebToNativeMessage(raw)).toEqual({
      type: 'DEPOSIT_CONFIRMED',
      payload: { goalId: '1', amount: 1000 },
    });
  });

  // Envelope shape — never throws, always resolves to null or a typed message.
  it.each([
    ['invalid JSON', 'not json'],
    ['an empty string', ''],
    ['a JSON array', '[1, 2, 3]'],
    ['a JSON string', '"hello"'],
    ['a JSON number', '42'],
    ['null', 'null'],
    ['an unknown message type', JSON.stringify({ type: 'SOMETHING_ELSE' })],
    ['a missing type', JSON.stringify({})],
    ['a DEPOSIT_CONFIRMED with no payload', JSON.stringify({ type: 'DEPOSIT_CONFIRMED' })],
    [
      'a DEPOSIT_CONFIRMED with a non-object payload',
      JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: 'nope' }),
    ],
    [
      'an empty goalId',
      JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: '', amount: 1000 } }),
    ],
    [
      'a non-textual goalId',
      JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: 7, amount: 1000 } }),
    ],
    [
      'a missing goalId',
      JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: { amount: 1000 } }),
    ],
  ])('rejects %s', (_description, raw) => {
    expect(parseWebToNativeMessage(raw)).toBeNull();
  });

  // Amount validation — delegates to the domain's isValidAmount, exercised
  // here through the parser's envelope.
  it.each([
    ['zero', 0],
    ['negative', -1000],
    ['decimal', 1.5],
    ['non-numeric', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['expressed as text', '1000'],
    ['greater than the safe integer limit', Number.MAX_SAFE_INTEGER + 1],
  ])('rejects an amount that is %s', (_description, amount) => {
    const raw = JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: '1', amount } });

    expect(parseWebToNativeMessage(raw)).toBeNull();
  });
});
