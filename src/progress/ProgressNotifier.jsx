import { useEffect, useRef, useState } from 'react';
import { subscribeToProgress, describeProgress, describeComplete } from './progressSource.js';
import './designs/progressNotifier.css';

// PROGRESS NOTIFIER — a small moving bar and a line of text, driven by an
// event key. Mount it next to anything that starts long-running work.
//
// ── A NOTIFIER, NOT A PROGRESS BAR ───────────────────────────────────────
//
// The bar is INDETERMINATE and always will be. Almost nothing this reports on
// can honestly say how far through it is: a GROUP BY over twenty million rows
// knows it is running and nothing else, and a bar creeping to 60% would be a
// number invented to look reassuring. What moves says "this is alive"; what is
// TRUE is in the text beside it, which is the count the server actually has.
//
// So it is not measuring the work. It is telling you the work exists, and
// repeating what it last said about itself.
//
// ── IT LISTENS, IT DOES NOT ASK ──────────────────────────────────────────
//
// No polling and no fetching. The app attaches its stream once with
// attachProgressSource, and this subscribes to one key on it. A screen shows a
// notifier for a job it did not start — one already running when the page
// loaded, or started by somebody else — with no extra wiring, because the key
// is the thing it is about rather than a handle handed back to whoever
// launched it.

export default function ProgressNotifier({
  eventKey,
  noun,
  // Shown before anything has been heard. Usually nothing — a notifier for
  // work that is not running should take up no room at all.
  idle = null,
  // Keep the finished line on screen instead of clearing it. Worth it where
  // there is nothing else to show the result (a card with no numbers on it);
  // not worth it where the result itself is about to appear underneath.
  keepFinal = false,
  // How long the finished line stays before it clears, when it does.
  finalMs = 4000,
  onComplete,
  onError,
  className = ''
}) {
  const [state, setState] = useState(null);   // { status, message }

  // THE CALLBACKS LIVE IN A REF, AND THE SUBSCRIPTION DEPENDS ONLY ON THE KEY.
  //
  // They arrive as inline arrows — `onComplete={() => refresh()}` — which are
  // a new function identity on every render of the host. With them in the
  // effect's dependency list, every render tore the subscription down and
  // rebuilt it; and because a stream with no listeners left is CLOSED, and its
  // ticket is single-use, each rebuild opened a new connection and spent a new
  // ticket. Pressing Build produced three of each: one for the busy state, one
  // for the completion, one for the refresh that followed it.
  //
  // A ref keeps the latest callbacks reachable without making the subscription
  // depend on their identity — so the stream is opened once and stays open
  // while the key is unchanged, which is the entire point of sharing it.
  const handlers = useRef({ onComplete: onComplete, onError: onError });
  handlers.current = { onComplete: onComplete, onError: onError };

  useEffect(() => {
    if (!eventKey) return undefined;
    let alive = true;
    let timer = null;

    const stop = subscribeToProgress(eventKey, (evt) => {
      if (!alive) return;

      if (evt.state === 'complete') {
        setState({ status: 'complete', message: describeComplete(evt.data, noun) });
        handlers.current.onComplete?.(evt.data);
        // Cleared after a moment unless asked to stay: a finished line that
        // never goes reads, an hour later, as if it were still happening.
        if (!keepFinal) timer = setTimeout(() => { if (alive) setState(null); }, finalMs);
        return;
      }

      if (evt.state === 'error') {
        // The REASON, kept on screen. An error that clears itself is one the
        // user is told about only if they happened to be looking.
        setState({
          status: 'error',
          message: (evt.data && (evt.data.error || evt.data.message)) ||
                   ('The ' + (noun || 'task') + ' could not be finished')
        });
        handlers.current.onError?.(evt.data);
        return;
      }

      setState({ status: 'running', message: describeProgress(evt.data, noun) });
    });

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      stop();
    };
  // ONLY the key and the presentation options. Not the callbacks — see above.
  }, [eventKey, noun, keepFinal, finalMs]);

  if (!state) return idle;

  return (
    <div
      className={`xpn xpn--${state.status} ${className}`.trim()}
      // Announced to a screen reader as it changes, but politely — this is
      // status, not an alert, and it must not interrupt what is being read.
      role="status"
      aria-live="polite"
    >
      {state.status === 'running' && (
        <div className="xpn-bar" aria-hidden="true"><span /></div>
      )}
      <p className="xpn-text">{state.message}</p>
    </div>
  );
}
