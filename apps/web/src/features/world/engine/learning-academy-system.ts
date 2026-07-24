import type {
  Course,
  CourseModule,
  CourseModulePage,
  CoursePage,
  FlashcardPage,
  LearningGoalPage,
  Lesson,
  LessonPage,
  MasteryRecord,
  QuizPage,
  StudyRoadmapPage,
  StudySessionPage,
  Subject,
  SubjectPage,
  Topic,
  TopicPage
} from "@aetherium/shared-types";

import type { Vector3Tuple } from "./camera-system";

export type AcademyAccessState = "guided" | "open" | "review";
export type LessonStationState = "active" | "completed" | "practice" | "review";

export interface LearningAcademyOverviewData {
  courses: CoursePage;
  flashcards: FlashcardPage;
  goals: LearningGoalPage;
  lessons: LessonPage;
  masteryRecords: MasteryRecord[];
  modules: CourseModulePage;
  quizzes: QuizPage;
  roadmaps: StudyRoadmapPage;
  sessions: StudySessionPage;
  subjects: SubjectPage;
  topics: TopicPage;
}

export interface SubjectWingViewModel {
  accessState: AcademyAccessState;
  color: string;
  courseCount: number;
  detail: string;
  id: string;
  label: string;
  masteryIntensity: number;
  masteryLabel: string;
  position: Vector3Tuple;
  topicCount: number;
}

export interface CourseHallViewModel {
  detail: string;
  id: string;
  illumination: number;
  label: string;
  lessonCount: number;
  moduleCount: number;
  position: Vector3Tuple;
  status: Course["status"];
}

export interface LessonStationViewModel {
  color: string;
  detail: string;
  id: string;
  label: string;
  position: Vector3Tuple;
  state: LessonStationState;
  topicLabel: string;
}

export interface LearningAcademyViewModel {
  activeGoalLabel: string;
  activeSessionLabel: string;
  courseCountLabel: string;
  courseHalls: CourseHallViewModel[];
  flashcardLabel: string;
  lessonCountLabel: string;
  lessonStations: LessonStationViewModel[];
  masteryAverageLabel: string;
  prerequisitePolicyLabel: string;
  quizLabel: string;
  roadmapLabel: string;
  subjectCountLabel: string;
  topicCountLabel: string;
  wings: SubjectWingViewModel[];
}

const SUBJECT_WING_POSITIONS: Vector3Tuple[] = [
  [-24, 2.2, -5],
  [24, 2.2, -5],
  [-18, 2.2, 14],
  [18, 2.2, 14],
  [0, 2.2, 22]
];

const COURSE_HALL_POSITIONS: Vector3Tuple[] = [
  [-15, 2.1, -18],
  [0, 2.1, -21],
  [15, 2.1, -18],
  [-11, 2.1, 2],
  [11, 2.1, 2],
  [0, 2.1, 9]
];

const LESSON_STATION_POSITIONS: Vector3Tuple[] = [
  [-22, 1.6, 30],
  [-15, 1.6, 35],
  [-8, 1.6, 38],
  [0, 1.6, 39],
  [8, 1.6, 38],
  [15, 1.6, 35],
  [22, 1.6, 30],
  [0, 1.6, 29]
];

const SUBJECT_COLORS = ["#d8f2ff", "#8be8ff", "#b9a8ff", "#f0c766", "#77d98b"];

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function normalizeMastery(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value > 1 ? Math.min(value / 100, 1) : Math.min(value, 1);
}

function percentLabel(value: number): string {
  return `${Math.round(normalizeMastery(value) * 100)}%`;
}

function topicLabel(topicId: string | null, topics: readonly Topic[]): string {
  if (!topicId) {
    return "No linked topic";
  }
  return topics.find((topic) => topic.id === topicId)?.name ?? "Linked topic";
}

function masteryForTopic(topicId: string | null, records: readonly MasteryRecord[]): number {
  if (!topicId) {
    return 0;
  }
  return normalizeMastery(records.find((record) => record.topicId === topicId)?.masteryScore ?? 0);
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function subjectMastery(
  subject: Subject,
  topics: readonly Topic[],
  records: readonly MasteryRecord[]
): number {
  const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id);
  return average(subjectTopics.map((topic) => masteryForTopic(topic.id, records)));
}

function courseMastery(
  course: Course,
  lessons: readonly Lesson[],
  modules: readonly CourseModule[],
  records: readonly MasteryRecord[]
): number {
  const moduleIds = new Set(
    modules.filter((module) => module.courseId === course.id).map((module) => module.id)
  );
  const courseLessons = lessons.filter((lesson) => moduleIds.has(lesson.moduleId));
  return average(courseLessons.map((lesson) => masteryForTopic(lesson.topicId, records)));
}

function resolveSubjectAccessState(
  subject: Subject,
  courses: readonly Course[],
  topics: readonly Topic[],
  records: readonly MasteryRecord[]
): AcademyAccessState {
  const subjectCourses = courses.filter((course) => course.subjectId === subject.id);
  const mastery = subjectMastery(subject, topics, records);
  if (mastery > 0 && mastery < 0.5) {
    return "review";
  }
  return subjectCourses.length > 0 ? "guided" : "open";
}

