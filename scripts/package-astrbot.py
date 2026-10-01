"""Build a root-level AstrBot plugin ZIP from canonical writing resources."""

import argparse
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = (
    "controller",
    "01-adaptation",
    "02-story-architecture",
    "03-screenwriter",
    "04-review-continuity",
    "05-asset-lock",
    "06-storyboard",
    "07-performance-cinematography",
    "08-seedance-2-mini-adapter",
    "09-prompt-qa",
)
RESOURCES = {
    "06-storyboard": ["contracts/stage-06-storyboard.json"],
    "07-performance-cinematography": [
        "contracts/stage-07-performance-cinematography.json"
    ],
    "08-seedance-2-mini-adapter": ["contracts/stage-08-seedance-2-mini-adapter.json"],
    "09-prompt-qa": [
        "contracts/stage-09-prompt-qa.json",
        "references/prompt-qa-human-checklist.md",
    ],
}


def build(output: Path):
    files = [
        (ROOT / "astrbot-plugin" / name, name)
        for name in ("main.py", "metadata.yaml", "README.md")
    ]
    files.append((ROOT / "LICENSE", "LICENSE"))
    notice = ROOT / "NOTICE"
    if notice.is_file():
        files.append((notice, "NOTICE"))
    for skill in SKILLS:
        source = ROOT / "core/usvd-v9/skills" / skill
        skill_name = (
            re.search(
                r"^name: (.+)$", (source / "SKILL.md").read_text(encoding="utf-8"), re.MULTILINE
            )
            .group(1)
            .strip()
        )
        for f in sorted(source.rglob("*")):
            if f.is_file() and f.suffix == ".md":
                files.append(
                    (f, "skills/" + skill_name + "/" + f.relative_to(source).as_posix())
                )
        for resource in RESOURCES.get(skill, []):
            f = ROOT / "core/usvd-v9" / resource
            files.append((f, "skills/" + skill_name + "/references/" + f.name))
        if not (source / "SKILL.md").is_file():
            raise FileNotFoundError(source / "SKILL.md")
    # Read every source before creating the output, so a missing source cannot
    # leave behind an apparently usable partial archive.
    contents = [(name, path.read_bytes()) for path, name in files]
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in contents:
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 2, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    print(f"Built {output} ({len(contents)} files)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    build(parser.parse_args().output.resolve())
