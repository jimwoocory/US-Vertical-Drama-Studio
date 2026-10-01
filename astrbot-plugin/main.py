"""USVD chat entry point. Native Skills are also supplied in skills/."""

import asyncio
from pathlib import Path

from astrbot.api import logger
from astrbot.api.event import AstrMessageEvent, filter
from astrbot.api.star import Context, Star

HELP = """USVD 美国短剧写作（技能 2.1.0）
/usvd adapt 原作素材与改编要求
/usvd bible 原创设定或改编 Brief
/usvd beats 已批准的 Story Bible 正文与目标集要求
/usvd write 已批准的 Bible、Beat Sheet、目标集时长及前集连续性
/usvd review 剧本正文、已批准的 Bible 与 Beat Sheet

每条指令只执行一个阶段。指令模式不会读取其他聊天或自动保存项目，
请把所需正文放在同一条消息中，可换行粘贴。确认后再进入下一阶段。
原生 Skills 模式可在同一会话中自然对话，配置方式见安装包 README。
"""

STAGES = {
    "adapt": ("01-adaptation", "只做美国本土化 Adaptation Brief。"),
    "bible": (
        "02-story-architecture",
        "只执行 Mode A：Story Bible；不得连做 Beat Sheet。",
    ),
    "beats": (
        "02-story-architecture",
        "只执行 Mode B：Beat Sheet；必须核对已批准 Bible 正文。",
    ),
    "write": ("03-screenwriter", "只写指定集正式剧本；不得自评 PASS 或输出制作资产。"),
    "review": (
        "04-review-continuity",
        "独立审稿；缺已批准上游正文时 BLOCKED，不得编造。",
    ),
}


class Main(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        self.root = Path(__file__).resolve().parent

    @filter.command("usvd")
    async def usvd(self, event: AstrMessageEvent):
        """Run one writing stage with the current AstrBot chat provider."""
        parts = event.message_str.strip().split(maxsplit=2)
        stage = parts[1].lower() if len(parts) > 1 else "help"
        if stage not in STAGES or len(parts) < 3 or not parts[2].strip():
            yield event.plain_result(HELP)
            return
        material = parts[2]
        if len(material) > 100_000:
            yield event.plain_result("素材超过 100,000 字符，请只提供本阶段所需正文。")
            return
        try:
            provider = await self.context.get_current_chat_provider_id(
                umo=event.unified_msg_origin
            )
            if not provider:
                yield event.plain_result(
                    "请先在 AstrBot 配置并选择当前会话的聊天模型。"
                )
                return
            skill, scope = STAGES[stage]
            folder = self.root / "skills" / f"usvd-{skill}"
            instruction = (folder / "SKILL.md").read_text(encoding="utf-8")
            references = "\n\n".join(
                f"# Reference: references/{ref.name}\n{ref.read_text(encoding='utf-8')}"
                for ref in sorted((folder / "references").glob("*.md"))
            )
            system = (
                "你是 USVD 美国竖屏短剧写作助手。仅执行用户选择的当前阶段。\n"
                "不生成界面、资产、分镜或视频提示词。缺必要输入时按技能要求询问或 BLOCKED。\n"
                "审稿分数是内部启发式，不能声称已做真实观众或商业验证。\n"
                f"本次阶段：{stage}。{scope}\n\n{instruction}\n\n{references}"
            )
            response = await asyncio.wait_for(
                self.context.llm_generate(
                    chat_provider_id=provider,
                    prompt=material,
                    system_prompt=system,
                ),
                timeout=180,
            )
            text = response.completion_text
            if not text or not text.strip():
                yield event.plain_result("模型没有返回正文，请重试或检查模型配置。")
                return
            yield event.plain_result(text)
        except TimeoutError:
            yield event.plain_result("写作请求超时，请缩小本次素材或稍后重试。")
        except Exception as exc:  # noqa: BLE001 -- provider exceptions vary by adapter
            # Do not echo provider errors or potentially sensitive request bodies.
            logger.error("USVD writing request failed (%s)", type(exc).__name__)
            yield event.plain_result(
                "本次写作请求失败，请检查模型连接和插件日志后重试。"
            )
