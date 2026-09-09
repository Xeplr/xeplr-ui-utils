// A design that omits any of these can't collect a date, so the page reports
// loudly at mount rather than rendering a control nobody can use.
//
// The tabs are the one thing always on screen. Everything else belongs to a
// tab — the quick list to "Quick", the date inputs to "Range"/"Single" — so
// requiring a preset list AND a date input at the same time is a rule no
// tabbed design can satisfy on any tab. It failed every time it was mounted.
// `anyOf` asks what is actually meant: is there some way to enter a date?
export var DATE_RANGE_RULES = [
  { selector: '.xeplr-daterange-tabs button, [data-xeplr-daterange-tab]', label: 'Tab buttons (quick / range / single)' },
  {
    anyOf: [
      '.xeplr-daterange-list button',
      '[data-xeplr-daterange-preset]',
      'input[type="date"]',
      '.xeplr-daterange-input'
    ],
    label: 'A way to pick a date — a quick preset list, or a date input'
  }
];
