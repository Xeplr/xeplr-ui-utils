// TextField — the model, and the theme contract that lets an app restyle it
// without forking the design.
import { toValue, normalise, validate, remaining, TEXT_TYPES } from '../src/textField/textField.js';
import { inputStyleVars } from '../src/theme/index.js';

const results = [];
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name); };

console.log('\nthe value is always a string');
check('null is empty, not "null"', toValue(null) === '');
check('undefined too', toValue(undefined) === '');
// A controlled input handed undefined flips to uncontrolled mid-life and React
// warns — a bug that only shows up once somebody clears the field.
check('a number becomes its text', toValue(42) === '42');
check('a string is itself', toValue('hi') === 'hi');

console.log('\ntrimming is asked for, never assumed');
// " " is a legitimate value in a search box and a mistake in a name field, and
// only the caller knows which.
check('left alone by default', normalise('  hi  ') === '  hi  ');
check('trimmed when asked', normalise('  hi  ', { trim: true }) === 'hi');
check('capped when asked', normalise('abcdef', { maxLength: 3 }) === 'abc');

console.log('\nvalidation says what is wrong, or nothing at all');
check('nothing wrong is null, not an object', validate('hi', {}) === null);
check('required and empty', validate('', { required: true }) !== null);
check('required and blank space is still empty', validate('   ', { required: true }) !== null);
check('required and filled is fine', validate('x', { required: true }) === null);
check('too short', validate('ab', { minLength: 3 }) !== null);
check('an empty field is not "too short" — it is required, or it is fine',
  validate('', { minLength: 3 }) === null);
check('too long', validate('abcd', { maxLength: 3 }) !== null);
check('a pattern that matches', validate('AB12', { pattern: /^[A-Z]{2}\d{2}$/ }) === null);
check('a pattern that does not', validate('nope', { pattern: /^[A-Z]{2}\d{2}$/ }) !== null);
check('a custom message is used', validate('', { required: true, requiredMessage: 'Name it' }) === 'Name it');

console.log('\nthe counter');
check('no limit means nothing to count', remaining('abc', null) === null);
check('counts down', remaining('abc', 10) === 7);

console.log('\nthree shapes, one control');
check('text, multiline and search', TEXT_TYPES.join() === 'text,multiline,search');

console.log('\nthe theme drives the look — no design fork needed');
{
  const d = inputStyleVars('text');
  check('a default has all four edges',
    d['--xeplr-input-text-border-top'] === '1px' && d['--xeplr-input-text-border-left'] === '1px');

  // The case this was built for.
  const bottomOnly = inputStyleVars('text', {
    themes: { light: { input: { text: { border: { top: false, right: false, left: false, bottom: true, radius: '0' } } } } }
  });
  check('bottom rule only: the other three go to 0',
    bottomOnly['--xeplr-input-text-border-top'] === '0' &&
    bottomOnly['--xeplr-input-text-border-right'] === '0' &&
    bottomOnly['--xeplr-input-text-border-left'] === '0');
  check('...and the one kept stays', bottomOnly['--xeplr-input-text-border-bottom'] === '1px');
  check('...and the radius goes with it', bottomOnly['--xeplr-input-text-radius'] === '0');
  // An edge that is false must emit 0. Omitting it would fall through to the
  // stylesheet's own default and quietly put the border back.
  check('a dropped edge is 0, not absent',
    '--xeplr-input-text-border-top' in bottomOnly);
}

console.log('\nthe label carries the full Font block');
{
  // The same shape @xeplr/ui-charts' type.js defines, so `underline` means the
  // same thing on a field label as on a chart's — one font vocabulary, not two.
  const v = inputStyleVars('text');
  const has = (k) => (`--xeplr-input-text-label-${k}`) in v;
  check('colour', has('color'));
  check('underline', has('decoration'));
  check('the ones the default theme sets are emitted',
    has('size') && has('weight') && has('style') && has('variant') &&
    has('line-height') && has('spacing') && has('align') && has('transform'));
  // family and opacity ship UNSET on purpose: no variable is emitted, the
  // stylesheet falls back to `inherit` and 1, and the label takes the app's
  // own font. Shipping a value would override an app that never asked.
  check('the ones it leaves unset inherit rather than being forced',
    !has('family') && !has('opacity'));
  const everything = inputStyleVars('text', {
    themes: { light: { input: { text: { label: { family: 'Georgia', opacity: 0.7 } } } } }
  });
  check('...and are emitted the moment a theme sets them',
    everything['--xeplr-input-text-label-family'] === 'Georgia' &&
    everything['--xeplr-input-text-label-opacity'] === 0.7);

  const styled = inputStyleVars('text', {
    themes: { light: { input: { text: { label: { decoration: 'underline', color: '#c00', style: 'italic' } } } } }
  });
  check('underlining a label works', styled['--xeplr-input-text-label-decoration'] === 'underline');
  check('...and colouring it', styled['--xeplr-input-text-label-color'] === '#c00');
  check('...and italicising it', styled['--xeplr-input-text-label-style'] === 'italic');
  // A property the theme accepts and the stylesheet ignores is a setting that
  // silently does nothing — every emitted variable is read by textField.css.
  check('help text takes the same treatment',
    ('--xeplr-input-text-help-color' in v) && ('--xeplr-input-text-help-decoration' in v));
}

console.log('\none section per control');
{
  // Separate so a dropdown CAN differ from a textbox; identical by default so
  // it need not.
  check('each control has its own variables',
    inputStyleVars('select')['--xeplr-input-select-bg'] !== undefined &&
    inputStyleVars('number')['--xeplr-input-number-bg'] !== undefined &&
    inputStyleVars('date')['--xeplr-input-date-bg'] !== undefined);
  check('and they do not collide',
    inputStyleVars('text')['--xeplr-input-select-bg'] === undefined);

  const onlyText = inputStyleVars('select', {
    themes: { light: { input: { text: { border: { bottom: false } } } } }
  });
  check('restyling one control leaves the others alone',
    onlyText['--xeplr-input-select-border-bottom'] === '1px');
}

console.log('\nnothing renders as the word "undefined"');
{
  const sparse = inputStyleVars('text', { themes: { light: { input: { text: { padding: undefined } } } } });
  check('an unset value is omitted, not stringified',
    !Object.values(sparse).some((v) => v === undefined || v === 'undefined'));
}

const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
