# V9 Prompt QA — Human Review Checklist

Use only after machine QA has no unresolved blocker. Record `pass | fail | pending` plus evidence for every item.

## Hook / visual readability
- 0–3s contains a visible information change, action, or reaction.
- The viewer can understand the immediate visual event without production notes.
- Each SHOT has one dominant visual job.

## Performance
- Emotion is expressed through observable behavior rather than adjective-only direction.
- Reaction beats show a readable transition such as notice → process → decide.
- Gesture and micro-expression do not repeat mechanically across adjacent shots.

## Cinematography
- Camera movement is motivated by action, information, emotion, or spatial clarification.
- Vertical composition gives the most important information clear visual priority.
- Adjacent shots do not repeat the same slow push / stare / hold rhythm without escalation.
- Focus and lighting changes correspond to an actual narrative change.

## Prompt layering
- VIDEO master independently describes the complete sequence.
- SHOT delta contains only local changes and does not restate the whole VIDEO master.
- Negative constraints protect identity/continuity rather than mirror the whole positive prompt.

## Continuity
- Character identity and LOOK remain stable.
- PROP holder/state and SET anchors remain stable unless a visible transition exists.
- Screen direction, eyeline, entrance/exit and character position remain coherent.
- Wounds, time, weather and environmental state do not reset without cause.

## Audio / dialogue
- Approved English dialogue is unchanged.
- Dialogue and visible performance can fit inside the planned time.
- External voice/lip-sync/SFX ownership is explicit when the endpoint does not natively execute it.

## AI artifact watch
- No unexplained extra characters or props.
- No duplicated props or hands changing ownership.
- No identity, wardrobe, hairstyle or location drift.
- No causally meaningless micro-actions inserted just to create motion.
- No spatial jump that breaks the established geography.

## Golden-case record
For regression review, additionally record:
- baseline machine defect count by severity;
- V9 machine defect count by severity;
- baseline human-review status;
- V9 human-review status;
- exact V9 rule responsible for each material change;
- generated-video review as `pending` unless the actual rendered videos have been viewed.
