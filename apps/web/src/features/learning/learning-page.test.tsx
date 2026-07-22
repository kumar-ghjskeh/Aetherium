import type { AetheriumApiClient } from "@aetherium/api-client";
import type {
  Flashcard,
  FlashcardReview,
  LearningGoal,
  MasteryRecord,
  Question,
  Quiz,
  StudyRoadmap,
  StudySession,
  Subject,
  Topic,
  TopicPage
} from "@aetherium/shared-types";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createUnusedAchievementsClient,
  createUnusedAnalyticsClient,
  createUnusedCodingClient,
  createUnusedFilesClient,
  createUnusedHabitsClient,
  createUnusedLearningClient,
  createUnusedMentorsClient,
  createUnusedProjectsClient,
  createUnusedUsersClient
} from "../../test/api-client";
import { LearningPage } from "./learning-page";

const now = "2026-07-21T00:00:00Z";

const subject: Subject = {
  createdAt: now,
  description: "Hardware and systems topics.",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Computer Architecture",
  status: "active",
  updatedAt: now
};

const topic: Topic = {
  createdAt: now,
  description: "Instruction overlap and hazards.",
  id: "22222222-2222-4222-8222-222222222222",
  name: "Pipelining",
  status: "active",
  subjectId: subject.id,
  updatedAt: now
};

const mastery: MasteryRecord = {
  calculation: {
    method: "transparent_heuristic_v1",
    signals: { quizAccuracy: 0.8 }
  },
  confidenceScore: 0.75,
  createdAt: now,
  exerciseScore: 0.2,
  hintsPenalty: 0.1,
  id: "33333333-3333-4333-8333-333333333333",
  masteryScore: 0.56,
  projectEvidenceScore: 0,
  quizAccuracy: 0.8,
  reviewRecencyScore: 1,
  successfulRecallScore: 0.2,
  topicId: topic.id,
  updatedAt: now
};

const quiz: Quiz = {
  createdAt: now,
  id: "44444444-4444-4444-8444-444444444444",
  lessonId: null,
  status: "active",
  title: "Pipeline hazards",
  topicId: topic.id,
  updatedAt: now
};

const flashcard: Flashcard = {
  back: "A dependency between pipeline stages.",
  createdAt: now,
  front: "Data hazard",
  id: "55555555-5555-4555-8555-555555555555",
  status: "active",
  topicId: topic.id,
  updatedAt: now
};

const session: StudySession = {
  courseId: null,
  createdAt: now,
  durationMinutes: null,
  endedAt: null,
  id: "66666666-6666-4666-8666-666666666666",
  lessonId: null,
  mode: "quick_review",
  notes: "Review hazards.",
  startedAt: now,
  subjectId: subject.id,
  topicId: topic.id,
  updatedAt: now
};

function page<T>(items: T[]): { items: T[]; limit: number; offset: number; total: number } {
  return {
    items,
    limit: 30,
    offset: 0,
    total: items.length
  };
}

function requireElement(element: HTMLElement | null): HTMLElement {
  expect(element).not.toBeNull();
  if (element === null) {
    throw new Error("Expected element to exist.");
  }
  return element;
}

