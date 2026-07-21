from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.errors import AppError
from app.core.pagination import PaginationParams
from app.dependencies.auth import get_current_user, verify_allowed_origin
from app.dependencies.learning import get_learning_service
from app.dependencies.pagination import get_pagination
from app.models.auth import User
from app.schemas.common import ApiErrorResponse
from app.schemas.learning import (
    AttemptCreateRequest,
    AttemptResponse,
    CourseCreateRequest,
    CourseModuleCreateRequest,
    CourseModuleResponse,
    CoursePage,
    CourseResponse,
    FlashcardCreateRequest,
    FlashcardPage,
    FlashcardResponse,
    FlashcardReviewCreateRequest,
    FlashcardReviewResponse,
    LearningGoalCreateRequest,
    LearningGoalPage,
    LearningGoalResponse,
    LearningResourceCreateRequest,
    LearningResourcePage,
    LearningResourceResponse,
    LessonCreateRequest,
    LessonResponse,
    MasteryResponse,
    QuestionCreateRequest,
    QuestionResponse,
    QuizCreateRequest,
    QuizPage,
    QuizResponse,
    StudyRoadmapCreateRequest,
    StudyRoadmapPage,
    StudyRoadmapResponse,
    StudySessionCreateRequest,
    StudySessionEndRequest,
    StudySessionPage,
    StudySessionResponse,
    SubjectCreateRequest,
    SubjectPage,
    SubjectResponse,
    TopicCreateRequest,
    TopicPage,
    TopicRelationCreateRequest,
    TopicRelationResponse,
    TopicResponse,
)
from app.services.learning import LearningService

router = APIRouter()

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"model": ApiErrorResponse},
    403: {"model": ApiErrorResponse},
    404: {"model": ApiErrorResponse},
    409: {"model": ApiErrorResponse},
    422: {"model": ApiErrorResponse},
}


