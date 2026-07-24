from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.domain.file_vault import FileDeletionStatus
from app.domain.foundation import DomainEventType
from app.domain.learning import (
    AttemptStatus,
    CourseStatus,
    FlashcardReviewRating,
    FlashcardStatus,
    LearningGoalStatus,
    LearningRecordStatus,
    LearningResourceType,
    LessonStatus,
    QuizStatus,
    StudyRoadmapStatus,
    StudySessionMode,
)
from app.models.auth import User
from app.models.file_vault import FileRecord
from app.models.learning import (
    Attempt,
    Course,
    CourseModule,
    Flashcard,
    FlashcardReview,
    LearningGoal,
    LearningResource,
    Lesson,
    MasteryRecord,
    Question,
    Quiz,
    StudyRoadmap,
    StudySession,
    Subject,
    Topic,
    TopicRelation,
)
from app.services.foundation import PageResult, UserDataService
from app.services.knowledge import KnowledgeGraphService

MASTERY_WEIGHTS = {
    "quizAccuracy": 0.35,
    "successfulRecall": 0.2,
    "exerciseCompletion": 0.15,
    "confidence": 0.15,
    "reviewRecency": 0.1,
    "projectEvidence": 0.1,
    "hintsPenalty": -0.05,
}


@dataclass(frozen=True)
class MasteryCalculation:
    record: MasteryRecord
    explanation: dict[str, object]