function createClient(overrides: Partial<AetheriumApiClient["learning"]> = {}): AetheriumApiClient {
  const reject = () => Promise.reject(new Error("Unexpected non-learning call"));

  return {
    ai: {
      answerDocumentQuestion: vi.fn(reject),
      completeChat: vi.fn(reject),
      createEmbeddings: vi.fn(reject),
      listConsent: vi.fn(reject),
      listModelConfigs: vi.fn(reject),
      listProviders: vi.fn(reject),
      listUsage: vi.fn(reject),
      streamChat: vi.fn(reject),
      updateConsent: vi.fn(reject),
      updateModelConfig: vi.fn(reject)
    },
    achievements: createUnusedAchievementsClient(),
    analytics: createUnusedAnalyticsClient(),
    auditLogs: { list: vi.fn(reject) },
    auth: {
      login: vi.fn(reject),
      logout: vi.fn(reject),
      me: vi.fn(reject),
      register: vi.fn(reject)
    },
    coding: createUnusedCodingClient(),
    domainEvents: { create: vi.fn(reject), list: vi.fn(reject) },
    files: createUnusedFilesClient(),
    habits: createUnusedHabitsClient(),
    health: { live: vi.fn(reject), ready: vi.fn(reject) },
    learning: {
      ...createUnusedLearningClient(),
      addQuestion: vi.fn(() =>
        Promise.resolve({
          choices: [],
          correctAnswer: null,
          createdAt: now,
          difficulty: 3,
          explanation: null,
          id: "77777777-7777-4777-8777-777777777777",
          position: 0,
          prompt: "What is a data hazard?",
          questionType: "free_text",
          quizId: quiz.id,
          updatedAt: now
        } satisfies Question)
      ),
      createFlashcard: vi.fn(() => Promise.resolve(flashcard)),
      createGoal: vi.fn(() =>
        Promise.resolve({
          createdAt: now,
          description: null,
          id: "88888888-8888-4888-8888-888888888888",
          status: "active",
          subjectId: null,
          targetDate: "2026-08-01",
          title: "Master hazards",
          topicId: topic.id,
          updatedAt: now
        } satisfies LearningGoal)
      ),
      createQuiz: vi.fn(() => Promise.resolve(quiz)),
      createRoadmap: vi.fn(() =>
        Promise.resolve({
          createdAt: now,
          description: null,
          id: "99999999-9999-4999-8999-999999999999",
          status: "active",
          steps: [{ label: "Review selected topic", topicId: topic.id }],
          subjectId: null,
          title: "CPU path",
          updatedAt: now
        } satisfies StudyRoadmap)
      ),
      createSession: vi.fn(() => Promise.resolve(session)),
      createSubject: vi.fn(() => Promise.resolve(subject)),
      createTopic: vi.fn(() => Promise.resolve(topic)),
      getMastery: vi.fn(() => Promise.resolve(mastery)),
      listCourses: vi.fn(() => Promise.resolve(page([]))),
      listFlashcards: vi.fn(() => Promise.resolve(page([]))),
      listGoals: vi.fn(() => Promise.resolve(page([]))),
      listQuizzes: vi.fn(() => Promise.resolve(page([]))),
      listResources: vi.fn(reject),
      listRoadmaps: vi.fn(() => Promise.resolve(page([]))),
      listSessions: vi.fn(() => Promise.resolve(page([]))),
      listSubjects: vi.fn(() => Promise.resolve(page([]))),
      listTopics: vi.fn(() => Promise.resolve(page([]))),
      reviewFlashcard: vi.fn(() =>
        Promise.resolve({
          confidence: 4,
          createdAt: now,
          flashcardId: flashcard.id,
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          nextReviewAt: "2026-07-28T00:00:00Z",
          rating: "good",
          reviewedAt: now,
          updatedAt: now
        } satisfies FlashcardReview)
      ),
      submitAttempt: vi.fn(() =>
        Promise.resolve({
          accuracy: 0.8,
          confidence: 5,
          createdAt: now,
          feedback: null,
          hintsUsed: 1,
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          maxScore: 10,
          questionId: null,
          quizId: quiz.id,
          score: 8,
          status: "completed",
          submittedAnswer: null,
          updatedAt: now
        })
      ),
      ...overrides
    },
    mentors: createUnusedMentorsClient(),
    notifications: { list: vi.fn(reject), markRead: vi.fn(reject) },
    projects: createUnusedProjectsClient(),
    search: { recent: vi.fn(reject), run: vi.fn(reject) },
    settings: { getPreferences: vi.fn(reject), updatePreferences: vi.fn(reject) },
    users: createUnusedUsersClient(),
    world: { getProfile: vi.fn(reject), updateProfile: vi.fn(reject), visit: vi.fn(reject) }
  };
}

