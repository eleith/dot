# context

a little more room for the task that needs it. a little less for everything else.

## why

sometimes compaction is helpful. sometimes i am still using all those details.

## how to use

run `/eleith context` to see status without changing anything.

- `/eleith context extend` — use the extended window
- `/eleith context restore` — restore the standard window

`/context-window [extend|restore]` does the same thing without the rest of
these extensions. bare `/context-window` shows status too. copy just this folder
into your Pi extensions directory to use it on its own. don't install both
copies at once. there are no keyboard shortcuts.

## how much room

Codex GPT-6 Sol and Astra get a **922,000-token** extended window. both models
list 1,050,000 total context and 128,000 maximum output tokens; this leaves that
output room instead of treating the whole total as usable input. Pi still
applies its own compaction reserve.

sources: [Sol](https://developers.openai.com/api/docs/models/gpt-6-sol) and
[Astra](https://developers.openai.com/api/docs/models/gpt-6-astra).

these are conservative local windows, not verified server limits or a promise
that your Codex account accepts that much input. larger requests can consume
more allowance. the API's long-context pricing is not the same thing as
subscription billing.

other models are left alone. only these two Codex models are allowlisted in
`profiles.ts`; no guessing about future models or providers.

## what stays put

- the real model id, provider, output limit, and thinking level
- your catalog and `models.json` — nothing is written there
- Pi's normal compaction and overflow recovery

standard means the window the model already had, including your overrides.
extended never shrinks an already larger window.

choices belong to each model on the current session branch. they survive
compaction, `/reload`, resume, and forks that include the choice. a new session
starts standard. removing this extension leaves the ordinary model window.

when `/tree` would restore a smaller window, the check happens at the next idle
prompt. it still asks first. declining, or having too much history to fit, keeps
extended context on that branch instead.

changes wait for you to finish the current run: the command refuses changes
while Pi is busy. reducing the window asks first, because it may cause compaction
on the next prompt. if the history already exceeds the smaller window, run
`/compact` while the context is extended, then try again. cancelling changes
nothing. status remains read-only, even while Pi is busy.

## what you see

changes confirm the new window. bare `/eleith context` or `/context-window`
groups the details into:

- **window** — usage such as `100k / 272k`, standard, and extended (or not configured)
- **compaction** — count on the current branch, with time since the last one or never
- **cache · last assistant request** — cached input read / total input, plus positive
  cache writes when reported; not reported when no usable report exists

cache reports describe the last assistant request, not live cache residency.
compaction summaries and cache-warming requests are separate and aren't included.
if that request used a different model, its identity is shown. Pi sometimes turns
missing cache counts into zeros, so zero reads are shown as `none reported`, not
as a confirmed cache miss. cached tokens still take up context space.

fractions use compact `k` counts, not percentages. for example:

```text
context · openai-codex/gpt-6-astra

  window
    Usage             120k / 922k
    Standard          272k
    Extended          922k (local window)

  compaction
    Compactions       2 on this branch
    Last compacted    8 minutes ago

  cache · last assistant request
    Cached input      108k / 118k input tokens
```

[compact editor chrome](../compact-editor-chrome/README.md), if installed, reads
Pi's actual usage and window and shows `Context: 120k/922k`. neither extension
imports the other. no extra badge, no extra line.