class LearningService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_subject(
        self,
        user: User,
        *,
        name: str,
        description: str | None,
    ) -> Subject:
        normalized_name = _normalize_name(name)
        existing = await self._subject_by_normalized_name(user, normalized_name)
        if existing is not None:
            raise AppError(409, "subject_exists", "A subject with that name already exists.")

        subject = Subject(
            owner_user_id=user.id,
            name=name.strip(),
            normalized_name=normalized_name,
            description=description,
            status=LearningRecordStatus.ACTIVE.value,
        )
        self.db.add(subject)
        await self.db.flush()
        await UserDataService(self.db).record_audit_log(
            user,
            action="learning.subject_created",
            entity_type="subject",
            entity_id=subject.id,
            metadata={"name": subject.name},
        )
        return subject

    async def list_subjects(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        include_archived: bool = False,
    ) -> PageResult[Subject]:
        predicates = [Subject.owner_user_id == user.id]
        if not include_archived:
            predicates.append(Subject.status == LearningRecordStatus.ACTIVE.value)
        total = await self._count(select(func.count(Subject.id)).where(*predicates))
        result = await self.db.execute(
            select(Subject)
            .where(*predicates)
            .order_by(Subject.updated_at.desc(), Subject.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_topic(
        self,
        user: User,
        *,
        name: str,
        description: str | None,
        subject_id: UUID | None,
    ) -> Topic:
        if subject_id is not None:
            await self._get_owned_subject(user, subject_id)
        normalized_name = _normalize_name(name)
        existing = await self._topic_by_normalized_name(user, normalized_name)
        if existing is not None:
            raise AppError(409, "topic_exists", "A topic with that name already exists.")

        topic = Topic(
            owner_user_id=user.id,
            subject_id=subject_id,
            name=name.strip(),
            normalized_name=normalized_name,
            description=description,
            status=LearningRecordStatus.ACTIVE.value,
        )
        self.db.add(topic)
        await self.db.flush()
        await self.recalculate_mastery(user, topic.id)
        await KnowledgeGraphService(self.db).sync_topic(user, topic)
        await UserDataService(self.db).record_audit_log(
            user,
            action="learning.topic_created",
            entity_type="topic",
            entity_id=topic.id,
            metadata={"name": topic.name, "subjectId": str(subject_id) if subject_id else None},
        )
        return topic

    async def list_topics(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        subject_id: UUID | None = None,
        include_archived: bool = False,
    ) -> PageResult[Topic]:
        predicates = [Topic.owner_user_id == user.id]
        if subject_id is not None:
            await self._get_owned_subject(user, subject_id)
            predicates.append(Topic.subject_id == subject_id)
        if not include_archived:
            predicates.append(Topic.status == LearningRecordStatus.ACTIVE.value)
        total = await self._count(select(func.count(Topic.id)).where(*predicates))
        result = await self.db.execute(
            select(Topic)
            .where(*predicates)
            .order_by(Topic.updated_at.desc(), Topic.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def add_prerequisite(
        self,
        user: User,
        *,
        topic_id: UUID,
        prerequisite_topic_id: UUID,
    ) -> TopicRelation:
        if topic_id == prerequisite_topic_id:
            raise AppError(422, "self_prerequisite", "A topic cannot require itself.")
        await self._get_owned_topic(user, topic_id)
        await self._get_owned_topic(user, prerequisite_topic_id)
        result = await self.db.execute(
            select(TopicRelation).where(
                TopicRelation.owner_user_id == user.id,
                TopicRelation.source_topic_id == topic_id,
                TopicRelation.target_topic_id == prerequisite_topic_id,
                TopicRelation.relation_type == "requires",
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing

        relation = TopicRelation(
            owner_user_id=user.id,
            source_topic_id=topic_id,
            target_topic_id=prerequisite_topic_id,
            relation_type="requires",
        )
        self.db.add(relation)
        await self.db.flush()
        await KnowledgeGraphService(self.db).sync_topic_relation(user, relation)
        return relation

    async def create_resource(
        self,
        user: User,
        *,
        title: str,
        resource_type: LearningResourceType,
        subject_id: UUID | None,
        topic_id: UUID | None,
        file_id: UUID | None,
        url: str | None,
        notes: str | None,
    ) -> LearningResource:
        if subject_id is not None:
            await self._get_owned_subject(user, subject_id)
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
        if file_id is not None:
            await self._get_owned_file(user, file_id)
        resource = LearningResource(
            owner_user_id=user.id,
            subject_id=subject_id,
            topic_id=topic_id,
            file_id=file_id,
            title=title.strip(),
            resource_type=resource_type.value,
            url=url,
            notes=notes,
        )
        self.db.add(resource)
        await self.db.flush()
        await KnowledgeGraphService(self.db).sync_learning_resource(user, resource)
        return resource

    async def list_resources(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        topic_id: UUID | None = None,
    ) -> PageResult[LearningResource]:
        predicates = [LearningResource.owner_user_id == user.id]
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
            predicates.append(LearningResource.topic_id == topic_id)
        total = await self._count(select(func.count(LearningResource.id)).where(*predicates))
        result = await self.db.execute(
            select(LearningResource)
            .where(*predicates)
            .order_by(LearningResource.updated_at.desc(), LearningResource.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_course(
        self,
        user: User,
        *,
        title: str,
        description: str | None,
        subject_id: UUID | None,
    ) -> Course:
        if subject_id is not None:
            await self._get_owned_subject(user, subject_id)
        course = Course(
            owner_user_id=user.id,
            subject_id=subject_id,
            title=title.strip(),
            description=description,
            status=CourseStatus.ACTIVE.value,
        )
        self.db.add(course)
        await self.db.flush()
        return course

    async def list_courses(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[Course]:
        predicates = [
            Course.owner_user_id == user.id,
            Course.status != CourseStatus.ARCHIVED.value,
        ]
        total = await self._count(select(func.count(Course.id)).where(*predicates))
        result = await self.db.execute(
            select(Course)
            .where(*predicates)
            .order_by(Course.updated_at.desc(), Course.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def list_modules(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        course_id: UUID | None = None,
    ) -> PageResult[CourseModule]:
        predicates = [CourseModule.owner_user_id == user.id]
        if course_id is not None:
            await self._get_owned_course(user, course_id)
            predicates.append(CourseModule.course_id == course_id)
        total = await self._count(select(func.count(CourseModule.id)).where(*predicates))
        result = await self.db.execute(
            select(CourseModule)
            .where(*predicates)
            .order_by(CourseModule.position.asc(), CourseModule.updated_at.desc(), CourseModule.id)
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_module(
        self,
        user: User,
        course_id: UUID,
        *,
        title: str,
        description: str | None,
        position: int,
    ) -> CourseModule:
        await self._get_owned_course(user, course_id)
        module = CourseModule(
            owner_user_id=user.id,
            course_id=course_id,
            title=title.strip(),
            description=description,
            position=position,
        )
        self.db.add(module)
        await self.db.flush()
        return module

    async def list_lessons(
        self,
        user: User,
        pagination: PaginationParams,
        *,
        module_id: UUID | None = None,
        topic_id: UUID | None = None,
    ) -> PageResult[Lesson]:
        predicates = [Lesson.owner_user_id == user.id]
        if module_id is not None:
            await self._get_owned_module(user, module_id)
            predicates.append(Lesson.module_id == module_id)
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
            predicates.append(Lesson.topic_id == topic_id)
        total = await self._count(select(func.count(Lesson.id)).where(*predicates))
        result = await self.db.execute(
            select(Lesson)
            .where(*predicates)
            .order_by(Lesson.position.asc(), Lesson.updated_at.desc(), Lesson.id)
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_lesson(
        self,
        user: User,
        module_id: UUID,
        *,
        title: str,
        content: str | None,
        topic_id: UUID | None,
        position: int,
        estimated_minutes: int | None,
    ) -> Lesson:
        await self._get_owned_module(user, module_id)
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
        lesson = Lesson(
            owner_user_id=user.id,
            module_id=module_id,
            topic_id=topic_id,
            title=title.strip(),
            content=content,
            status=LessonStatus.ACTIVE.value,
            position=position,
            estimated_minutes=estimated_minutes,
        )
        self.db.add(lesson)
        await self.db.flush()
        await KnowledgeGraphService(self.db).sync_lesson(user, lesson)
        return lesson

    async def complete_lesson(self, user: User, lesson_id: UUID) -> Lesson:
        lesson = await self._get_owned_lesson(user, lesson_id)
        if lesson.status != LessonStatus.COMPLETED.value:
            lesson.status = LessonStatus.COMPLETED.value
            lesson.updated_at = datetime.now(UTC)
            foundation = UserDataService(self.db)
            await foundation.create_domain_event(
                user,
                event_type=DomainEventType.LESSON_COMPLETED,
                idempotency_key=f"lesson.completed:{lesson.id}",
                payload={
                    "lessonId": str(lesson.id),
                    "topicId": str(lesson.topic_id) if lesson.topic_id else None,
                },
            )
            await foundation.record_audit_log(
                user,
                action="learning.lesson_completed",
                entity_type="lesson",
                entity_id=lesson.id,
                metadata={"topicId": str(lesson.topic_id) if lesson.topic_id else None},
            )
            if lesson.topic_id is not None:
                await self.recalculate_mastery(user, lesson.topic_id)
            await self.db.flush()
            await KnowledgeGraphService(self.db).sync_lesson(user, lesson)
        return lesson

    async def create_study_session(
        self,
        user: User,
        *,
        mode: StudySessionMode,
        subject_id: UUID | None,
        topic_id: UUID | None,
        course_id: UUID | None,
        lesson_id: UUID | None,
        started_at: datetime | None,
        notes: str | None,
    ) -> StudySession:
        if subject_id is not None:
            await self._get_owned_subject(user, subject_id)
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
        if course_id is not None:
            await self._get_owned_course(user, course_id)
        if lesson_id is not None:
            await self._get_owned_lesson(user, lesson_id)
        session = StudySession(
            owner_user_id=user.id,
            subject_id=subject_id,
            topic_id=topic_id,
            course_id=course_id,
            lesson_id=lesson_id,
            mode=mode.value,
            started_at=started_at or datetime.now(UTC),
            notes=notes,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def list_study_sessions(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[StudySession]:
        total = await self._count(
            select(func.count(StudySession.id)).where(StudySession.owner_user_id == user.id)
        )
        result = await self.db.execute(
            select(StudySession)
            .where(StudySession.owner_user_id == user.id)
            .order_by(StudySession.started_at.desc(), StudySession.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def end_study_session(
        self,
        user: User,
        session_id: UUID,
        *,
        ended_at: datetime | None,
        notes: str | None,
    ) -> StudySession:
        session = await self._get_owned_study_session(user, session_id)
        resolved_end = _ensure_aware_utc(ended_at or datetime.now(UTC))
        started_at = _ensure_aware_utc(session.started_at)
        session.ended_at = resolved_end
        session.duration_minutes = max(0, int((resolved_end - started_at).total_seconds() // 60))
        if notes is not None:
            session.notes = notes
        session.updated_at = datetime.now(UTC)
        await self.db.flush()
        return session

    async def create_quiz(
        self,
        user: User,
        *,
        title: str,
        topic_id: UUID | None,
        lesson_id: UUID | None,
    ) -> Quiz:
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
        if lesson_id is not None:
            await self._get_owned_lesson(user, lesson_id)
        quiz = Quiz(
            owner_user_id=user.id,
            topic_id=topic_id,
            lesson_id=lesson_id,
            title=title.strip(),
            status=QuizStatus.ACTIVE.value,
        )
        self.db.add(quiz)
        await self.db.flush()
        return quiz

    async def list_quizzes(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[Quiz]:
        predicates = [
            Quiz.owner_user_id == user.id,
            Quiz.status != QuizStatus.ARCHIVED.value,
        ]
        total = await self._count(select(func.count(Quiz.id)).where(*predicates))
        result = await self.db.execute(
            select(Quiz)
            .where(*predicates)
            .order_by(Quiz.updated_at.desc(), Quiz.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def add_question(
        self,
        user: User,
        quiz_id: UUID,
        *,
        question_type: str,
        prompt: str,
        choices: list[str],
        correct_answer: str | None,
        explanation: str | None,
        position: int,
        difficulty: int,
    ) -> Question:
        await self._get_owned_quiz(user, quiz_id)
        question = Question(
            owner_user_id=user.id,
            quiz_id=quiz_id,
            question_type=question_type,
            prompt=prompt,
            choices=choices,
            correct_answer=correct_answer,
            explanation=explanation,
            position=position,
            difficulty=difficulty,
        )
        self.db.add(question)
        await self.db.flush()
        await KnowledgeGraphService(self.db).sync_question(user, question)
        return question

    async def submit_attempt(
        self,
        user: User,
        quiz_id: UUID,
        *,
        question_id: UUID | None,
        score: float,
        max_score: float,
        confidence: int | None,
        hints_used: int,
        submitted_answer: str | None,
        feedback: str | None,
    ) -> Attempt:
        quiz = await self._get_owned_quiz(user, quiz_id)
        if question_id is not None:
            question = await self._get_owned_question(user, question_id)
            if question.quiz_id != quiz_id:
                raise AppError(422, "question_quiz_mismatch", "Question does not belong to quiz.")
        accuracy = _clamp(score / max_score if max_score else 0.0)
        attempt = Attempt(
            owner_user_id=user.id,
            quiz_id=quiz_id,
            question_id=question_id,
            score=score,
            max_score=max_score,
            accuracy=accuracy,
            confidence=confidence,
            hints_used=hints_used,
            status=AttemptStatus.COMPLETED.value,
            submitted_answer=submitted_answer,
            feedback=feedback,
        )
        self.db.add(attempt)
        await self.db.flush()
        foundation = UserDataService(self.db)
        await foundation.create_domain_event(
            user,
            event_type=DomainEventType.QUIZ_COMPLETED,
            idempotency_key=f"quiz.completed:{attempt.id}",
            payload={
                "attemptId": str(attempt.id),
                "quizId": str(quiz.id),
                "topicId": str(quiz.topic_id) if quiz.topic_id else None,
            },
        )
        await foundation.record_audit_log(
            user,
            action="learning.quiz_attempt_submitted",
            entity_type="attempt",
            entity_id=attempt.id,
            metadata={"quizId": str(quiz.id), "accuracy": accuracy, "hintsUsed": hints_used},
        )
        if quiz.topic_id is not None:
            await self.recalculate_mastery(user, quiz.topic_id)
        return attempt

    async def create_flashcard(
        self,
        user: User,
        *,
        topic_id: UUID | None,
        front: str,
        back: str,
    ) -> Flashcard:
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
        flashcard = Flashcard(
            owner_user_id=user.id,
            topic_id=topic_id,
            front=front,
            back=back,
            status=FlashcardStatus.ACTIVE.value,
        )
        self.db.add(flashcard)
        await self.db.flush()
        return flashcard

    async def list_flashcards(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[Flashcard]:
        predicates = [
            Flashcard.owner_user_id == user.id,
            Flashcard.status == FlashcardStatus.ACTIVE.value,
        ]
        total = await self._count(select(func.count(Flashcard.id)).where(*predicates))
        result = await self.db.execute(
            select(Flashcard)
            .where(*predicates)
            .order_by(Flashcard.updated_at.desc(), Flashcard.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def review_flashcard(
        self,
        user: User,
        flashcard_id: UUID,
        *,
        rating: FlashcardReviewRating,
        confidence: int | None,
        reviewed_at: datetime | None,
    ) -> FlashcardReview:
        flashcard = await self._get_owned_flashcard(user, flashcard_id)
        resolved_reviewed_at = reviewed_at or datetime.now(UTC)
        review = FlashcardReview(
            owner_user_id=user.id,
            flashcard_id=flashcard.id,
            rating=rating.value,
            confidence=confidence,
            reviewed_at=resolved_reviewed_at,
            next_review_at=_next_review_at(resolved_reviewed_at, rating),
        )
        self.db.add(review)
        await self.db.flush()
        if flashcard.topic_id is not None:
            await self.recalculate_mastery(user, flashcard.topic_id)
        return review

    async def get_mastery(self, user: User, topic_id: UUID) -> MasteryCalculation:
        return await self.recalculate_mastery(user, topic_id)

    async def recalculate_mastery(self, user: User, topic_id: UUID) -> MasteryCalculation:
        topic = await self._get_owned_topic(user, topic_id)
        attempts = await self._attempts_for_topic(user, topic.id)
        reviews = await self._reviews_for_topic(user, topic.id)
        completed_lessons, total_lessons = await self._lesson_counts_for_topic(user, topic.id)

        quiz_accuracy = _average([attempt.accuracy for attempt in attempts])
        successful_recall_count = sum(
            1
            for review in reviews
            if review.rating in (FlashcardReviewRating.GOOD.value, FlashcardReviewRating.EASY.value)
        )
        successful_recall_score = _clamp(successful_recall_count / 5)
        exercise_score = _clamp(completed_lessons / total_lessons) if total_lessons else 0.0
        confidence_score = _average(
            [
                (confidence - 1) / 4
                for confidence in [
                    *(attempt.confidence for attempt in attempts if attempt.confidence is not None),
                    *(review.confidence for review in reviews if review.confidence is not None),
                ]
            ]
        )
        review_recency_score = _review_recency_score(
            [
                *(attempt.created_at for attempt in attempts),
                *(review.reviewed_at for review in reviews),
            ]
        )
        hints_penalty = _clamp(_average([min(attempt.hints_used, 5) / 5 for attempt in attempts]))
        project_evidence_score = 0.0

        mastery_score = _clamp(
            quiz_accuracy * MASTERY_WEIGHTS["quizAccuracy"]
            + successful_recall_score * MASTERY_WEIGHTS["successfulRecall"]
            + exercise_score * MASTERY_WEIGHTS["exerciseCompletion"]
            + confidence_score * MASTERY_WEIGHTS["confidence"]
            + review_recency_score * MASTERY_WEIGHTS["reviewRecency"]
            + project_evidence_score * MASTERY_WEIGHTS["projectEvidence"]
            + hints_penalty * MASTERY_WEIGHTS["hintsPenalty"]
        )
        explanation: dict[str, object] = {
            "method": "transparent_heuristic_v1",
            "weights": MASTERY_WEIGHTS,
            "signals": {
                "quizAccuracy": round(quiz_accuracy, 4),
                "successfulRecallScore": round(successful_recall_score, 4),
                "successfulRecallCount": successful_recall_count,
                "exerciseScore": round(exercise_score, 4),
                "completedLessons": completed_lessons,
                "totalLessons": total_lessons,
                "confidenceScore": round(confidence_score, 4),
                "reviewRecencyScore": round(review_recency_score, 4),
                "hintsPenalty": round(hints_penalty, 4),
                "projectEvidenceScore": project_evidence_score,
            },
            "notes": [
                "Mastery is a heuristic, not a scientific diagnosis.",
                "Time alone does not increase mastery.",
                "Project evidence is reserved for the project phase and remains zero here.",
            ],
        }

        result = await self.db.execute(
            select(MasteryRecord).where(
                MasteryRecord.owner_user_id == user.id,
                MasteryRecord.topic_id == topic.id,
            )
        )
        record = result.scalar_one_or_none()
        if record is None:
            record = MasteryRecord(owner_user_id=user.id, topic_id=topic.id)
            self.db.add(record)

        record.mastery_score = round(mastery_score, 4)
        record.quiz_accuracy = round(quiz_accuracy, 4)
        record.successful_recall_score = round(successful_recall_score, 4)
        record.exercise_score = round(exercise_score, 4)
        record.confidence_score = round(confidence_score, 4)
        record.review_recency_score = round(review_recency_score, 4)
        record.hints_penalty = round(hints_penalty, 4)
        record.project_evidence_score = project_evidence_score
        record.calculation = explanation
        record.updated_at = datetime.now(UTC)
        await self.db.flush()
        return MasteryCalculation(record=record, explanation=explanation)

    async def create_goal(
        self,
        user: User,
        *,
        title: str,
        description: str | None,
        subject_id: UUID | None,
        topic_id: UUID | None,
        target_date: date | None,
    ) -> LearningGoal:
        if subject_id is not None:
            await self._get_owned_subject(user, subject_id)
        if topic_id is not None:
            await self._get_owned_topic(user, topic_id)
        goal = LearningGoal(
            owner_user_id=user.id,
            subject_id=subject_id,
            topic_id=topic_id,
            title=title.strip(),
            description=description,
            target_date=target_date,
            status=LearningGoalStatus.ACTIVE.value,
        )
        self.db.add(goal)
        await self.db.flush()
        return goal

    async def list_goals(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[LearningGoal]:
        predicates = [
            LearningGoal.owner_user_id == user.id,
            LearningGoal.status != LearningGoalStatus.ARCHIVED.value,
        ]
        total = await self._count(select(func.count(LearningGoal.id)).where(*predicates))
        result = await self.db.execute(
            select(LearningGoal)
            .where(*predicates)
            .order_by(LearningGoal.updated_at.desc(), LearningGoal.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def create_roadmap(
        self,
        user: User,
        *,
        title: str,
        description: str | None,
        subject_id: UUID | None,
        steps: list[dict[str, object]],
    ) -> StudyRoadmap:
        if subject_id is not None:
            await self._get_owned_subject(user, subject_id)
        roadmap = StudyRoadmap(
            owner_user_id=user.id,
            subject_id=subject_id,
            title=title.strip(),
            description=description,
            steps=steps,
            status=StudyRoadmapStatus.ACTIVE.value,
        )
        self.db.add(roadmap)
        await self.db.flush()
        return roadmap

    async def list_roadmaps(
        self,
        user: User,
        pagination: PaginationParams,
    ) -> PageResult[StudyRoadmap]:
        predicates = [
            StudyRoadmap.owner_user_id == user.id,
            StudyRoadmap.status != StudyRoadmapStatus.ARCHIVED.value,
        ]
        total = await self._count(select(func.count(StudyRoadmap.id)).where(*predicates))
        result = await self.db.execute(
            select(StudyRoadmap)
            .where(*predicates)
            .order_by(StudyRoadmap.updated_at.desc(), StudyRoadmap.id.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
        )
        return PageResult(
            items=list(result.scalars().all()),
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )

    async def _subject_by_normalized_name(self, user: User, normalized_name: str) -> Subject | None:
        result = await self.db.execute(
            select(Subject).where(
                Subject.owner_user_id == user.id,
                Subject.normalized_name == normalized_name,
            )
        )
        return result.scalar_one_or_none()

    async def _topic_by_normalized_name(self, user: User, normalized_name: str) -> Topic | None:
        result = await self.db.execute(
            select(Topic).where(
                Topic.owner_user_id == user.id,
                Topic.normalized_name == normalized_name,
            )
        )
        return result.scalar_one_or_none()

    async def _get_owned_subject(self, user: User, subject_id: UUID) -> Subject:
        result = await self.db.execute(
            select(Subject).where(Subject.id == subject_id, Subject.owner_user_id == user.id)
        )
        subject = result.scalar_one_or_none()
        if subject is None:
            raise AppError(404, "not_found", "Subject was not found.")
        return subject

    async def _get_owned_topic(self, user: User, topic_id: UUID) -> Topic:
        result = await self.db.execute(
            select(Topic).where(Topic.id == topic_id, Topic.owner_user_id == user.id)
        )
        topic = result.scalar_one_or_none()
        if topic is None:
            raise AppError(404, "not_found", "Topic was not found.")
        return topic

    async def _get_owned_file(self, user: User, file_id: UUID) -> FileRecord:
        result = await self.db.execute(
            select(FileRecord).where(
                FileRecord.id == file_id,
                FileRecord.owner_user_id == user.id,
                FileRecord.deletion_status == FileDeletionStatus.ACTIVE.value,
            )
        )
        file = result.scalar_one_or_none()
        if file is None:
            raise AppError(404, "not_found", "File was not found.")
        return file

    async def _get_owned_course(self, user: User, course_id: UUID) -> Course:
        result = await self.db.execute(
            select(Course).where(Course.id == course_id, Course.owner_user_id == user.id)
        )
        course = result.scalar_one_or_none()
        if course is None:
            raise AppError(404, "not_found", "Course was not found.")
        return course

    async def _get_owned_module(self, user: User, module_id: UUID) -> CourseModule:
        result = await self.db.execute(
            select(CourseModule).where(
                CourseModule.id == module_id,
                CourseModule.owner_user_id == user.id,
            )
        )
        module = result.scalar_one_or_none()
        if module is None:
            raise AppError(404, "not_found", "Course module was not found.")
        return module

    async def _get_owned_lesson(self, user: User, lesson_id: UUID) -> Lesson:
        result = await self.db.execute(
            select(Lesson).where(Lesson.id == lesson_id, Lesson.owner_user_id == user.id)
        )
        lesson = result.scalar_one_or_none()
        if lesson is None:
            raise AppError(404, "not_found", "Lesson was not found.")
        return lesson

    async def _get_owned_study_session(self, user: User, session_id: UUID) -> StudySession:
        result = await self.db.execute(
            select(StudySession).where(
                StudySession.id == session_id,
                StudySession.owner_user_id == user.id,
            )
        )
        session = result.scalar_one_or_none()
        if session is None:
            raise AppError(404, "not_found", "Study session was not found.")
        return session

    async def _get_owned_quiz(self, user: User, quiz_id: UUID) -> Quiz:
        result = await self.db.execute(
            select(Quiz).where(Quiz.id == quiz_id, Quiz.owner_user_id == user.id)
        )
        quiz = result.scalar_one_or_none()
        if quiz is None:
            raise AppError(404, "not_found", "Quiz was not found.")
        return quiz

    async def _get_owned_question(self, user: User, question_id: UUID) -> Question:
        result = await self.db.execute(
            select(Question).where(Question.id == question_id, Question.owner_user_id == user.id)
        )
        question = result.scalar_one_or_none()
        if question is None:
            raise AppError(404, "not_found", "Question was not found.")
        return question

    async def _get_owned_flashcard(self, user: User, flashcard_id: UUID) -> Flashcard:
        result = await self.db.execute(
            select(Flashcard).where(
                Flashcard.id == flashcard_id,
                Flashcard.owner_user_id == user.id,
            )
        )
        flashcard = result.scalar_one_or_none()
        if flashcard is None:
            raise AppError(404, "not_found", "Flashcard was not found.")
        return flashcard

    async def _attempts_for_topic(self, user: User, topic_id: UUID) -> list[Attempt]:
        result = await self.db.execute(
            select(Attempt)
            .join(Quiz, Attempt.quiz_id == Quiz.id)
            .where(
                Attempt.owner_user_id == user.id,
                Quiz.owner_user_id == user.id,
                Quiz.topic_id == topic_id,
            )
        )
        return list(result.scalars().all())

    async def _reviews_for_topic(self, user: User, topic_id: UUID) -> list[FlashcardReview]:
        result = await self.db.execute(
            select(FlashcardReview)
            .join(Flashcard, FlashcardReview.flashcard_id == Flashcard.id)
            .where(
                FlashcardReview.owner_user_id == user.id,
                Flashcard.owner_user_id == user.id,
                Flashcard.topic_id == topic_id,
            )
        )
        return list(result.scalars().all())

    async def _lesson_counts_for_topic(self, user: User, topic_id: UUID) -> tuple[int, int]:
        total = await self._count(
            select(func.count(Lesson.id)).where(
                Lesson.owner_user_id == user.id,
                Lesson.topic_id == topic_id,
            )
        )
        completed = await self._count(
            select(func.count(Lesson.id)).where(
                Lesson.owner_user_id == user.id,
                Lesson.topic_id == topic_id,
                Lesson.status == LessonStatus.COMPLETED.value,
            )
        )
        return completed, total

    async def _count(self, query: Select[tuple[int]]) -> int:
        value = await self.db.scalar(query)
        return int(value or 0)


def _normalize_name(value: str) -> str:
    return " ".join(value.strip().casefold().split())


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _average(values: list[float]) -> float:
    if not values:
        return 0.0
    return _clamp(sum(values) / len(values))


def _review_recency_score(values: list[datetime]) -> float:
    if not values:
        return 0.0
    latest = max(_ensure_aware_utc(value) for value in values)
    age = datetime.now(UTC) - latest
    if age <= timedelta(days=7):
        return 1.0
    if age <= timedelta(days=30):
        return 0.7
    if age <= timedelta(days=90):
        return 0.4
    return 0.1


def _ensure_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _next_review_at(reviewed_at: datetime, rating: FlashcardReviewRating) -> datetime:
    if rating == FlashcardReviewRating.AGAIN:
        return reviewed_at + timedelta(days=1)
    if rating == FlashcardReviewRating.HARD:
        return reviewed_at + timedelta(days=3)
    if rating == FlashcardReviewRating.GOOD:
        return reviewed_at + timedelta(days=7)
    return reviewed_at + timedelta(days=14)
