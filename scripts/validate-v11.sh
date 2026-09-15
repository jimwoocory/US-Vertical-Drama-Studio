#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
skills="$root/plugins/us-vertical-drama-studio/skills"
fixture="$root/plugins/us-vertical-drama-studio/fixtures/v1.1-ep01-storyboard-packet.md"

expected=(us-vertical-drama-studio us-vertical-drama-adapter us-vertical-drama-showrunner us-vertical-drama-episode-architect us-vertical-drama-screenwriter us-vertical-drama-script-doctor us-vertical-drama-continuity-editor us-vertical-drama-storyboard-director)
for skill in "${expected[@]}"; do
  test -f "$skills/$skill/SKILL.md"
  rg -q "^name: $skill$" "$skills/$skill/SKILL.md"
  test -f "$root/direct-upload/chatgpt/$skill/SKILL.md"
  test -f "$root/direct-upload/claude/$skill/skill.md"
  cmp -s "$skills/$skill/SKILL.md" "$root/direct-upload/chatgpt/$skill/SKILL.md"
  cmp -s "$skills/$skill/SKILL.md" "$root/direct-upload/claude/$skill/skill.md"
done

for label in '【场景】' '【人物】' '【动作】' '【情绪/内心】' '【台词】'; do rg -Fq "$label" "$skills/us-vertical-drama-screenwriter/SKILL.md"; done
for label in '【镜头】' '【时长】' '【关联场景】' '【画面/构图】' '【角色与服装】' '【场景】' '【道具】' '【动作与情绪】' '【镜头运动】' '【连续性进/出】' '【视频生成提示词】' '【负面约束】'; do rg -Fq "$label" "$skills/us-vertical-drama-storyboard-director/SKILL.md"; done
for token in 'CHAR-01' 'LOOK-01A' 'SET-01' 'PROP-01' 'Asset Lock Prompt' 'Shot Delta Prompt' 'Seedance 2.0' 'mediago_import_row'; do rg -Fq "$token" "$fixture"; done
rg -Fq 'dialogue-function audit' "$skills/us-vertical-drama-script-doctor/SKILL.md"
rg -Fq 'target locale/world' "$skills/us-vertical-drama-script-doctor/SKILL.md"
rg -Fq 'scene-unit-template.md' "$skills/us-vertical-drama-episode-architect/SKILL.md"

echo "v1.1 validation PASS: 8 skills, 2 direct-upload surfaces, screenplay contract, storyboard asset/prompt contract, and EP01 fixture."