describe("LearningPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading and then an empty learning state", async () => {
    let resolveTopics: (value: TopicPage) => void = () => undefined;
    const pendingTopics = new Promise<TopicPage>((resolve) => {
      resolveTopics = resolve;
    });
    const client = createClient({
      listTopics: vi.fn(() => pendingTopics)
    });

    render(<LearningPage client={client} />);

    expect(screen.getByText("Loading learning records...")).toBeInTheDocument();
    resolveTopics(page([]));

    expect(
      await screen.findByText("No topics yet. Create a subject and topic to begin.")
    ).toBeInTheDocument();
  });

  it("creates subjects and topics through shared validation", async () => {
    const client = createClient({
      listSubjects: vi
        .fn()
        .mockResolvedValueOnce(page([]))
        .mockResolvedValue(page([subject])),
      listTopics: vi
        .fn()
        .mockResolvedValueOnce(page([]))
        .mockResolvedValue(page([topic]))
    });

    render(<LearningPage client={client} />);

    await screen.findByText("No topics yet. Create a subject and topic to begin.");
    await userEvent.type(screen.getByLabelText("Subject name"), "Computer Architecture");
    await userEvent.click(screen.getByRole("button", { name: "Create subject" }));

    await waitFor(() =>
      expect(client.learning.createSubject).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Computer Architecture" })
      )
    );
    expect(await screen.findByText("Subject created.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Topic name"), "Pipelining");
    await userEvent.click(screen.getByRole("button", { name: "Create topic" }));

    await waitFor(() =>
      expect(client.learning.createTopic).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Pipelining" })
      )
    );
  });

  it("shows mastery and records quiz attempts", async () => {
    const client = createClient({
      listQuizzes: vi
        .fn()
        .mockResolvedValueOnce(page([quiz]))
        .mockResolvedValue(page([quiz])),
      listSubjects: vi.fn(() => Promise.resolve(page([subject]))),
      listTopics: vi.fn(() => Promise.resolve(page([topic])))
    });

    render(<LearningPage client={client} />);

    expect(await screen.findByText("56%")).toBeInTheDocument();
    const quizzesPanel = requireElement(
      screen.getByRole("heading", { name: "Quizzes" }).closest("section")
    );
    await userEvent.selectOptions(within(quizzesPanel).getByLabelText("Attempt quiz"), quiz.id);
    await userEvent.clear(within(quizzesPanel).getByLabelText("Score"));
    await userEvent.type(within(quizzesPanel).getByLabelText("Score"), "8");
    await userEvent.clear(within(quizzesPanel).getByLabelText("Max score"));
    await userEvent.type(within(quizzesPanel).getByLabelText("Max score"), "10");
    await userEvent.click(within(quizzesPanel).getByRole("button", { name: "Save attempt" }));

    await waitFor(() =>
      expect(client.learning.submitAttempt).toHaveBeenCalledWith(
        quiz.id,
        expect.objectContaining({ maxScore: 10, score: 8 })
      )
    );
    expect(
      await screen.findByText("Quiz attempt saved and mastery recalculated.")
    ).toBeInTheDocument();
  });

  it("creates sessions, goals, roadmaps, and flashcard reviews", async () => {
    const client = createClient({
      listFlashcards: vi.fn(() => Promise.resolve(page([flashcard]))),
      listSessions: vi.fn(() => Promise.resolve(page([session]))),
      listSubjects: vi.fn(() => Promise.resolve(page([subject]))),
      listTopics: vi.fn(() => Promise.resolve(page([topic])))
    });

    render(<LearningPage client={client} />);

    await screen.findByText("Data hazard");
    await userEvent.click(screen.getByRole("button", { name: "End" }));
    await waitFor(() => expect(client.learning.endSession).toHaveBeenCalledWith(session.id, {}));

    const flashcardPanel = requireElement(
      screen.getByRole("heading", { name: "Flashcards" }).closest("section")
    );
    await userEvent.click(within(flashcardPanel).getByRole("button", { name: "Good" }));
    await waitFor(() =>
      expect(client.learning.reviewFlashcard).toHaveBeenCalledWith(
        flashcard.id,
        expect.objectContaining({ rating: "good" })
      )
    );

    const planningPanel = requireElement(
      screen.getByRole("heading", { name: "Goals And Roadmaps" }).closest("section")
    );
    await userEvent.type(within(planningPanel).getByLabelText("Goal title"), "Master hazards");
    await userEvent.click(within(planningPanel).getByRole("button", { name: "Create goal" }));
    await waitFor(() => expect(client.learning.createGoal).toHaveBeenCalled());

    await userEvent.type(within(planningPanel).getByLabelText("Roadmap title"), "CPU path");
    await userEvent.click(within(planningPanel).getByRole("button", { name: "Create roadmap" }));
    await waitFor(() => expect(client.learning.createRoadmap).toHaveBeenCalled());
  });

  it("shows a readable error state when learning data is unavailable", async () => {
    const client = createClient({
      listTopics: vi.fn(() => Promise.reject(new Error("Learning service unavailable")))
    });

    render(<LearningPage client={client} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Learning service unavailable");
  });
});
