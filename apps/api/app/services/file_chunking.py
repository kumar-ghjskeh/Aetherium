from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.services.file_extractors import ExtractedDocument, ExtractedSection


@dataclass(frozen=True)
class ChunkDraft:
    chunk_text: str
    page_number: int | None
    search_text: str
    section_label: str | None
    sequence_number: int
    source_metadata: dict[str, Any]
    token_estimate: int


class FileChunker:
    def __init__(self, *, max_chars: int, overlap_chars: int):
        if max_chars < 1:
            raise ValueError("max_chars must be positive")
        if overlap_chars < 0 or overlap_chars >= max_chars:
            raise ValueError("overlap_chars must be nonnegative and smaller than max_chars")
        self.max_chars = max_chars
        self.overlap_chars = overlap_chars

    def chunk(self, document: ExtractedDocument) -> list[ChunkDraft]:
        chunks: list[ChunkDraft] = []
        for section in document.sections:
            chunks.extend(self._chunk_section(section, start_sequence=len(chunks)))
        return chunks

    def _chunk_section(self, section: ExtractedSection, *, start_sequence: int) -> list[ChunkDraft]:
        text = " ".join(section.text.split())
        if not text:
            return []

        chunks: list[ChunkDraft] = []
        start = 0
        sequence = start_sequence
        while start < len(text):
            end = min(len(text), start + self.max_chars)
            if end < len(text):
                split_at = text.rfind(" ", start, end)
                if split_at > start + int(self.max_chars * 0.55):
                    end = split_at

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(
                    ChunkDraft(
                        chunk_text=chunk_text,
                        page_number=section.page_number,
                        search_text=chunk_text.casefold(),
                        section_label=section.section_label,
                        sequence_number=sequence,
                        source_metadata={
                            **section.metadata,
                            "charEnd": end,
                            "charStart": start,
                        },
                        token_estimate=max(1, len(chunk_text) // 4),
                    )
                )
                sequence += 1

            if end >= len(text):
                break
            start = max(end - self.overlap_chars, start + 1)

        return chunks
