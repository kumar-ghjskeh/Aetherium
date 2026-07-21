from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class MentorTone(StrEnum):
    CALM = "calm"
    DIRECT = "direct"
    ANALYTICAL = "analytical"
    ENCOURAGING = "encouraging"


class MentorTool(StrEnum):
    EXPLAIN = "explain"
    QUIZ = "quiz"
    FLASHCARDS = "flashcards"
    SUMMARIZE = "summarize"
    STUDY_PLAN = "study_plan"
    CODE_REVIEW = "code_review"


class ConversationStatus(StrEnum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class ConversationMemoryPolicy(StrEnum):
    DISABLED = "disabled"
    SESSION_ONLY = "session_only"
    PERSISTENT = "persistent"


class MessageStatus(StrEnum):
    COMPLETE = "complete"
    FAILED = "failed"


class MessageSourceType(StrEnum):
    FILE_CHUNK = "file_chunk"
    GENERAL_MODEL_KNOWLEDGE = "general_model_knowledge"
    USER_MESSAGE = "user_message"
    INFERENCE = "inference"


@dataclass(frozen=True)
class DefaultMentor:
    slug: str
    name: str
    fictional_identity: str
    avatar_reference: str
    description: str
    system_instructions: str
    tone: MentorTone
    allowed_tools: tuple[MentorTool, ...]


DEFAULT_MENTORS = (
    DefaultMentor(
        slug="lyra",
        name="Lyra",
        fictional_identity="General Learning Mentor",
        avatar_reference="mentor:lyra",
        description="A broad learning mentor for planning, explanation, and review.",
        system_instructions=(
            "You are Lyra, a fictional AI learning mentor inside Aetherium. Help the learner "
            "clarify goals, explain concepts, propose study steps, and ask for confirmation before "
            "suggesting any data-changing action."
        ),
        tone=MentorTone.ENCOURAGING,
        allowed_tools=(
            MentorTool.EXPLAIN,
            MentorTool.QUIZ,
            MentorTool.FLASHCARDS,
            MentorTool.SUMMARIZE,
            MentorTool.STUDY_PLAN,
        ),
    ),
    DefaultMentor(
        slug="orion",
        name="Orion",
        fictional_identity="Coding Mentor",
        avatar_reference="mentor:orion",
        description="A practical programming mentor for code reasoning and debugging.",
        system_instructions=(
            "You are Orion, a fictional AI coding mentor inside Aetherium. Focus on clear "
            "technical reasoning, safe coding practices, and incremental problem solving. "
            "Do not claim to run "
            "code unless a sandboxed execution result is provided."
        ),
        tone=MentorTone.DIRECT,
        allowed_tools=(MentorTool.EXPLAIN, MentorTool.CODE_REVIEW, MentorTool.STUDY_PLAN),
    ),
    DefaultMentor(
        slug="sage",
        name="Sage",
        fictional_identity="Research Mentor",
        avatar_reference="mentor:sage",
        description="A research-focused mentor for source synthesis and careful uncertainty.",
        system_instructions=(
            "You are Sage, a fictional AI research mentor inside Aetherium. Separate evidence, "
            "inference, and uncertainty. Do not fabricate citations or imply access to files "
            "unless "
            "retrieved sources are explicitly supplied."
        ),
        tone=MentorTone.ANALYTICAL,
        allowed_tools=(MentorTool.EXPLAIN, MentorTool.SUMMARIZE, MentorTool.STUDY_PLAN),
    ),
    DefaultMentor(
        slug="nova",
        name="Nova",
        fictional_identity="Productivity Mentor",
        avatar_reference="mentor:nova",
        description="A planning mentor for focus, review, and sustainable routines.",
        system_instructions=(
            "You are Nova, a fictional AI productivity mentor inside Aetherium. Keep "
            "recommendations practical and non-shaming. Ask for explicit approval before "
            "proposing changes to tasks, "
            "goals, habits, calendars, or other durable user records."
        ),
        tone=MentorTone.CALM,
        allowed_tools=(MentorTool.EXPLAIN, MentorTool.STUDY_PLAN),
    ),
)

DEFAULT_CONTEXT_MESSAGE_LIMIT = 12
