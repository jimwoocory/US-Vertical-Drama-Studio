"""USVD chat entry point. Native Skills are also supplied in skills/."""

import asyncio
from pathlib import Path

from astrbot.api import logger
from astrbot.api.event import AstrMessageEvent, filter
from astrbot.api.star import Context, Star

HELP = """USVD 美国短剧全流程（总控 + 01–09，共10个技能）
/usvd route 项目材料、交付范围与当前批准状态
/usvd adapt 原作素材与改编要求
/usvd bible 原创设定或改编 Brief
/usvd beats 已批准的 Story Bible 正文与目标集要求
/usvd write 已批准的 Bible、Beat Sheet、目标集时长及前集连续性
/usvd review 剧本正文、已批准的 Bible 与 Beat Sheet
/usvd assets 已审核剧本、连续性台账与资产要求
/usvd storyboard 已锁定资产、审核剧本与连续性台账
/usvd camera 已批准 Stage 06 分镜与资产台账
/usvd seedance 已批准 Stage 06/07 包与当前 endpoint 能力档案
/usvd qa Stage 06/07/08 包、资产台账与能力档案

每条指令只执行一个阶段。指令模式不会读取其他聊天或自动保存项目，
请把所需正文放在同一条消息中，可换行粘贴。确认后再进入下一阶段。
原生 Skills 模式可在同一会话中自然对话，配置方式见安装包 README。
"""

STAGES = {
    "route": ("controller", "只识别当前 Gate 并指定唯一下一技能，不代做阶段。"),
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
    "assets": (
        "05-asset-lock",
        "只锁定 CHAR/LOOK/SET/PROP 资产与图像提示词，不做分镜。",
    ),
    "storyboard": ("06-storyboard", "只做 Stage 06 分镜与时序，不写最终视频提示词。"),
    "camera": ("07-performance-cinematography", "只做 Stage 07 表演与摄影导演包。"),
    "seedance": (
        "08-seedance-2-mini-adapter",
        "只做 Stage 08 Seedance 2.0 Mini 提示词适配；不调用视频生成服务。",
    ),
    "qa": (
        "09-prompt-qa",
        "只做 Stage 09 QA 诊断。没有真实机器检查结果时标记 NOT RUN/BLOCKED，不得声称机器 QA PASS。",
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
            name = (
                f"usvd-v9-{skill}"
                if skill[:2] in ("06", "07", "08", "09")
                else f"usvd-{skill}"
            )
            folder = self.root / "skills" / name
            instruction = (folder / "SKILL.md").read_text(encoding="utf-8")
            references = "\n\n".join(
                f"# Reference: references/{ref.name}\n{ref.read_text(encoding='utf-8')}"
                for ref in sorted((folder / "references").glob("*"))
                if ref.is_file() and ref.suffix in (".md", ".json")
            )
            system = (
                "你是 USVD 美国竖屏短剧全流程助手。仅执行用户选择的当前阶段。\n"
                "不生成工作界面。不跨阶段连跑。缺必要输入时按技能要求询问或 BLOCKED。\n"
                "提供制作文档与提示词，不宣称已经生成图像/视频或执行机器检查。\n"
                "默认交付范围 full-production；用户明确只要写作时尊重 writing-only。\n"
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
