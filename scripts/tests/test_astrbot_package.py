"""Exercise the delivered archive, not a separately staged plugin tree."""

import asyncio
import importlib.util
import re
import subprocess
import sys
import tempfile
import types
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
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


class PackageTests(unittest.TestCase):
    def test_installable_archive_and_resources(self):
        script = ROOT / "scripts/package-astrbot.py"
        self.assertTrue(script.is_file(), "AstrBot packager is missing")
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "plugin.zip"
            subprocess.run(
                [sys.executable, str(script), "--output", str(archive)], check=True
            )
            with zipfile.ZipFile(archive) as z:
                self.assertIsNone(z.testzip())
                self.assertIn("main.py", z.namelist())
                self.assertIn("metadata.yaml", z.namelist())
                self.assertIn("LICENSE", z.namelist())
                self.assertFalse(any(".." in Path(n).parts for n in z.namelist()))
                self.assertEqual(sum(n.endswith("/SKILL.md") for n in z.namelist()), 10)
                for skill in SKILLS:
                    original = ROOT / "core/usvd-v9/skills" / skill
                    skill_name = (
                        re.search(
                            r"^name: (.+)$",
                            (original / "SKILL.md").read_text(encoding="utf-8"),
                            re.MULTILINE,
                        )
                        .group(1)
                        .strip()
                    )
                    for f in original.rglob("*"):
                        if f.is_file():
                            name = (
                                "skills/"
                                + skill_name
                                + "/"
                                + f.relative_to(original).as_posix()
                            )
                            self.assertEqual(z.read(name), f.read_bytes(), name)
                    name = "skills/" + skill_name + "/SKILL.md"
                    for link in re.findall(
                        r"\]\((references/[^)]+)\)", z.read(name).decode("utf-8")
                    ):
                        self.assertIn("skills/" + skill_name + "/" + link, z.namelist())
                for stage in (
                    "06-storyboard",
                    "07-performance-cinematography",
                    "08-seedance-2-mini-adapter",
                    "09-prompt-qa",
                ):
                    contract = (
                        ROOT / "core/usvd-v9/contracts" / ("stage-" + stage + ".json")
                    )
                    self.assertEqual(
                        z.read(
                            "skills/usvd-v9-" + stage + "/references/" + contract.name
                        ),
                        contract.read_bytes(),
                    )
                checklist = (
                    ROOT / "core/usvd-v9/references/prompt-qa-human-checklist.md"
                )
                self.assertEqual(
                    z.read("skills/usvd-v9-09-prompt-qa/references/" + checklist.name),
                    checklist.read_bytes(),
                )
                z.extractall(tmp)
            # Framework boundary is stubbed; actual packaged module is imported.
            event_module = types.ModuleType("astrbot.api.event")
            event_module.AstrMessageEvent = object
            event_module.filter = types.SimpleNamespace(
                command=lambda name: lambda f: f
            )
            star_module = types.ModuleType("astrbot.api.star")

            class Star:
                def __init__(self, context):
                    self.context = context

            star_module.Star = Star
            star_module.Context = object
            api = types.ModuleType("astrbot.api")
            api.logger = types.SimpleNamespace(error=lambda *a: None)
            modules = {
                "astrbot": types.ModuleType("astrbot"),
                "astrbot.api": api,
                "astrbot.api.event": event_module,
                "astrbot.api.star": star_module,
            }
            old = {key: sys.modules.get(key) for key in modules}
            sys.modules.update(modules)
            try:
                spec = importlib.util.spec_from_file_location(
                    "packaged_usvd", Path(tmp) / "main.py"
                )
                plugin = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(plugin)

                class Context:
                    def __init__(self):
                        self.calls = []
                        self.provider = "configured-model"
                        self.fail = False

                    async def get_current_chat_provider_id(self, *, umo):
                        return self.provider

                    async def llm_generate(self, **kwargs):
                        self.calls.append(kwargs)
                        if self.fail:
                            raise RuntimeError("secret-provider-key")
                        return types.SimpleNamespace(completion_text="Actual reply")

                class Event:
                    unified_msg_origin = "test:private:123"

                    def __init__(self, message):
                        self.message_str = message

                    def plain_result(self, text):
                        return text

                async def run():
                    context = Context()
                    main = plugin.Main(context)

                    async def invoke(message):
                        return [r async for r in main.usvd(Event(message))]

                    self.assertIn("bible", (await invoke("/usvd"))[0])
                    self.assertIn(
                        "bible", (await invoke("/usvd unknown some input"))[0]
                    )
                    self.assertEqual(context.calls, [])
                    for stage, skill in [
                        ("adapt", "01-adaptation"),
                        ("bible", "02-story-architecture"),
                        ("beats", "02-story-architecture"),
                        ("write", "03-screenwriter"),
                        ("review", "04-review-continuity"),
                        ("route", "controller"),
                        ("assets", "05-asset-lock"),
                        ("storyboard", "06-storyboard"),
                        ("camera", "07-performance-cinematography"),
                        ("seedance", "08-seedance-2-mini-adapter"),
                        ("qa", "09-prompt-qa"),
                    ]:
                        self.assertEqual(
                            await invoke("/usvd " + stage + " First line\nsecond line"),
                            ["Actual reply"],
                        )
                        request = context.calls[-1]
                        self.assertEqual(
                            request["chat_provider_id"], "configured-model"
                        )
                        self.assertEqual(request["prompt"], "First line\nsecond line")
                        skill_text = (
                            ROOT / "core/usvd-v9/skills" / skill / "SKILL.md"
                        ).read_text(encoding="utf-8")
                        self.assertIn(skill_text, request["system_prompt"])
                        if stage in (
                            "assets",
                            "storyboard",
                            "camera",
                            "seedance",
                            "qa",
                        ):
                            self.assertNotIn(
                                "不生成界面、资产、分镜或视频提示词",
                                request["system_prompt"],
                            )
                        if stage in ("storyboard", "camera", "seedance", "qa"):
                            contract = (
                                ROOT
                                / "core/usvd-v9/contracts"
                                / ("stage-" + skill + ".json")
                            )
                            self.assertIn(
                                contract.read_text(encoding="utf-8"),
                                request["system_prompt"],
                            )
                        for ref in (
                            ROOT / "core/usvd-v9/skills" / skill / "references"
                        ).glob("*.md"):
                            self.assertIn(
                                ref.read_text(encoding="utf-8"),
                                request["system_prompt"],
                            )
                    before = len(context.calls)
                    await invoke("/usvd write")
                    self.assertEqual(len(context.calls), before)
                    context.provider = None
                    self.assertIn("模型", (await invoke("/usvd bible input"))[0])
                    self.assertEqual(len(context.calls), before)
                    context.provider = "configured-model"
                    before = len(context.calls)
                    await invoke("/usvd bible " + "x" * 100_001)
                    self.assertEqual(len(context.calls), before)
                    context.fail = True
                    error = (await invoke("/usvd bible input"))[0]
                    self.assertNotIn("secret-provider-key", error)

                asyncio.run(run())
            finally:
                for key, value in old.items():
                    if value is None:
                        sys.modules.pop(key, None)
                    else:
                        sys.modules[key] = value


if __name__ == "__main__":
    unittest.main()
