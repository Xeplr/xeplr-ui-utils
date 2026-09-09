// PROGRESS NOTIFIER — the model.
//
// Long-running work on the server must never be silent on the client. Not a
// spinner that means "something, somewhere" — the actual thing it is doing,
// updated as it does it, until it says it is finished.
//
// ── WHY THIS PACKAGE AND NOT EACH APP ────────────────────────────────────
//
// Because it kept being rebuilt. A report had one, a dashboard widget had one,
// and the next screen that needed one wrote a third with its own bar, its own
// keyframes and its own idea of what "running" looks like. They drift, and the
// drift is visible: the same operation reports differently depending on which
// screen you started it from.
//
// ── THE EVENT SHAPE, AND WHY IT IS NOT THE APP'S ─────────────────────────
//
// This module knows nothing about SSE, tickets, topics or run stores. An app
// attaches its own stream once, adapting whatever it publishes into:
//
//     { key, continue: true|false, status?, data }
//
//   key      — what the work is ABOUT, chosen by the back end: a cube id, a
//              move run id, a report id. A notifier is mounted with the same
//              key, so a screen listens using an id it already has rather than
//              one it has to be handed back.
//   continue — TRUE while the work is still going. This is the whole of the
//              visibility rule: a notifier shows itself when it hears `true`
//              for its key and is otherwise invisible. Nothing on the client
//              decides when to appear.
//   status   — optional, and only interesting for how it ENDED: 'error' when
//              it failed. Absent means the ordinary case.
//   data     — whatever the work knows about itself. Free-form, deliberately:
//              the server sends what it has, and the SENTENCE is made here. A
//              server that formats prose cannot be re-worded without a
//              deployment, and cannot be translated at all.
//
// ── HIDDEN UNTIL TOLD OTHERWISE ──────────────────────────────────────────
//
// A notifier renders nothing until an event for its key arrives. That is what
// makes it safe to put on ten components: they all sit at zero height, and the
// one whose work is running — or all of them, if they share a key — appear
// together. Nothing needs to know which screen started the job, and a screen
// opened halfway through a build shows it without asking anybody.

var _subscribe = null;

/**
 * Point the notifier at this app's event stream. Called ONCE at startup.
 *
 * `subscribe(handler)` must call `handler({ key, status, data })` for every
 * event and return an unsubscribe function.
 *
 * Nothing here opens a connection: an app already has one stream and should
 * not grow a second for this. The adapter is where its own event shape is
 * translated — see the notes on the contract above.
 */
export function attachProgressSource(subscribe) {
  _subscribe = typeof subscribe === 'function' ? subscribe : null;
}

/** Whether an app has attached a stream. False means every notifier is inert. */
export function progressSourceAttached() {
  return Boolean(_subscribe);
}

/**
 * Listen for events about one key.
 *
 * Returns an unsubscribe function, always — including when no source is
 * attached, so a component's cleanup never has to check. A notifier mounted in
 * an app that never attached one simply shows nothing, rather than throwing in
 * a render.
 */
export function subscribeToProgress(key, handler) {
  if (!_subscribe || !key) return function() {};
  return _subscribe(function(evt) {
    if (!evt || evt.key !== key) return;
    handler(normalize(evt));
  }) || function() {};
}

/**
 * One shape for the component, whichever way the app phrased it.
 *
 * `continue` is the field the back end sends and the one the contract is
 * written around, but it cannot be a variable name in JavaScript — so it is
 * turned into a plain state here, once, rather than being read as
 * `evt['continue']` at four call sites.
 *
 * An event with neither `continue` nor a status is treated as STILL RUNNING.
 * Being wrong that way leaves a bar spinning until the next event; being wrong
 * the other way hides a job that is still going, which is the failure this
 * whole component exists to prevent.
 */
function normalize(evt) {
  var state = 'running';
  if (evt.status === 'error') state = 'error';
  else if (evt.continue === false) state = 'complete';
  else if (evt.status === 'complete') state = 'complete';

  return { key: evt.key, state: state, data: evt.data || {} };
}

// ── turning `data` into a sentence ───────────────────────────────────────

/** Thousands separators, because 5022241 is not a number anybody reads. */
function count(n) {
  return Number(n).toLocaleString();
}

/**
 * What to SAY about a piece of work, from whatever it reported.
 *
 * The order is deliberate. An explicit `message` wins, because work that knows
 * its own phase ("Rolling the rows up…") says it better than anything derived.
 * Failing that, the counters are assembled — and counters are the honest thing
 * to show, since almost nothing here can report a percentage: a GROUP BY does
 * not know how far through it is, and a bar claiming 60% would be invented.
 *
 * The last resort is a plain sentence rather than an empty string. "Working…"
 * next to a moving bar is a true statement; a blank line beside it looks like
 * the thing has stalled.
 *
 * A SAMPLE, in the sense that these are the fields our work happens to send
 * today. Adding one is a line here, not a change to any server.
 */
export function describeProgress(data, noun) {
  var d = data || {};
  if (d.message) return d.message;

  var parts = [];
  // Read vs loaded, kept separate: a move that read 50,000 rows and wrote none
  // is the failure most worth seeing, and one merged number hides it.
  if (d.rowsRead != null) parts.push(count(d.rowsRead) + ' rows read');
  if (d.rowsLoaded != null) parts.push(count(d.rowsLoaded) + ' loaded');
  if (d.rowsScanned != null) parts.push(count(d.rowsScanned) + ' rows scanned');
  if (d.groupCount != null) parts.push(count(d.groupCount) + ' groups');
  if (d.batches != null) parts.push(count(d.batches) + ' batches');
  if (d.cubeRows != null) parts.push(count(d.cubeRows) + ' rows');

  if (parts.length) return parts.join(' · ') + '…';
  return 'Working on the ' + (noun || 'task') + '…';
}

/**
 * What to say once it has finished — the part people actually wait for.
 *
 * Separate from the running text because the tense and the content differ: a
 * finished job reports a RESULT and how long it took, not what it was doing.
 */
export function describeComplete(data, noun) {
  var d = data || {};
  if (d.message) return d.message;

  var what = null;
  if (d.cubeRows != null) what = count(d.cubeRows) + ' rows';
  else if (d.rowsLoaded != null) what = count(d.rowsLoaded) + ' rows';
  else if (d.groupCount != null) what = count(d.groupCount) + ' groups';

  var took = d.durationMs != null
    ? ' in ' + (d.durationMs < 1000
        ? d.durationMs + 'ms'
        : (d.durationMs / 1000).toFixed(1) + 's')
    : '';

  if (what) return 'Finished — ' + what + took;
  return 'Finished' + (took || '') + (noun ? ' — ' + noun : '');
}
