from __future__ import annotations

from enum import StrEnum


class DocumentQAMode(StrEnum):
    EXPLAIN = "explain"
    SUMMARIZE = "summarize"
    COMPARE = "compare"
    QUIZ_ME = "quiz_me"
    CREATE_FLASHCARDS = "create_flashcards"
    EXTRACT_TASKS = "extract_tasks"
    CREATE_STUDY_NOTES = "create_study_notes"
    IDENTIFY_CONTRADICTIONS = "identify_contradictions"


class DocumentQAEvidenceStatus(StrEnum):
    SUPPORTED = "supported"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
