# resolution-demo — design

30s silent HyperFrames composition for the delapan.ai landing page. Subject: write-time fact
resolution (ADD / UPDATE / NOOP / SUPERSEDE) and non-destructive retirement (`invalidated_at`,
`superseded_by`).

## Palette

Copied verbatim from `src/styles/site.css` (`--p8-*` custom properties):

```
ink        #0B0F14   background
bone       #F7F6F2   figure on dark / primary text on dark
coral      #FF6B4A   THE accent — one hot colour, used once
muted      #6B7785   secondary text, metadata
positive   #1F9D6B   the surviving fact
critical   #C2453B   the contradiction arriving

display    Space Grotesk    headings
mono       JetBrains Mono   field names, ids, verdicts
```

Field names (`grounded_in`, `invalidated_at`, `superseded_by`) and the four verdicts
(`add` / `update` / `noop` / `supersede`) render in **mono**. Prose renders in **display**.

`coral` is used exactly once in the whole 30s: on the `supersede` verdict lighting up in beat 3.

## Storyboard (30s @ 1920x1080)

| Time | Beat | On screen |
|---|---|---|
| 0:00–0:04 | Title | "you already know something." |
| 0:04–0:12 | The held fact | A card: a claim, and beneath it `grounded_in` with its source. Calm, `bone` on `ink`. |
| 0:12–0:20 | The contradiction | A second card slides in, marked in `critical`. The four verdicts `add`/`update`/`noop`/`supersede` appear in mono; three stay dim, `supersede` lights in `coral`. |
| 0:20–0:27 | The payload | The old card does not disappear. It dims, gains `invalidated_at`, and a line draws from it to the new card labelled `superseded_by`. Both cards remain on screen together. |
| 0:27–0:30 | End | Wordmark + "nothing is deleted. only retired." |

Beat 4 is the argument: both cards visible simultaneously at 0:27, old card stamped
`invalidated_at` and linked to the new one via `superseded_by`.

Constraints: no numbers that aren't literal field names, no sound, no live-graph footage
(unshipped feature).
