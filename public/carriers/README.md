# Carrier logos

Drop a file here named after the shipping method and checkout uses it instead
of the coloured wordmark:

    topship.svg
    gig.svg
    dhl.svg

SVG is preferred; the badge renders at 24px tall and keeps its aspect ratio.
Nothing needs changing in the code — the mark falls back to a wordmark on its
brand colours whenever the file is missing, so an empty folder is fine.

The wordmarks are deliberate. Shipping a carrier's own artwork is a licence
they grant, not one we can assume, and you are the one with the relationship
with these couriers. If your agreement with them covers using the logo, put
the file here.

Brand colours currently used for the fallback, in `src/lib/shipping.ts`:

| Carrier       | Background | Text      |
| ------------- | ---------- | --------- |
| DHL           | `#FFCC00`  | `#D40511` |
| GIG Logistics | `#E8112D`  | `#FFFFFF` |
| Topship       | `#1B2A4E`  | `#FFFFFF` |

DHL's pair is their published one. The other two were matched by eye — correct
them in `src/lib/shipping.ts` if you have the real brand values.
