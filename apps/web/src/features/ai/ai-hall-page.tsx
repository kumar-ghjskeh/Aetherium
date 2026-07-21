"use client";

import type { AetheriumApiClient } from "@aetherium/api-client";
import { AetheriumApiError } from "@aetherium/api-client";
import type {
  Conversation,
  ConversationMemoryPolicy,
  DocumentQAMode,
  DocumentQAResponse,
  Mentor,
  MentorTone,
  Message,
  VaultFile
} from "@aetherium/shared-types";
import React from "react";

import { createBrowserApiClient } from "../auth/auth-provider";

type DataStatus = "loading" | "ready" | "error";
type SendStatus = "idle" | "loading";
type DocumentQAStatus = "idle" | "loading";
type PermissionToggle = "allowConversations" | "allowFileContent" | "allowProfileData";

interface MentorFormState {
  description: string;
  fictionalIdentity: string;
  name: string;
  systemInstructions: string;
  tone: MentorTone;
}

const emptyMentorForm: MentorFormState = {
  description: "",
  fictionalIdentity: "",
  name: "",
  systemInstructions: "",
  tone: "calm"
};

const documentModes: Array<{ label: string; value: DocumentQAMode }> = [
  { label: "Explain", value: "explain" },
  { label: "Summarize", value: "summarize" },
  { label: "Compare", value: "compare" },
  { label: "Quiz me", value: "quiz_me" },
  { label: "Flashcards", value: "create_flashcards" },
  { label: "Tasks", value: "extract_tasks" },
  { label: "Study notes", value: "create_study_notes" },
  { label: "Contradictions", value: "identify_contradictions" }
];

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "The AI Hall is unavailable.";
}

