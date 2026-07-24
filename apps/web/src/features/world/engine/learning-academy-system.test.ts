import type {
  Course,
  CourseModule,
  CourseModulePage,
  CoursePage,
  Flashcard,
  FlashcardPage,
  LearningGoalPage,
  Lesson,
  LessonPage,
  MasteryRecord,
  Quiz,
  QuizPage,
  StudyRoadmapPage,
  StudySessionPage,
  Subject,
  SubjectPage,
  Topic,
  TopicPage
} from "@aetherium/shared-types";
import { describe, expect, it } from "vitest";

import { buildLearningAcademyViewModel } from "./learning-academy-system";

const createdAt = "2026-07-24T00:00:00Z";

const subject: Subject = {
  createdAt,
  description: "Systems learning",
  id: "subject-1",
  name: "Computer Architecture",
  status: "active",
  updatedAt: createdAt
};

const topic: Topic = {
  createdAt,
  description: "Pipeline hazards",
  id: "topic-1",
  name: "Pipelining",
  status: "active",
  subjectId: subject.id,
  updatedAt: createdAt
};

const course: Course = {
  createdAt,
  description: null,
  id: "course-1",
  status: "active",
  subjectId: subject.id,
  title: "Systems Path",
  updatedAt: createdAt
};

const moduleRecord: CourseModule = {
  courseId: course.id,
  createdAt,
  description: null,
  id: "module-1",
  position: 0,
  title: "CPU Basics",
  updatedAt: createdAt
};

const lesson: Lesson = {
  content: null,
  createdAt,
  estimatedMinutes: 25,
  id: "lesson-1",
  moduleId: moduleRecord.id,
  position: 0,
  status: "active",
  title: "Hazards",
  topicId: topic.id,
  updatedAt: createdAt
};

const quiz: Quiz = {
  createdAt,
  id: "quiz-1",
  lessonId: lesson.id,
  status: "active",
  title: "Pipeline Quiz",
  topicId: topic.id,
  updatedAt: createdAt
};

const flashcard: Flashcard = {
  back: "A dependency between stages.",
  createdAt,
  front: "Data hazard",
  id: "flashcard-1",
  status: "active",
  topicId: topic.id,
  updatedAt: createdAt
};

const mastery: MasteryRecord = {
  calculation: { method: "transparent_heuristic_v1" },
  confidenceScore: 0.7,
  createdAt,
  exerciseScore: 0.4,
  hintsPenalty: 0.1,
  id: "mastery-1",
  masteryScore: 0.42,
  projectEvidenceScore: 0,
  quizAccuracy: 0.8,
  reviewRecencyScore: 0.7,
  successfulRecallScore: 0.3,
  topicId: topic.id,
  updatedAt: createdAt
};

const subjects: SubjectPage = { items: [subject], limit: 8, offset: 0, total: 1 };
const topics: TopicPage = { items: [topic], limit: 8, offset: 0, total: 1 };
const courses: CoursePage = { items: [course], limit: 8, offset: 0, total: 1 };
const modules: CourseModulePage = { items: [moduleRecord], limit: 12, offset: 0, total: 1 };
const lessons: LessonPage = { items: [lesson], limit: 12, offset: 0, total: 1 };
const quizzes: QuizPage = { items: [quiz], limit: 8, offset: 0, total: 1 };
const flashcards: FlashcardPage = { items: [flashcard], limit: 8, offset: 0, total: 1 };
const goals: LearningGoalPage = {
  items: [
    {
      createdAt,
      description: null,
      id: "goal-1",
      status: "active",
      subjectId: subject.id,
      targetDate: null,
      title: "Master pipelining",
      topicId: topic.id,
      updatedAt: createdAt
    }
  ],
  limit: 8,
  offset: 0,
  total: 1
};
const sessions: StudySessionPage = { items: [], limit: 8, offset: 0, total: 0 };
const roadmaps: StudyRoadmapPage = {
  items: [
    {
      createdAt,
      description: null,
      id: "roadmap-1",
      status: "active",
      steps: [{ label: "Review hazards", topicId: topic.id }],
      subjectId: subject.id,
      title: "CPU Path",
      updatedAt: createdAt
    }
  ],
  limit: 8,
  offset: 0,
  total: 1
};

describe("learning academy system", () => {
  it("maps real learning records to wings, halls, lesson stations, and mastery labels", () => {
    const viewModel = buildLearningAcademyViewModel({
      courses,
      flashcards,
      goals,
      lessons,
      masteryRecords: [mastery],
      modules,
      quizzes,
      roadmaps,
      sessions,
      subjects,
      topics
    });

    expect(viewModel.subjectCountLabel).toBe("1 subject");
    expect(viewModel.topicCountLabel).toBe("1 topic");
    expect(viewModel.courseCountLabel).toBe("1 course");
    expect(viewModel.lessonCountLabel).toBe("1 lesson");
    expect(viewModel.activeGoalLabel).toBe("Master pipelining");
    expect(viewModel.masteryAverageLabel).toBe("42%");
    expect(viewModel.wings[0]).toMatchObject({
      accessState: "review",
      courseCount: 1,
      label: "Computer Architecture",
      masteryLabel: "42%",
      topicCount: 1
    });
    expect(viewModel.courseHalls[0]).toMatchObject({
      detail: "1 module - 1 lesson",
      illumination: 0.42,
      label: "Systems Path"
    });
    expect(viewModel.lessonStations[0]).toMatchObject({
      detail: "practice - 25 min",
      label: "Hazards",
      state: "practice",
      topicLabel: "Pipelining"
    });
  });

  it("keeps an empty academy honest without fabricated records", () => {
    const viewModel = buildLearningAcademyViewModel({
      courses: { items: [], limit: 8, offset: 0, total: 0 },
      flashcards: { items: [], limit: 8, offset: 0, total: 0 },
      goals: { items: [], limit: 8, offset: 0, total: 0 },
      lessons: { items: [], limit: 12, offset: 0, total: 0 },
      masteryRecords: [],
      modules: { items: [], limit: 12, offset: 0, total: 0 },
      quizzes: { items: [], limit: 8, offset: 0, total: 0 },
      roadmaps: { items: [], limit: 8, offset: 0, total: 0 },
      sessions: { items: [], limit: 8, offset: 0, total: 0 },
      subjects: { items: [], limit: 8, offset: 0, total: 0 },
      topics: { items: [], limit: 8, offset: 0, total: 0 }
    });

    expect(viewModel.subjectCountLabel).toBe("0 subjects");
    expect(viewModel.activeGoalLabel).toBe("No active goal");
    expect(viewModel.masteryAverageLabel).toBe("0%");
    expect(viewModel.wings).toEqual([]);
    expect(viewModel.courseHalls).toEqual([]);
    expect(viewModel.lessonStations).toEqual([]);
  });
});