@router.get("/subjects", response_model=SubjectPage, responses=ERROR_RESPONSES)
async def list_subjects(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> SubjectPage:
    page = await service.list_subjects(
        current_user,
        pagination,
        include_archived=include_archived,
    )
    await service.db.commit()
    return SubjectPage(
        items=[SubjectResponse.from_subject(subject) for subject in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/subjects",
    response_model=SubjectResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_subject(
    payload: SubjectCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> SubjectResponse:
    try:
        subject = await service.create_subject(
            current_user,
            name=payload.name,
            description=payload.description,
        )
        await service.db.commit()
        return SubjectResponse.from_subject(subject)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/topics", response_model=TopicPage, responses=ERROR_RESPONSES)
async def list_topics(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    subject_id: UUID | None = Query(default=None, alias="subjectId"),
    include_archived: bool = Query(default=False, alias="includeArchived"),
) -> TopicPage:
    page = await service.list_topics(
        current_user,
        pagination,
        subject_id=subject_id,
        include_archived=include_archived,
    )
    await service.db.commit()
    return TopicPage(
        items=[TopicResponse.from_topic(topic) for topic in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/topics",
    response_model=TopicResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_topic(
    payload: TopicCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> TopicResponse:
    try:
        topic = await service.create_topic(
            current_user,
            name=payload.name,
            description=payload.description,
            subject_id=payload.subject_id,
        )
        await service.db.commit()
        return TopicResponse.from_topic(topic)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/topics/{topic_id}/prerequisites",
    response_model=TopicRelationResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def add_prerequisite(
    topic_id: UUID,
    payload: TopicRelationCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> TopicRelationResponse:
    try:
        relation = await service.add_prerequisite(
            current_user,
            topic_id=topic_id,
            prerequisite_topic_id=payload.prerequisite_topic_id,
        )
        await service.db.commit()
        return TopicRelationResponse.from_relation(relation)
    except Exception:
        await service.db.rollback()
        raise


@router.get(
    "/topics/{topic_id}/mastery",
    response_model=MasteryResponse,
    responses=ERROR_RESPONSES,
)
async def get_mastery(
    topic_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> MasteryResponse:
    mastery = await service.get_mastery(current_user, topic_id)
    await service.db.commit()
    return MasteryResponse.from_calculation(mastery)


@router.get("/resources", response_model=LearningResourcePage, responses=ERROR_RESPONSES)
async def list_resources(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
    topic_id: UUID | None = Query(default=None, alias="topicId"),
) -> LearningResourcePage:
    page = await service.list_resources(current_user, pagination, topic_id=topic_id)
    await service.db.commit()
    return LearningResourcePage(
        items=[LearningResourceResponse.from_resource(resource) for resource in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/resources",
    response_model=LearningResourceResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_resource(
    payload: LearningResourceCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> LearningResourceResponse:
    try:
        resource = await service.create_resource(
            current_user,
            title=payload.title,
            resource_type=payload.resource_type,
            subject_id=payload.subject_id,
            topic_id=payload.topic_id,
            file_id=payload.file_id,
            url=payload.url,
            notes=payload.notes,
        )
        await service.db.commit()
        return LearningResourceResponse.from_resource(resource)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/courses", response_model=CoursePage, responses=ERROR_RESPONSES)
async def list_courses(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> CoursePage:
    page = await service.list_courses(current_user, pagination)
    await service.db.commit()
    return CoursePage(
        items=[CourseResponse.from_course(course) for course in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_course(
    payload: CourseCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> CourseResponse:
    try:
        course = await service.create_course(
            current_user,
            title=payload.title,
            description=payload.description,
            subject_id=payload.subject_id,
        )
        await service.db.commit()
        return CourseResponse.from_course(course)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/courses/{course_id}/modules",
    response_model=CourseModuleResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_module(
    course_id: UUID,
    payload: CourseModuleCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> CourseModuleResponse:
    try:
        module = await service.create_module(
            current_user,
            course_id,
            title=payload.title,
            description=payload.description,
            position=payload.position,
        )
        await service.db.commit()
        return CourseModuleResponse.from_module(module)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/modules/{module_id}/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_lesson(
    module_id: UUID,
    payload: LessonCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> LessonResponse:
    try:
        lesson = await service.create_lesson(
            current_user,
            module_id,
            title=payload.title,
            content=payload.content,
            topic_id=payload.topic_id,
            position=payload.position,
            estimated_minutes=payload.estimated_minutes,
        )
        await service.db.commit()
        return LessonResponse.from_lesson(lesson)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/lessons/{lesson_id}/complete",
    response_model=LessonResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def complete_lesson(
    lesson_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> LessonResponse:
    try:
        lesson = await service.complete_lesson(current_user, lesson_id)
        await service.db.commit()
        return LessonResponse.from_lesson(lesson)
    except AppError:
        await service.db.commit()
        raise
    except Exception:
        await service.db.rollback()
        raise


@router.get("/study-sessions", response_model=StudySessionPage, responses=ERROR_RESPONSES)
async def list_study_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> StudySessionPage:
    page = await service.list_study_sessions(current_user, pagination)
    await service.db.commit()
    return StudySessionPage(
        items=[StudySessionResponse.from_session(session) for session in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/study-sessions",
    response_model=StudySessionResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_study_session(
    payload: StudySessionCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> StudySessionResponse:
    try:
        session = await service.create_study_session(
            current_user,
            mode=payload.mode,
            subject_id=payload.subject_id,
            topic_id=payload.topic_id,
            course_id=payload.course_id,
            lesson_id=payload.lesson_id,
            started_at=payload.started_at,
            notes=payload.notes,
        )
        await service.db.commit()
        return StudySessionResponse.from_session(session)
    except Exception:
        await service.db.rollback()
        raise


@router.patch(
    "/study-sessions/{session_id}/end",
    response_model=StudySessionResponse,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def end_study_session(
    session_id: UUID,
    payload: StudySessionEndRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> StudySessionResponse:
    try:
        session = await service.end_study_session(
            current_user,
            session_id,
            ended_at=payload.ended_at,
            notes=payload.notes,
        )
        await service.db.commit()
        return StudySessionResponse.from_session(session)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/quizzes", response_model=QuizPage, responses=ERROR_RESPONSES)
async def list_quizzes(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> QuizPage:
    page = await service.list_quizzes(current_user, pagination)
    await service.db.commit()
    return QuizPage(
        items=[QuizResponse.from_quiz(quiz) for quiz in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/quizzes",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_quiz(
    payload: QuizCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> QuizResponse:
    try:
        quiz = await service.create_quiz(
            current_user,
            title=payload.title,
            topic_id=payload.topic_id,
            lesson_id=payload.lesson_id,
        )
        await service.db.commit()
        return QuizResponse.from_quiz(quiz)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def add_question(
    quiz_id: UUID,
    payload: QuestionCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> QuestionResponse:
    try:
        question = await service.add_question(
            current_user,
            quiz_id,
            question_type=payload.question_type.value,
            prompt=payload.prompt,
            choices=payload.choices,
            correct_answer=payload.correct_answer,
            explanation=payload.explanation,
            position=payload.position,
            difficulty=payload.difficulty,
        )
        await service.db.commit()
        return QuestionResponse.from_question(question)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/quizzes/{quiz_id}/attempts",
    response_model=AttemptResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def submit_attempt(
    quiz_id: UUID,
    payload: AttemptCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> AttemptResponse:
    try:
        attempt = await service.submit_attempt(
            current_user,
            quiz_id,
            question_id=payload.question_id,
            score=payload.score,
            max_score=payload.max_score,
            confidence=payload.confidence,
            hints_used=payload.hints_used,
            submitted_answer=payload.submitted_answer,
            feedback=payload.feedback,
        )
        await service.db.commit()
        return AttemptResponse.from_attempt(attempt)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/flashcards", response_model=FlashcardPage, responses=ERROR_RESPONSES)
async def list_flashcards(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> FlashcardPage:
    page = await service.list_flashcards(current_user, pagination)
    await service.db.commit()
    return FlashcardPage(
        items=[FlashcardResponse.from_flashcard(flashcard) for flashcard in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/flashcards",
    response_model=FlashcardResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_flashcard(
    payload: FlashcardCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> FlashcardResponse:
    try:
        flashcard = await service.create_flashcard(
            current_user,
            topic_id=payload.topic_id,
            front=payload.front,
            back=payload.back,
        )
        await service.db.commit()
        return FlashcardResponse.from_flashcard(flashcard)
    except Exception:
        await service.db.rollback()
        raise


@router.post(
    "/flashcards/{flashcard_id}/reviews",
    response_model=FlashcardReviewResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def review_flashcard(
    flashcard_id: UUID,
    payload: FlashcardReviewCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> FlashcardReviewResponse:
    try:
        review = await service.review_flashcard(
            current_user,
            flashcard_id,
            rating=payload.rating,
            confidence=payload.confidence,
            reviewed_at=payload.reviewed_at,
        )
        await service.db.commit()
        return FlashcardReviewResponse.from_review(review)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/goals", response_model=LearningGoalPage, responses=ERROR_RESPONSES)
async def list_goals(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> LearningGoalPage:
    page = await service.list_goals(current_user, pagination)
    await service.db.commit()
    return LearningGoalPage(
        items=[LearningGoalResponse.from_goal(goal) for goal in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/goals",
    response_model=LearningGoalResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_goal(
    payload: LearningGoalCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> LearningGoalResponse:
    try:
        goal = await service.create_goal(
            current_user,
            title=payload.title,
            description=payload.description,
            subject_id=payload.subject_id,
            topic_id=payload.topic_id,
            target_date=payload.target_date,
        )
        await service.db.commit()
        return LearningGoalResponse.from_goal(goal)
    except Exception:
        await service.db.rollback()
        raise


@router.get("/roadmaps", response_model=StudyRoadmapPage, responses=ERROR_RESPONSES)
async def list_roadmaps(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
    pagination: Annotated[PaginationParams, Depends(get_pagination)],
) -> StudyRoadmapPage:
    page = await service.list_roadmaps(current_user, pagination)
    await service.db.commit()
    return StudyRoadmapPage(
        items=[StudyRoadmapResponse.from_roadmap(roadmap) for roadmap in page.items],
        total=page.total,
        limit=page.limit,
        offset=page.offset,
    )


@router.post(
    "/roadmaps",
    response_model=StudyRoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
    dependencies=[Depends(verify_allowed_origin)],
)
async def create_roadmap(
    payload: StudyRoadmapCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[LearningService, Depends(get_learning_service)],
) -> StudyRoadmapResponse:
    try:
        roadmap = await service.create_roadmap(
            current_user,
            title=payload.title,
            description=payload.description,
            subject_id=payload.subject_id,
            steps=payload.steps,
        )
        await service.db.commit()
        return StudyRoadmapResponse.from_roadmap(roadmap)
    except Exception:
        await service.db.rollback()
        raise
