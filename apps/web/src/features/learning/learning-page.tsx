"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  Course,
  Flashcard,
  LearningGoal,
  MasteryRecord,
  Quiz,
  StudyRoadmap,
  StudySession,
  StudySessionMode,
  Subject,
  Topic
} from "@aetherium/shared-types";
import {
  attemptCreateRequestSchema,
  flashcardCreateRequestSchema,
  learningGoalCreateRequestSchema,
  quizCreateRequestSchema,
  studyRoadmapCreateRequestSchema,
  studySessionCreateRequestSchema,
  subjectCreateRequestSchema,
  topicCreateRequestSchema
} from "@aetherium/validation";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

const PAGE_LIMIT = 30;

const studyModes: Array<{ label: string; value: StudySessionMode }> = [
  { label: "Guided course", value: "guided_course" },
  { label: "Free exploration", value: "free_exploration" },
  { label: "Document-based", value: "document_based" },
  { label: "Project-based", value: "project_based" },
  { label: "Exam preparation", value: "exam_preparation" },
  { label: "Coding practice", value: "coding_practice" },
  { label: "Quick review", value: "quick_review" }
];

interface LearningState {
  courses: Course[];
  flashcards: Flashcard[];
  goals: LearningGoal[];
  quizzes: Quiz[];
  roadmaps: StudyRoadmap[];
  sessions: StudySession[];
  subjects: Subject[];
  topics: Topic[];
}

const emptyLearningState: LearningState = {
  courses: [],
  flashcards: [],
  goals: [],
  quizzes: [],
  roadmaps: [],
  sessions: [],
  subjects: [],
  topics: []
};

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "The learning request failed.";
}

function percentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function modeLabel(mode: StudySessionMode): string {
  return studyModes.find((option) => option.value === mode)?.label ?? mode;
}

function firstIssueMessage(result: {
  error: { issues: Array<{ message: string }> };
  success: false;
}): string {
  return result.error.issues[0]?.message ?? "Learning details are invalid.";
}

