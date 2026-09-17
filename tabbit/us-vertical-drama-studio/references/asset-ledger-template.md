# Visual Asset Ledger Template

## Character

`CHAR-01` — English name; age/presentation; face and hair anchors; body/silhouette; recurring identity markers; approved reference image ID/path if supplied; image prompt; negative prompt; aspect ratio; target image model/seed if supplied; approval state.

## Costume / look

`LOOK-01A` — linked character ID; garment layers; palette/material; footwear; accessories; condition; episode/scene range; transition trigger; image prompt; negative prompt; reference image ID/path if supplied; aspect ratio; target image model/seed if supplied; approval state.

## Scene / set

`SET-01` — place and geography; time/weather/light; key set dressing; visual anchors; screen-direction constraints; episode/scene range; establishing-image prompt; negative prompt; reference image ID/path if supplied; aspect ratio; target image model/seed if supplied; approval state.

## Hero prop

`PROP-01` — form/material/scale; condition; owner or holder; current location; narrative function; state changes; episode/scene range; isolated-image prompt; negative prompt; reference image ID/path if supplied; aspect ratio; target image model/seed if supplied; approval state.

## Shot linkage

`SHOT-01` — source scene; range; `CHAR-*`; `LOOK-*`; `SET-*`; `PROP-*`; asset-lock prompt; shot-delta prompt; negative/do-not-change; prompt ID; continuity in/out; screen direction; entry/exit and prop handoff notes.
