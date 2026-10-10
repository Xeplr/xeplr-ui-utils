import { parseColor, formatColor, sameHue, DEFAULT_SWATCHES } from '../src/colorPicker/colorPicker.js';

const results = []
const check = (name, cond) => { results.push([name, cond]); console.log((cond ? '  ok   ' : '  FAIL ') + name) }

console.log('\ncolorPicker model')

check('a 6-digit colour is solid', JSON.stringify(parseColor('#4F7CFF')) === '{"hex":"#4f7cff","opacity":100}')
check('a 3-digit colour is widened', parseColor('#abc').hex === '#aabbcc')
check('an 8-digit colour carries its opacity', parseColor('#4f7cff80').opacity === 50)
check('no colour, or anything else, is null', parseColor(null) === null && parseColor('red') === null && parseColor('') === null)
check('full opacity writes the plain 6 digits', formatColor('#4f7cff', 100) === '#4f7cff')
check('less writes the alpha as two more digits', formatColor('#4f7cff', 50) === '#4f7cff80')
check('nothing see-through at all is 00', formatColor('#4f7cff', 0) === '#4f7cff00')
check('opacity is held to 0–100', formatColor('#4f7cff', 140) === '#4f7cff' && formatColor('#4f7cff', -5) === '#4f7cff00')
check('a colour that is not one formats to null', formatColor('nope', 50) === null)
check('it round-trips', formatColor(parseColor('#12345680').hex, parseColor('#12345680').opacity) === '#12345680')
check('the same swatch whatever its opacity', sameHue('#4f7cff', '#4F7CFF40') && !sameHue('#4f7cff', '#4f7cfe'))
check('every default swatch is a colour', DEFAULT_SWATCHES.every((s) => parseColor(s)))

const failed = results.filter(([, cond]) => !cond)
console.log(failed.length ? `\n${failed.length} failed` : '\nall passed')
process.exit(failed.length ? 1 : 0)