export function LearningPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [state, setState] = React.useState<LearningState>(emptyLearningState);
  const [mastery, setMastery] = React.useState<MasteryRecord | null>(null);
  const [selectedTopicId, setSelectedTopicId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [subjectName, setSubjectName] = React.useState("");
  const [subjectDescription, setSubjectDescription] = React.useState("");
  const [topicName, setTopicName] = React.useState("");
  const [topicDescription, setTopicDescription] = React.useState("");
  const [topicSubjectId, setTopicSubjectId] = React.useState("");
  const [sessionMode, setSessionMode] = React.useState<StudySessionMode>("quick_review");
  const [sessionTopicId, setSessionTopicId] = React.useState("");
  const [sessionNotes, setSessionNotes] = React.useState("");
  const [quizTitle, setQuizTitle] = React.useState("");
  const [quizTopicId, setQuizTopicId] = React.useState("");
  const [questionQuizId, setQuestionQuizId] = React.useState("");
  const [questionPrompt, setQuestionPrompt] = React.useState("");
  const [attemptQuizId, setAttemptQuizId] = React.useState("");
  const [attemptScore, setAttemptScore] = React.useState("1");
  const [attemptMaxScore, setAttemptMaxScore] = React.useState("1");
  const [attemptConfidence, setAttemptConfidence] = React.useState("4");
  const [attemptHints, setAttemptHints] = React.useState("0");
  const [flashcardTopicId, setFlashcardTopicId] = React.useState("");
  const [flashcardFront, setFlashcardFront] = React.useState("");
  const [flashcardBack, setFlashcardBack] = React.useState("");
  const [goalTitle, setGoalTitle] = React.useState("");
  const [goalTopicId, setGoalTopicId] = React.useState("");
  const [goalTargetDate, setGoalTargetDate] = React.useState("");
  const [roadmapTitle, setRoadmapTitle] = React.useState("");
  const [roadmapTopicId, setRoadmapTopicId] = React.useState("");
  const [courseTitle, setCourseTitle] = React.useState("");
  const [courseSubjectId, setCourseSubjectId] = React.useState("");

  const loadLearning = React.useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const [subjects, topics, courses, sessions, quizzes, flashcards, goals, roadmaps] =
          await Promise.all([
            apiClient.learning.listSubjects({ limit: PAGE_LIMIT, offset: 0 }),
            apiClient.learning.listTopics({ limit: PAGE_LIMIT, offset: 0 }),
            apiClient.learning.listCourses({ limit: PAGE_LIMIT, offset: 0 }),
            apiClient.learning.listSessions({ limit: PAGE_LIMIT, offset: 0 }),
            apiClient.learning.listQuizzes({ limit: PAGE_LIMIT, offset: 0 }),
            apiClient.learning.listFlashcards({ limit: PAGE_LIMIT, offset: 0 }),
            apiClient.learning.listGoals({ limit: PAGE_LIMIT, offset: 0 }),
            apiClient.learning.listRoadmaps({ limit: PAGE_LIMIT, offset: 0 })
          ]);
        setState({
          courses: courses.items,
          flashcards: flashcards.items,
          goals: goals.items,
          quizzes: quizzes.items,
          roadmaps: roadmaps.items,
          sessions: sessions.items,
          subjects: subjects.items,
          topics: topics.items
        });
        const nextTopicId = selectedTopicId || topics.items[0]?.id || "";
        setSelectedTopicId(nextTopicId);
        setMastery(nextTopicId ? await apiClient.learning.getMastery(nextTopicId) : null);
      } catch (loadError) {
        setError(friendlyError(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, selectedTopicId]
  );

  React.useEffect(() => {
    void loadLearning();
  }, [loadLearning]);

  async function runAction(actionId: string, action: () => Promise<void>): Promise<void> {
    setActiveAction(actionId);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (actionError) {
      setError(friendlyError(actionError));
    } finally {
      setActiveAction(null);
    }
  }

  async function selectTopic(topicId: string): Promise<void> {
    setSelectedTopicId(topicId);
    setMastery(topicId ? await apiClient.learning.getMastery(topicId) : null);
  }

  async function handleCreateSubject(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = subjectCreateRequestSchema.safeParse({
      description: subjectDescription.trim() || null,
      name: subjectName.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("subject:create", async () => {
      await apiClient.learning.createSubject(parsed.data);
      setSubjectName("");
      setSubjectDescription("");
      setNotice("Subject created.");
      await loadLearning(false);
    });
  }

  async function handleCreateTopic(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = topicCreateRequestSchema.safeParse({
      description: topicDescription.trim() || null,
      name: topicName.trim(),
      subjectId: topicSubjectId || null
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("topic:create", async () => {
      const topic = await apiClient.learning.createTopic(parsed.data);
      setTopicName("");
      setTopicDescription("");
      setTopicSubjectId("");
      setSelectedTopicId(topic.id);
      setNotice("Topic created.");
      await loadLearning(false);
    });
  }

  async function handleCreateSession(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = studySessionCreateRequestSchema.safeParse({
      mode: sessionMode,
      notes: sessionNotes.trim() || null,
      topicId: sessionTopicId || null
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("session:create", async () => {
      await apiClient.learning.createSession(parsed.data);
      setSessionNotes("");
      setNotice("Study session started.");
      await loadLearning(false);
    });
  }

  async function handleEndSession(session: StudySession): Promise<void> {
    await runAction(`session:end:${session.id}`, async () => {
      await apiClient.learning.endSession(session.id, {});
      setNotice("Study session ended.");
      await loadLearning(false);
    });
  }

  async function handleCreateQuiz(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = quizCreateRequestSchema.safeParse({
      title: quizTitle.trim(),
      topicId: quizTopicId || selectedTopicId || null
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("quiz:create", async () => {
      const quiz = await apiClient.learning.createQuiz(parsed.data);
      setQuizTitle("");
      setQuizTopicId("");
      setAttemptQuizId(quiz.id);
      setQuestionQuizId(quiz.id);
      setNotice("Quiz created.");
      await loadLearning(false);
    });
  }

  async function handleAddQuestion(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!questionQuizId) {
      setError("Select a quiz before adding a question.");
      return;
    }
    await runAction("question:create", async () => {
      await apiClient.learning.addQuestion(questionQuizId, {
        prompt: questionPrompt.trim(),
        questionType: "free_text"
      });
      setQuestionPrompt("");
      setNotice("Question added.");
    });
  }

  async function handleSubmitAttempt(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const quizId = attemptQuizId || state.quizzes[0]?.id || "";
    if (!quizId) {
      setError("Create or select a quiz before submitting an attempt.");
      return;
    }
    const parsed = attemptCreateRequestSchema.safeParse({
      confidence: attemptConfidence ? Number(attemptConfidence) : null,
      hintsUsed: Number(attemptHints),
      maxScore: Number(attemptMaxScore),
      score: Number(attemptScore)
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("attempt:create", async () => {
      await apiClient.learning.submitAttempt(quizId, parsed.data);
      setNotice("Quiz attempt saved and mastery recalculated.");
      await loadLearning(false);
    });
  }

  async function handleCreateFlashcard(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = flashcardCreateRequestSchema.safeParse({
      back: flashcardBack.trim(),
      front: flashcardFront.trim(),
      topicId: flashcardTopicId || selectedTopicId || null
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("flashcard:create", async () => {
      await apiClient.learning.createFlashcard(parsed.data);
      setFlashcardBack("");
      setFlashcardFront("");
      setFlashcardTopicId("");
      setNotice("Flashcard created.");
      await loadLearning(false);
    });
  }

  async function handleReviewFlashcard(
    flashcard: Flashcard,
    rating: "again" | "good" | "easy"
  ): Promise<void> {
    await runAction(`flashcard:review:${flashcard.id}`, async () => {
      await apiClient.learning.reviewFlashcard(flashcard.id, { confidence: 4, rating });
      setNotice("Flashcard review saved and mastery recalculated.");
      await loadLearning(false);
    });
  }

  async function handleCreateGoal(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = learningGoalCreateRequestSchema.safeParse({
      targetDate: goalTargetDate || null,
      title: goalTitle.trim(),
      topicId: goalTopicId || selectedTopicId || null
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("goal:create", async () => {
      await apiClient.learning.createGoal(parsed.data);
      setGoalTitle("");
      setGoalTopicId("");
      setGoalTargetDate("");
      setNotice("Learning goal created.");
      await loadLearning(false);
    });
  }

  async function handleCreateRoadmap(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = studyRoadmapCreateRequestSchema.safeParse({
      steps: roadmapTopicId ? [{ label: "Review selected topic", topicId: roadmapTopicId }] : [],
      title: roadmapTitle.trim()
    });
    if (!parsed.success) {
      setError(firstIssueMessage(parsed));
      return;
    }
    await runAction("roadmap:create", async () => {
      await apiClient.learning.createRoadmap(parsed.data);
      setRoadmapTitle("");
      setRoadmapTopicId("");
      setNotice("Study roadmap created.");
      await loadLearning(false);
    });
  }

  async function handleCreateCourse(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!courseTitle.trim()) {
      setError("Course title is required.");
      return;
    }
    await runAction("course:create", async () => {
      const course = await apiClient.learning.createCourse({
        subjectId: courseSubjectId || null,
        title: courseTitle.trim()
      });
      const courseModule = await apiClient.learning.createModule(course.id, {
        position: 0,
        title: "Foundation"
      });
      if (state.topics[0]) {
        await apiClient.learning.createLesson(courseModule.id, {
          estimatedMinutes: 25,
          position: 0,
          title: `Study ${state.topics[0].name}`,
          topicId: state.topics[0].id
        });
      }
      setCourseTitle("");
      setCourseSubjectId("");
      setNotice("Course, module, and first lesson created.");
      await loadLearning(false);
    });
  }

  const selectedTopic = state.topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const openSessions = state.sessions.filter((session) => session.endedAt === null);

  return (
    <section className="content-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Learning Engine</p>
          <h1>Learning</h1>
        </div>
        <span className="state-pill">
          {isLoading ? "Syncing" : `${state.topics.length} topics`}
        </span>
      </header>

      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}
      {notice ? (
        <section className="inline-success" aria-live="polite">
          {notice}
        </section>
      ) : null}

      <div className="metric-grid learning-metrics">
        <section className="metric-panel">
          <span>Subjects</span>
          <strong>{state.subjects.length}</strong>
          <small>Stored learning areas</small>
        </section>
        <section className="metric-panel">
          <span>Topics</span>
          <strong>{state.topics.length}</strong>
          <small>Searchable concepts</small>
        </section>
        <section className="metric-panel">
          <span>Sessions</span>
          <strong>{state.sessions.length}</strong>
          <small>{openSessions.length} currently open</small>
        </section>
        <section className="metric-panel">
          <span>Selected mastery</span>
          <strong>{mastery ? percentLabel(mastery.masteryScore) : "0%"}</strong>
          <small>{selectedTopic?.name ?? "No topic selected"}</small>
        </section>
      </div>

      <div className="learning-grid">
        <section className="work-panel">
          <header>
            <div>
              <h2>Subjects And Topics</h2>
              <p className="empty-note">Create durable learning records owned by this account.</p>
            </div>
          </header>
          <form className="learning-form" onSubmit={(event) => void handleCreateSubject(event)}>
            <label>
              Subject name
              <input
                onChange={(event) => setSubjectName(event.target.value)}
                required
                value={subjectName}
              />
            </label>
            <label>
              Subject notes
              <input
                onChange={(event) => setSubjectDescription(event.target.value)}
                value={subjectDescription}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "subject:create"}
              type="submit"
            >
              Create subject
            </button>
          </form>

          <form className="learning-form" onSubmit={(event) => void handleCreateTopic(event)}>
            <label>
              Topic name
              <input
                onChange={(event) => setTopicName(event.target.value)}
                required
                value={topicName}
              />
            </label>
            <label>
              Subject
              <select
                onChange={(event) => setTopicSubjectId(event.target.value)}
                value={topicSubjectId}
              >
                <option value="">No subject</option>
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide-field">
              Topic notes
              <textarea
                onChange={(event) => setTopicDescription(event.target.value)}
                value={topicDescription}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "topic:create"}
              type="submit"
            >
              Create topic
            </button>
          </form>

          {isLoading ? <p className="empty-note">Loading learning records...</p> : null}
          {!isLoading && state.topics.length === 0 ? (
            <p className="empty-note">No topics yet. Create a subject and topic to begin.</p>
          ) : null}
          {state.topics.length > 0 ? (
            <div className="topic-list" aria-label="Topics">
              {state.topics.map((topic) => (
                <button
                  aria-pressed={topic.id === selectedTopicId}
                  className="topic-row"
                  key={topic.id}
                  onClick={() => void selectTopic(topic.id)}
                  type="button"
                >
                  <span>{topic.name}</span>
                  <small>{topic.description ?? "No description"}</small>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="work-panel">
          <header>
            <div>
              <h2>Mastery</h2>
              <p className="empty-note">
                Transparent heuristic, recalculated from stored evidence.
              </p>
            </div>
          </header>
          {!selectedTopic ? <p className="empty-note">Select a topic to inspect mastery.</p> : null}
          {selectedTopic && mastery ? (
            <>
              <div
                aria-label={`Mastery for ${selectedTopic.name} ${percentLabel(mastery.masteryScore)}`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(mastery.masteryScore * 100)}
                className="mastery-meter"
                role="meter"
              >
                <span
                  style={{ width: `${Math.max(4, Math.round(mastery.masteryScore * 100))}%` }}
                />
              </div>
              <dl className="detail-list compact-detail-list">
                <dt>Quiz accuracy</dt>
                <dd>{percentLabel(mastery.quizAccuracy)}</dd>
                <dt>Successful recall</dt>
                <dd>{percentLabel(mastery.successfulRecallScore)}</dd>
                <dt>Lesson completion</dt>
                <dd>{percentLabel(mastery.exerciseScore)}</dd>
                <dt>Confidence</dt>
                <dd>{percentLabel(mastery.confidenceScore)}</dd>
                <dt>Review recency</dt>
                <dd>{percentLabel(mastery.reviewRecencyScore)}</dd>
                <dt>Hint penalty</dt>
                <dd>{percentLabel(mastery.hintsPenalty)}</dd>
                <dt>Project evidence</dt>
                <dd>{percentLabel(mastery.projectEvidenceScore)}</dd>
              </dl>
              <p className="empty-note">
                Time alone does not raise this score. Project evidence remains zero until the
                project phase supplies real evidence.
              </p>
            </>
          ) : null}
        </section>
      </div>

      <section className="work-panel">
        <header className="habit-panel-header">
          <div>
            <h2>Study Sessions</h2>
            <p className="empty-note">Track study mode and notes without using time as mastery.</p>
          </div>
          <button className="secondary-action" onClick={() => void loadLearning()} type="button">
            Refresh
          </button>
        </header>
        <form className="learning-form" onSubmit={(event) => void handleCreateSession(event)}>
          <label>
            Mode
            <select
              onChange={(event) => setSessionMode(event.target.value as StudySessionMode)}
              value={sessionMode}
            >
              {studyModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <TopicSelect
            label="Topic"
            onChange={setSessionTopicId}
            topics={state.topics}
            value={sessionTopicId}
          />
          <label className="wide-field">
            Session notes
            <textarea
              onChange={(event) => setSessionNotes(event.target.value)}
              value={sessionNotes}
            />
          </label>
          <button
            className="primary-action"
            disabled={activeAction === "session:create"}
            type="submit"
          >
            Start session
          </button>
        </form>
        {state.sessions.length === 0 ? <p className="empty-note">No study sessions yet.</p> : null}
        {state.sessions.length > 0 ? (
          <div className="learning-list">
            {state.sessions.slice(0, 5).map((session) => (
              <article className="learning-row" key={session.id}>
                <span>
                  <strong>{modeLabel(session.mode)}</strong>
                  <small>
                    {session.startedAt}
                    {session.durationMinutes !== null ? `, ${session.durationMinutes} minutes` : ""}
                  </small>
                </span>
                {session.endedAt === null ? (
                  <button
                    className="secondary-action"
                    disabled={activeAction === `session:end:${session.id}`}
                    onClick={() => void handleEndSession(session)}
                    type="button"
                  >
                    End
                  </button>
                ) : (
                  <span className="status-token">Closed</span>
                )}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <div className="learning-grid">
        <section className="work-panel">
          <header>
            <div>
              <h2>Quizzes</h2>
              <p className="empty-note">Quiz attempts are a primary mastery signal.</p>
            </div>
          </header>
          <form className="learning-form" onSubmit={(event) => void handleCreateQuiz(event)}>
            <label>
              Quiz title
              <input
                onChange={(event) => setQuizTitle(event.target.value)}
                required
                value={quizTitle}
              />
            </label>
            <TopicSelect
              label="Topic"
              onChange={setQuizTopicId}
              topics={state.topics}
              value={quizTopicId}
            />
            <button
              className="primary-action"
              disabled={activeAction === "quiz:create"}
              type="submit"
            >
              Create quiz
            </button>
          </form>
          <form className="learning-form" onSubmit={(event) => void handleAddQuestion(event)}>
            <QuizSelect
              label="Quiz"
              onChange={setQuestionQuizId}
              quizzes={state.quizzes}
              value={questionQuizId}
            />
            <label className="wide-field">
              Question prompt
              <textarea
                onChange={(event) => setQuestionPrompt(event.target.value)}
                required
                value={questionPrompt}
              />
            </label>
            <button
              className="secondary-action"
              disabled={activeAction === "question:create"}
              type="submit"
            >
              Add question
            </button>
          </form>
          <form className="learning-form" onSubmit={(event) => void handleSubmitAttempt(event)}>
            <QuizSelect
              label="Attempt quiz"
              onChange={setAttemptQuizId}
              quizzes={state.quizzes}
              value={attemptQuizId}
            />
            <label>
              Score
              <input
                min="0"
                onChange={(event) => setAttemptScore(event.target.value)}
                step="0.01"
                type="number"
                value={attemptScore}
              />
            </label>
            <label>
              Max score
              <input
                min="0.01"
                onChange={(event) => setAttemptMaxScore(event.target.value)}
                step="0.01"
                type="number"
                value={attemptMaxScore}
              />
            </label>
            <label>
              Confidence
              <select
                onChange={(event) => setAttemptConfidence(event.target.value)}
                value={attemptConfidence}
              >
                <option value="">Not set</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <label>
              Hints used
              <input
                min="0"
                onChange={(event) => setAttemptHints(event.target.value)}
                type="number"
                value={attemptHints}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "attempt:create"}
              type="submit"
            >
              Save attempt
            </button>
          </form>
          {state.quizzes.length === 0 ? <p className="empty-note">No quizzes yet.</p> : null}
        </section>

        <section className="work-panel">
          <header>
            <div>
              <h2>Flashcards</h2>
              <p className="empty-note">Recall reviews affect mastery and review timing.</p>
            </div>
          </header>
          <form className="learning-form" onSubmit={(event) => void handleCreateFlashcard(event)}>
            <TopicSelect
              label="Topic"
              onChange={setFlashcardTopicId}
              topics={state.topics}
              value={flashcardTopicId}
            />
            <label>
              Front
              <input
                onChange={(event) => setFlashcardFront(event.target.value)}
                required
                value={flashcardFront}
              />
            </label>
            <label className="wide-field">
              Back
              <textarea
                onChange={(event) => setFlashcardBack(event.target.value)}
                required
                value={flashcardBack}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "flashcard:create"}
              type="submit"
            >
              Create flashcard
            </button>
          </form>
          {state.flashcards.length === 0 ? <p className="empty-note">No flashcards yet.</p> : null}
          {state.flashcards.length > 0 ? (
            <div className="learning-list">
              {state.flashcards.slice(0, 5).map((flashcard) => (
                <article className="learning-row stacked-learning-row" key={flashcard.id}>
                  <span>
                    <strong>{flashcard.front}</strong>
                    <small>{flashcard.back}</small>
                  </span>
                  <div className="learning-row-actions">
                    <button
                      className="secondary-action"
                      onClick={() => void handleReviewFlashcard(flashcard, "again")}
                      type="button"
                    >
                      Again
                    </button>
                    <button
                      className="secondary-action"
                      onClick={() => void handleReviewFlashcard(flashcard, "good")}
                      type="button"
                    >
                      Good
                    </button>
                    <button
                      className="secondary-action"
                      onClick={() => void handleReviewFlashcard(flashcard, "easy")}
                      type="button"
                    >
                      Easy
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <div className="learning-grid">
        <section className="work-panel">
          <header>
            <div>
              <h2>Goals And Roadmaps</h2>
              <p className="empty-note">
                Planning records are stored without fake completion data.
              </p>
            </div>
          </header>
          <form className="learning-form" onSubmit={(event) => void handleCreateGoal(event)}>
            <label>
              Goal title
              <input
                onChange={(event) => setGoalTitle(event.target.value)}
                required
                value={goalTitle}
              />
            </label>
            <TopicSelect
              label="Topic"
              onChange={setGoalTopicId}
              topics={state.topics}
              value={goalTopicId}
            />
            <label>
              Target date
              <input
                onChange={(event) => setGoalTargetDate(event.target.value)}
                type="date"
                value={goalTargetDate}
              />
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "goal:create"}
              type="submit"
            >
              Create goal
            </button>
          </form>
          <form className="learning-form" onSubmit={(event) => void handleCreateRoadmap(event)}>
            <label>
              Roadmap title
              <input
                onChange={(event) => setRoadmapTitle(event.target.value)}
                required
                value={roadmapTitle}
              />
            </label>
            <TopicSelect
              label="First step topic"
              onChange={setRoadmapTopicId}
              topics={state.topics}
              value={roadmapTopicId}
            />
            <button
              className="secondary-action"
              disabled={activeAction === "roadmap:create"}
              type="submit"
            >
              Create roadmap
            </button>
          </form>
          <div className="learning-list">
            {state.goals.slice(0, 3).map((goal) => (
              <article className="learning-row" key={goal.id}>
                <span>
                  <strong>{goal.title}</strong>
                  <small>{goal.targetDate ?? "No target date"}</small>
                </span>
                <span className="status-token">{goal.status}</span>
              </article>
            ))}
            {state.roadmaps.slice(0, 3).map((roadmap) => (
              <article className="learning-row" key={roadmap.id}>
                <span>
                  <strong>{roadmap.title}</strong>
                  <small>{roadmap.steps.length} steps</small>
                </span>
                <span className="status-token">{roadmap.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="work-panel">
          <header>
            <div>
              <h2>Courses</h2>
              <p className="empty-note">
                Course, module, and lesson APIs are ready for guided study.
              </p>
            </div>
          </header>
          <form className="learning-form" onSubmit={(event) => void handleCreateCourse(event)}>
            <label>
              Course title
              <input
                onChange={(event) => setCourseTitle(event.target.value)}
                required
                value={courseTitle}
              />
            </label>
            <label>
              Subject
              <select
                onChange={(event) => setCourseSubjectId(event.target.value)}
                value={courseSubjectId}
              >
                <option value="">No subject</option>
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-action"
              disabled={activeAction === "course:create"}
              type="submit"
            >
              Create course shell
            </button>
          </form>
          {state.courses.length === 0 ? <p className="empty-note">No courses yet.</p> : null}
          {state.courses.length > 0 ? (
            <div className="learning-list">
              {state.courses.slice(0, 6).map((course) => (
                <article className="learning-row" key={course.id}>
                  <span>
                    <strong>{course.title}</strong>
                    <small>{course.description ?? "No description"}</small>
                  </span>
                  <span className="status-token">{course.status}</span>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function TopicSelect({
  label,
  onChange,
  topics,
  value
}: Readonly<{
  label: string;
  onChange: (topicId: string) => void;
  topics: Topic[];
  value: string;
}>): React.ReactElement {
  return (
    <label>
      {label}
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">No topic</option>
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuizSelect({
  label,
  onChange,
  quizzes,
  value
}: Readonly<{
  label: string;
  onChange: (quizId: string) => void;
  quizzes: Quiz[];
  value: string;
}>): React.ReactElement {
  return (
    <label>
      {label}
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Select quiz</option>
        {quizzes.map((quiz) => (
          <option key={quiz.id} value={quiz.id}>
            {quiz.title}
          </option>
        ))}
      </select>
    </label>
  );
}