function lessonStationState(
  lesson: Lesson,
  quizzes: QuizPage,
  flashcards: FlashcardPage
): LessonStationState {
  if (lesson.status === "completed") {
    return "completed";
  }
  if (
    quizzes.items.some((quiz) => quiz.lessonId === lesson.id || quiz.topicId === lesson.topicId)
  ) {
    return "practice";
  }
  if (flashcards.items.some((flashcard) => flashcard.topicId === lesson.topicId)) {
    return "review";
  }
  return "active";
}

function lessonStationColor(state: LessonStationState): string {
  switch (state) {
    case "completed":
      return "#f0c766";
    case "practice":
      return "#8be8ff";
    case "review":
      return "#b9a8ff";
    case "active":
    default:
      return "#d8f2ff";
  }
}

function subjectDetail(
  accessState: AcademyAccessState,
  topicCount: number,
  courseCount: number
): string {
  if (accessState === "review") {
    return `${formatCount(topicCount, "topic")} with review recommended`;
  }
  if (accessState === "guided") {
    return `${formatCount(courseCount, "course")} and ${formatCount(topicCount, "topic")}`;
  }
  return `${formatCount(topicCount, "topic")} open for exploration`;
}

export function buildLearningAcademyViewModel(
  data: LearningAcademyOverviewData
): LearningAcademyViewModel {
  const activeGoals = data.goals.items.filter((goal) => goal.status === "active");
  const activeSessions = data.sessions.items.filter((session) => !session.endedAt);
  const masteryValues = data.masteryRecords.map((record) => normalizeMastery(record.masteryScore));
  const masteryAverage = average(masteryValues);

  return {
    activeGoalLabel:
      activeGoals.length > 0 ? (activeGoals[0]?.title ?? "Active learning goal") : "No active goal",
    activeSessionLabel:
      activeSessions.length > 0
        ? formatCount(activeSessions.length, "active session")
        : "No active session",
    courseCountLabel: formatCount(data.courses.total, "course"),
    courseHalls: data.courses.items.slice(0, COURSE_HALL_POSITIONS.length).map((course, index) => {
      const courseModules = data.modules.items.filter((module) => module.courseId === course.id);
      const moduleIds = new Set(courseModules.map((module) => module.id));
      const courseLessons = data.lessons.items.filter((lesson) => moduleIds.has(lesson.moduleId));
      const illumination = courseMastery(
        course,
        data.lessons.items,
        data.modules.items,
        data.masteryRecords
      );
      return {
        detail: `${formatCount(courseModules.length, "module")} - ${formatCount(
          courseLessons.length,
          "lesson"
        )}`,
        id: course.id,
        illumination,
        label: course.title,
        lessonCount: courseLessons.length,
        moduleCount: courseModules.length,
        position: COURSE_HALL_POSITIONS[index] ?? [0, 2.1, 0],
        status: course.status
      };
    }),
    flashcardLabel: formatCount(data.flashcards.total, "flashcard"),
    lessonCountLabel: formatCount(data.lessons.total, "lesson"),
    lessonStations: data.lessons.items
      .slice(0, LESSON_STATION_POSITIONS.length)
      .map((lesson, index) => {
        const state = lessonStationState(lesson, data.quizzes, data.flashcards);
        const minutes = lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : "No estimate";
        return {
          color: lessonStationColor(state),
          detail: `${state} - ${minutes}`,
          id: lesson.id,
          label: lesson.title,
          position: LESSON_STATION_POSITIONS[index] ?? [0, 1.6, 0],
          state,
          topicLabel: topicLabel(lesson.topicId, data.topics.items)
        };
      }),
    masteryAverageLabel: percentLabel(masteryAverage),
    prerequisitePolicyLabel:
      "Prerequisites are shown as guidance; owned learning records remain reachable.",
    quizLabel: formatCount(data.quizzes.total, "quiz"),
    roadmapLabel: formatCount(data.roadmaps.total, "roadmap"),
    subjectCountLabel: formatCount(data.subjects.total, "subject"),
    topicCountLabel: formatCount(data.topics.total, "topic"),
    wings: data.subjects.items.slice(0, SUBJECT_WING_POSITIONS.length).map((subject, index) => {
      const topicCount = data.topics.items.filter((topic) => topic.subjectId === subject.id).length;
      const courseCount = data.courses.items.filter(
        (course) => course.subjectId === subject.id
      ).length;
      const mastery = subjectMastery(subject, data.topics.items, data.masteryRecords);
      const accessState = resolveSubjectAccessState(
        subject,
        data.courses.items,
        data.topics.items,
        data.masteryRecords
      );
      return {
        accessState,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length] ?? "#d8f2ff",
        courseCount,
        detail: subjectDetail(accessState, topicCount, courseCount),
        id: subject.id,
        label: subject.name,
        masteryIntensity: mastery,
        masteryLabel: percentLabel(mastery),
        position: SUBJECT_WING_POSITIONS[index] ?? [0, 2.2, 0],
        topicCount
      };
    })
  };
}