export function AiHallPage({
  client
}: Readonly<{
  client?: AetheriumApiClient;
}>): React.ReactElement {
  const apiClient = React.useMemo(() => client ?? createBrowserApiClient(), [client]);
  const [status, setStatus] = React.useState<DataStatus>("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [mentors, setMentors] = React.useState<Mentor[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [selectedMentorId, setSelectedMentorId] = React.useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const [messageStatus, setMessageStatus] = React.useState<DataStatus>("ready");
  const [messageError, setMessageError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [sendStatus, setSendStatus] = React.useState<SendStatus>("idle");
  const [editTarget, setEditTarget] = React.useState<Message | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [showMentorForm, setShowMentorForm] = React.useState(false);
  const [mentorForm, setMentorForm] = React.useState<MentorFormState>(emptyMentorForm);
  const [mentorFormError, setMentorFormError] = React.useState<string | null>(null);
  const [renameTitle, setRenameTitle] = React.useState("");
  const [exportPreview, setExportPreview] = React.useState<string | null>(null);
  const [readyFiles, setReadyFiles] = React.useState<VaultFile[]>([]);
  const [documentQuestion, setDocumentQuestion] = React.useState("");
  const [documentMode, setDocumentMode] = React.useState<DocumentQAMode>("explain");
  const [selectedDocumentFileId, setSelectedDocumentFileId] = React.useState("");
  const [documentAnswer, setDocumentAnswer] = React.useState<DocumentQAResponse | null>(null);
  const [documentStatus, setDocumentStatus] = React.useState<DocumentQAStatus>("idle");
  const [documentError, setDocumentError] = React.useState<string | null>(null);
  const [filesUnavailable, setFilesUnavailable] = React.useState(false);
  const skipMessageLoadForConversation = React.useRef<string | null>(null);

  const selectedMentor = React.useMemo(
    () => mentors.find((mentor) => mentor.id === selectedMentorId) ?? null,
    [mentors, selectedMentorId]
  );
  const selectedConversation = React.useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  React.useEffect(() => {
    let isActive = true;
    async function loadHall(): Promise<void> {
      setStatus("loading");
      setError(null);
      try {
        const [mentorPage, conversationPage] = await Promise.all([
          apiClient.mentors.list(),
          apiClient.mentors.listConversations({
            includeArchived: true,
            limit: 25,
            offset: 0
          })
        ]);
        if (!isActive) {
          return;
        }
        setMentors(mentorPage.items);
        setConversations(conversationPage.items);
        setSelectedConversationId((current) => current ?? conversationPage.items[0]?.id ?? null);
        setSelectedMentorId(
          (current) =>
            current ?? conversationPage.items[0]?.mentorId ?? mentorPage.items[0]?.id ?? null
        );
        setStatus("ready");
        try {
          const filePage = await apiClient.files.list({ limit: 50, offset: 0 });
          if (!isActive) {
            return;
          }
          setReadyFiles(
            filePage.items.filter(
              (file) => file.processingStatus === "ready" && file.deletionStatus === "active"
            )
          );
          setFilesUnavailable(false);
        } catch {
          if (isActive) {
            setFilesUnavailable(true);
          }
        }
      } catch (loadError) {
        if (!isActive) {
          return;
        }
        setError(friendlyError(loadError));
        setStatus("error");
      }
    }

    void loadHall();
    return () => {
      isActive = false;
    };
  }, [apiClient]);

  React.useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setMessageStatus("ready");
      setMessageError(null);
      return;
    }

    if (skipMessageLoadForConversation.current === selectedConversationId) {
      skipMessageLoadForConversation.current = null;
      setMessageStatus("ready");
      setMessageError(null);
      return;
    }

    let isActive = true;
    const conversationId = selectedConversationId;
    async function loadMessages(): Promise<void> {
      setMessageStatus("loading");
      setMessageError(null);
      setExportPreview(null);
      try {
        const page = await apiClient.mentors.listMessages(conversationId, {
          limit: 50,
          offset: 0
        });
        if (!isActive) {
          return;
        }
        setMessages(page.items);
        setMessageStatus("ready");
      } catch (loadError) {
        if (!isActive) {
          return;
        }
        setMessageError(friendlyError(loadError));
        setMessageStatus("error");
      }
    }

    void loadMessages();
    return () => {
      isActive = false;
    };
  }, [apiClient, selectedConversationId]);

  React.useEffect(() => {
    setRenameTitle(selectedConversation?.title ?? "");
  }, [selectedConversation?.id, selectedConversation?.title]);

  async function startConversation(mentor: Mentor): Promise<Conversation> {
    const conversation = await apiClient.mentors.createConversation({
      mentorId: mentor.id,
      title: `Conversation with ${mentor.name}`
    });
    skipMessageLoadForConversation.current = conversation.id;
    setConversations((current) => [conversation, ...current]);
    setSelectedMentorId(mentor.id);
    setSelectedConversationId(conversation.id);
    setMessages([]);
    setNotice("Conversation started.");
    return conversation;
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      setMessageError("Write a message before sending.");
      return;
    }
    if (!selectedMentor) {
      setMessageError("Select an AI mentor first.");
      return;
    }

    setSendStatus("loading");
    setMessageError(null);
    setNotice(null);
    try {
      const conversation = selectedConversation ?? (await startConversation(selectedMentor));
      const response = editTarget
        ? await apiClient.mentors.editAndResendMessage(conversation.id, editTarget.id, { content })
        : await apiClient.mentors.sendMessage(conversation.id, { content });
      setMessages((current) => [
        ...current,
        ...(response.userMessage ? [response.userMessage] : []),
        response.assistantMessage
      ]);
      setConversations((current) =>
        current.some((item) => item.id === response.conversation.id)
          ? current.map((item) =>
              item.id === response.conversation.id ? response.conversation : item
            )
          : [response.conversation, ...current]
      );
      setSelectedConversationId(response.conversation.id);
      setDraft("");
      setEditTarget(null);
      setNotice(editTarget ? "Edited message sent." : "Mentor response received.");
    } catch (sendError) {
      setMessageError(friendlyError(sendError));
      if (selectedConversationId) {
        const page = await apiClient.mentors.listMessages(selectedConversationId, {
          limit: 50,
          offset: 0
        });
        setMessages(page.items);
      }
    } finally {
      setSendStatus("idle");
    }
  }

  async function handleCreateMentor(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMentorFormError(null);
    if (mentorForm.systemInstructions.trim().length < 20) {
      setMentorFormError("System instructions must be at least 20 characters.");
      return;
    }
    try {
      const mentor = await apiClient.mentors.create({
        allowedTools: ["explain"],
        description: mentorForm.description,
        fictionalIdentity: mentorForm.fictionalIdentity,
        name: mentorForm.name,
        systemInstructions: mentorForm.systemInstructions,
        tone: mentorForm.tone
      });
      setMentors((current) => [...current, mentor]);
      setSelectedMentorId(mentor.id);
      setMentorForm(emptyMentorForm);
      setShowMentorForm(false);
      setNotice("Custom AI mentor created.");
    } catch (createError) {
      setMentorFormError(friendlyError(createError));
    }
  }

  async function handleRenameConversation(): Promise<void> {
    if (!selectedConversation || !renameTitle.trim()) {
      return;
    }
    try {
      const updated = await apiClient.mentors.updateConversation(selectedConversation.id, {
        title: renameTitle.trim()
      });
      setConversations((current) =>
        current.map((conversation) => (conversation.id === updated.id ? updated : conversation))
      );
      setNotice("Conversation renamed.");
    } catch (renameError) {
      setMessageError(friendlyError(renameError));
    }
  }

  async function handleArchiveConversation(conversation: Conversation): Promise<void> {
    try {
      const updated = await apiClient.mentors.archiveConversation(conversation.id);
      setConversations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice("Conversation archived.");
    } catch (archiveError) {
      setMessageError(friendlyError(archiveError));
    }
  }

  async function handleDeleteConversation(conversation: Conversation): Promise<void> {
    if (!window.confirm("Delete this AI conversation from Aetherium?")) {
      return;
    }
    try {
      await apiClient.mentors.deleteConversation(conversation.id);
      setConversations((current) => current.filter((item) => item.id !== conversation.id));
      if (selectedConversationId === conversation.id) {
        setSelectedConversationId(null);
        setMessages([]);
      }
      setNotice("Conversation deleted.");
    } catch (deleteError) {
      setMessageError(friendlyError(deleteError));
    }
  }

  async function handleToggleMemory(conversation: Conversation): Promise<void> {
    const nextEnabled = !conversation.memorySettings.memoryEnabled;
    const nextPolicy: ConversationMemoryPolicy = nextEnabled ? "persistent" : "disabled";
    try {
      const memorySettings = await apiClient.mentors.updateMemory(conversation.id, {
        memoryEnabled: nextEnabled,
        memoryPolicy: nextPolicy
      });
      setConversations((current) =>
        current.map((item) => (item.id === conversation.id ? { ...item, memorySettings } : item))
      );
      setNotice(nextEnabled ? "Conversation memory enabled." : "Conversation memory disabled.");
    } catch (memoryError) {
      setMessageError(friendlyError(memoryError));
    }
  }

  async function handleTogglePermission(mentor: Mentor, field: PermissionToggle): Promise<void> {
    try {
      const updatedPermissions = await apiClient.mentors.updatePermissions(mentor.id, {
        [field]: !mentor.permissions[field]
      });
      setMentors((current) =>
        current.map((item) =>
          item.id === mentor.id ? { ...item, permissions: updatedPermissions } : item
        )
      );
      setNotice("Mentor permissions updated.");
    } catch (permissionError) {
      setMessageError(friendlyError(permissionError));
    }
  }

  async function handleRegenerate(message: Message): Promise<void> {
    if (!selectedConversation) {
      return;
    }
    setSendStatus("loading");
    setMessageError(null);
    try {
      const response = await apiClient.mentors.regenerateMessage(
        selectedConversation.id,
        message.id
      );
      setMessages((current) => [...current, response.assistantMessage]);
      setConversations((current) =>
        current.some((item) => item.id === response.conversation.id)
          ? current.map((item) =>
              item.id === response.conversation.id ? response.conversation : item
            )
          : [response.conversation, ...current]
      );
      setNotice("Mentor response regenerated.");
    } catch (regenerateError) {
      setMessageError(friendlyError(regenerateError));
    } finally {
      setSendStatus("idle");
    }
  }

  async function handleStopGeneration(): Promise<void> {
    if (!selectedConversation) {
      return;
    }
    try {
      await apiClient.mentors.stopGeneration(selectedConversation.id);
      setNotice("Generation stopped.");
    } catch (stopError) {
      setMessageError(friendlyError(stopError));
    }
  }

  async function handleExportConversation(conversation: Conversation): Promise<void> {
    try {
      const exported = await apiClient.mentors.exportConversation(conversation.id);
      const sourceCount = exported.messages.reduce(
        (total, message) => total + message.sources.length,
        0
      );
      setExportPreview(
        `${exported.conversation.title} - ${exported.messages.length} messages, ${sourceCount} sources`
      );
      setNotice("Conversation export prepared.");
    } catch (exportError) {
      setMessageError(friendlyError(exportError));
    }
  }

  async function handleDocumentQuestion(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const question = documentQuestion.trim();
    if (question.length < 3) {
      setDocumentError("Write a document question first.");
      return;
    }
    setDocumentStatus("loading");
    setDocumentError(null);
    setDocumentAnswer(null);
    try {
      const answer = await apiClient.ai.answerDocumentQuestion({
        fileIds: selectedDocumentFileId ? [selectedDocumentFileId] : undefined,
        maxSources: 4,
        mode: documentMode,
        question
      });
      setDocumentAnswer(answer);
      setNotice(
        answer.evidenceStatus === "supported"
          ? "Document answer generated with citations."
          : "No supporting document evidence was found."
      );
    } catch (questionError) {
      if (
        questionError instanceof AetheriumApiError &&
        questionError.code === "ai_data_consent_required"
      ) {
        setDocumentError("File-content access is not enabled for document Q&A.");
      } else {
        setDocumentError(friendlyError(questionError));
      }
    } finally {
      setDocumentStatus("idle");
    }
  }

  async function handleEnableDocumentAccess(): Promise<void> {
    setDocumentError(null);
    try {
      await apiClient.ai.updateConsent("document_qa", { allowFileContent: true });
      setNotice("Document Q&A file access enabled.");
    } catch (consentError) {
      setDocumentError(friendlyError(consentError));
    }
  }

  if (status === "loading") {
    return (
      <section className="content-stack" aria-busy="true">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Mentors</p>
            <h1>AI Hall</h1>
          </div>
        </header>
        <section className="work-panel">Loading AI mentors...</section>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="content-stack">
        <header className="page-heading">
          <div>
            <p className="eyebrow">Mentors</p>
            <h1>AI Hall</h1>
          </div>
        </header>
        <section className="inline-alert" role="alert">
          {error ?? "The AI Hall is unavailable."}
        </section>
      </section>
    );
  }

  return (
    <section className="content-stack ai-hall-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Mentors</p>
          <h1>AI Hall</h1>
        </div>
        <button
          className="primary-action"
          onClick={() => setShowMentorForm((current) => !current)}
          type="button"
        >
          {showMentorForm ? "Close mentor form" : "Create mentor"}
        </button>
      </header>

      {notice ? (
        <section className="inline-success" aria-live="polite">
          {notice}
        </section>
      ) : null}

      {messageError ? (
        <section className="inline-alert" role="alert">
          {messageError}
        </section>
      ) : null}

      {showMentorForm ? (
        <CreateMentorForm
          error={mentorFormError}
          form={mentorForm}
          onChange={setMentorForm}
          onSubmit={(event) => void handleCreateMentor(event)}
        />
      ) : null}

      <div className="ai-hall-grid">
        <section className="work-panel">
          <div className="vault-panel-header">
            <div>
              <h2>Mentors</h2>
              <p className="empty-note">Fictional AI mentors with explicit data permissions.</p>
            </div>
            <span className="state-pill">{mentors.length}</span>
          </div>
          {mentors.length === 0 ? (
            <p className="empty-note">No mentors are available.</p>
          ) : (
            <div className="mentor-list">
              {mentors.map((mentor) => (
                <button
                  aria-pressed={mentor.id === selectedMentorId}
                  className="mentor-row"
                  key={mentor.id}
                  onClick={() => {
                    setSelectedMentorId(mentor.id);
                    setNotice(null);
                  }}
                  type="button"
                >
                  <span aria-hidden="true">{mentor.name.slice(0, 1).toUpperCase()}</span>
                  <strong>{mentor.name}</strong>
                  <small>{mentor.description}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="work-panel">
          <div className="vault-panel-header">
            <div>
              <h2>Conversations</h2>
              <p className="empty-note">Archive and delete actions remain user initiated.</p>
            </div>
            <button
              className="secondary-action"
              disabled={!selectedMentor}
              onClick={() => selectedMentor && void startConversation(selectedMentor)}
              type="button"
            >
              Start
            </button>
          </div>
          {conversations.length === 0 ? (
            <p className="empty-note">No AI conversations yet.</p>
          ) : (
            <div className="conversation-list">
              {conversations.map((conversation) => (
                <button
                  aria-pressed={conversation.id === selectedConversationId}
                  className="conversation-row"
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversationId(conversation.id);
                    setSelectedMentorId(conversation.mentorId);
                  }}
                  type="button"
                >
                  <strong>{conversation.title}</strong>
                  <small>
                    {conversation.mentorName} - {conversation.status} - {conversation.messageCount}{" "}
                    messages
                  </small>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="work-panel document-qa-panel">
        <div className="vault-panel-header">
          <div>
            <h2>Document Q&A</h2>
            <p className="empty-note">Answers are limited to retrieved Personal Vault citations.</p>
          </div>
          <span className="state-pill">{readyFiles.length} ready files</span>
        </div>

        {documentError ? (
          <section className="inline-alert" role="alert">
            <span>{documentError}</span>
            {documentError.includes("File-content access") ? (
              <button
                className="secondary-action"
                onClick={() => void handleEnableDocumentAccess()}
                type="button"
              >
                Enable access
              </button>
            ) : null}
          </section>
        ) : null}

        {filesUnavailable ? (
          <p className="empty-note">Ready vault files could not be loaded.</p>
        ) : null}

        <form className="document-qa-form" onSubmit={(event) => void handleDocumentQuestion(event)}>
          <label>
            Answer mode
            <select
              onChange={(event) => setDocumentMode(event.target.value as DocumentQAMode)}
              value={documentMode}
            >
              {documentModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source file
            <select
              onChange={(event) => setSelectedDocumentFileId(event.target.value)}
              value={selectedDocumentFileId}
            >
              <option value="">All processed files</option>
              {readyFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="document-question-field">
            Question
            <textarea
              onChange={(event) => setDocumentQuestion(event.target.value)}
              value={documentQuestion}
            />
          </label>
          <button className="primary-action" disabled={documentStatus === "loading"} type="submit">
            {documentStatus === "loading" ? "Asking" : "Ask documents"}
          </button>
        </form>

        {readyFiles.length === 0 && !filesUnavailable ? (
          <p className="empty-note">No processed Vault files are ready for document Q&A.</p>
        ) : null}

        {documentAnswer ? (
          <article className="document-answer">
            <header>
              <strong>
                {documentAnswer.evidenceStatus === "supported"
                  ? "Source-backed answer"
                  : "Insufficient evidence"}
              </strong>
              <small>
                {documentAnswer.retrieval.retrievedCount} sources - semantic{" "}
                {documentAnswer.retrieval.semanticEnabled ? "on" : "off"}
              </small>
            </header>
            <div className="message-body">{renderMessageContent(documentAnswer.answer)}</div>
            {documentAnswer.citations.length > 0 ? (
              <ol className="citation-list">
                {documentAnswer.citations.map((citation) => (
                  <li key={citation.chunkId}>
                    <a href={citation.openUrl}>
                      [{citation.label}] {citation.fileName}
                    </a>
                    <span>
                      {citation.pageNumber ? ` page ${citation.pageNumber}` : ""}
                      {citation.sectionLabel ? ` ${citation.sectionLabel}` : ""}
                    </span>
                    <p>{citation.snippet}</p>
                  </li>
                ))}
              </ol>
            ) : null}
          </article>
        ) : null}
      </section>

      <div className="ai-chat-layout">
        <section className="work-panel ai-chat-panel">
          <header className="vault-panel-header">
            <div>
              <h2>{selectedConversation?.title ?? selectedMentor?.name ?? "Conversation"}</h2>
              <p className="empty-note">
                Mentor chat uses the AI gateway without automatic access to private files.
              </p>
            </div>
            {selectedConversation ? (
              <span className="status-token">{selectedConversation.status}</span>
            ) : null}
          </header>

          {selectedConversation ? (
            <div className="conversation-tools">
              <label>
                Conversation title
                <input
                  onChange={(event) => setRenameTitle(event.target.value)}
                  value={renameTitle}
                />
              </label>
              <button
                className="secondary-action"
                onClick={() => void handleRenameConversation()}
                type="button"
              >
                Rename
              </button>
              <button
                className="secondary-action"
                onClick={() => void handleToggleMemory(selectedConversation)}
                type="button"
              >
                {selectedConversation.memorySettings.memoryEnabled
                  ? "Disable memory"
                  : "Enable memory"}
              </button>
              <button
                className="secondary-action"
                onClick={() => void handleExportConversation(selectedConversation)}
                type="button"
              >
                Export
              </button>
              <button
                className="secondary-action"
                onClick={() => void handleArchiveConversation(selectedConversation)}
                type="button"
              >
                Archive
              </button>
              <button
                className="danger-action"
                onClick={() => void handleDeleteConversation(selectedConversation)}
                type="button"
              >
                Delete
              </button>
            </div>
          ) : null}

          {exportPreview ? <p className="empty-note">{exportPreview}</p> : null}

          <div className="chat-stream" aria-live="polite">
            {messageStatus === "loading" ? <p className="empty-note">Loading messages...</p> : null}
            {messageStatus === "error" ? (
              <p className="empty-note">Conversation messages could not be loaded.</p>
            ) : null}
            {messageStatus === "ready" && messages.length === 0 ? (
              <p className="empty-note">Ask a mentor to begin a real conversation.</p>
            ) : null}
            {messages.map((message) => (
              <article
                className={`message-row message-row-${message.role} ${
                  message.status === "failed" ? "message-row-failed" : ""
                }`}
                key={message.id}
              >
                <header>
                  <strong>{message.role === "user" ? "You" : "AI mentor"}</strong>
                  <small>{message.status}</small>
                </header>
                <div className="message-body">{renderMessageContent(message.content)}</div>
                <div className="message-actions">
                  {message.role === "user" ? (
                    <button
                      className="secondary-action"
                      onClick={() => {
                        setEditTarget(message);
                        setDraft(message.content);
                      }}
                      type="button"
                    >
                      Edit and resend
                    </button>
                  ) : null}
                  {message.role === "assistant" && message.status === "complete" ? (
                    <button
                      className="secondary-action"
                      disabled={sendStatus === "loading"}
                      onClick={() => void handleRegenerate(message)}
                      type="button"
                    >
                      Regenerate
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <form className="ai-message-form" onSubmit={(event) => void handleSend(event)}>
            {editTarget ? (
              <p className="empty-note">
                Editing an earlier message. Submitting creates a new turn and keeps history intact.
              </p>
            ) : null}
            <label>
              Message
              <textarea
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask for an explanation, quiz, plan, or code review"
                value={draft}
              />
            </label>
            <div>
              <button className="primary-action" disabled={sendStatus === "loading"} type="submit">
                {sendStatus === "loading" ? "Sending" : editTarget ? "Send edit" : "Send"}
              </button>
              <button
                className="secondary-action"
                disabled={!selectedConversation || sendStatus !== "loading"}
                onClick={() => void handleStopGeneration()}
                type="button"
              >
                Stop
              </button>
              {editTarget ? (
                <button
                  className="secondary-action"
                  onClick={() => {
                    setEditTarget(null);
                    setDraft("");
                  }}
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <aside className="ai-side-panels">
          <section className="work-panel">
            <h2>Mentor profile</h2>
            {selectedMentor ? (
              <dl className="detail-list">
                <dt>Identity</dt>
                <dd>{selectedMentor.fictionalIdentity}</dd>
                <dt>Tone</dt>
                <dd>{selectedMentor.tone}</dd>
                <dt>Tools</dt>
                <dd>{selectedMentor.permissions.allowedTools.join(", ")}</dd>
              </dl>
            ) : (
              <p className="empty-note">Select a mentor to inspect access.</p>
            )}
          </section>

          {selectedMentor ? (
            <section className="work-panel">
              <h2>Data access</h2>
              <div className="permission-grid">
                <label>
                  <input
                    checked={selectedMentor.permissions.allowFileContent}
                    onChange={() => void handleTogglePermission(selectedMentor, "allowFileContent")}
                    type="checkbox"
                  />
                  File content
                </label>
                <label>
                  <input
                    checked={selectedMentor.permissions.allowConversations}
                    onChange={() =>
                      void handleTogglePermission(selectedMentor, "allowConversations")
                    }
                    type="checkbox"
                  />
                  Conversations
                </label>
                <label>
                  <input
                    checked={selectedMentor.permissions.allowProfileData}
                    onChange={() => void handleTogglePermission(selectedMentor, "allowProfileData")}
                    type="checkbox"
                  />
                  Profile data
                </label>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function CreateMentorForm({
  error,
  form,
  onChange,
  onSubmit
}: Readonly<{
  error: string | null;
  form: MentorFormState;
  onChange: (next: MentorFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}>): React.ReactElement {
  return (
    <form className="work-panel create-mentor-form" onSubmit={onSubmit}>
      <h2>Custom mentor</h2>
      {error ? (
        <section className="inline-alert" role="alert">
          {error}
        </section>
      ) : null}
      <label>
        Name
        <input
          maxLength={80}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          required
          value={form.name}
        />
      </label>
      <label>
        Fictional identity
        <input
          maxLength={160}
          onChange={(event) => onChange({ ...form, fictionalIdentity: event.target.value })}
          required
          value={form.fictionalIdentity}
        />
      </label>
      <label>
        Description
        <textarea
          maxLength={2000}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          required
          value={form.description}
        />
      </label>
      <label>
        System instructions
        <textarea
          maxLength={12000}
          onChange={(event) => onChange({ ...form, systemInstructions: event.target.value })}
          required
          value={form.systemInstructions}
        />
      </label>
      <label>
        Tone
        <select
          onChange={(event) => onChange({ ...form, tone: event.target.value as MentorTone })}
          value={form.tone}
        >
          <option value="calm">Calm</option>
          <option value="direct">Direct</option>
          <option value="analytical">Analytical</option>
          <option value="encouraging">Encouraging</option>
        </select>
      </label>
      <button className="primary-action" type="submit">
        Save mentor
      </button>
    </form>
  );
}

function renderMessageContent(content: string): React.ReactNode {
  const segments = content.split("```");
  return segments.map((segment, index) => {
    if (index % 2 === 1) {
      return <pre key={`${segment}-${index}`}>{segment.trim()}</pre>;
    }
    return <p key={`${segment}-${index}`}>{segment}</p>;
  });
}
