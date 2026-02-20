import React, { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DragDropProvider, useDragDropMonitor, useDraggable, useDroppable } from "@dnd-kit/react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AntigravityBackground from "../../shared/components/AntigravityBackground";
import ConfirmModal from "../../shared/components/ConfirmModal";

const STORAGE_KEY = "studyflow:topics:list";
const TODO_ZONE_ID = "topics-zone-todo";
const DONE_ZONE_ID = "topics-zone-done";
const DRAG_TOPIC_PREFIX = "topics-drag-";
const DROP_TOPIC_PREFIX = "topics-drop-";

type TopicStatus = "todo" | "done";
type TopicFilter = "all" | TopicStatus;

type Topic = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

type TopicFormState = {
  title: string;
  description: string;
  dueDateLocal: string;
  status: TopicStatus;
};

const initialTopics: Topic[] = [
  {
    id: "1",
    title: "Estudar Node",
    description: "Revisar Express e Prisma para consolidar back-end.",
    dueDate: "2026-02-20T18:00:00.000Z",
    done: false,
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-10T10:00:00.000Z",
  },
  {
    id: "2",
    title: "Reforcar React Router",
    description: "Ajustar rotas protegidas e fluxo de autenticacao.",
    dueDate: "2026-02-22T20:30:00.000Z",
    done: false,
    createdAt: "2026-02-11T10:00:00.000Z",
    updatedAt: "2026-02-11T10:00:00.000Z",
  },
  {
    id: "3",
    title: "Planejar testes",
    description: "Definir cenarios de validacao para cadastro e login.",
    dueDate: "2026-02-18T16:00:00.000Z",
    done: true,
    createdAt: "2026-02-09T10:00:00.000Z",
    updatedAt: "2026-02-12T10:00:00.000Z",
  },
];

const emptyForm = (): TopicFormState => ({
  title: "",
  description: "",
  dueDateLocal: "",
  status: "todo",
});

const parseEntityId = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : typeof value === "symbol"
      ? value.toString()
      : "";

const getDragTopicId = (topicId: string) => `${DRAG_TOPIC_PREFIX}${topicId}`;
const getDropTopicId = (topicId: string) => `${DROP_TOPIC_PREFIX}${topicId}`;

const parseTopicIdFromEntityId = (entityId: string) => {
  if (entityId.startsWith(DRAG_TOPIC_PREFIX)) return entityId.slice(DRAG_TOPIC_PREFIX.length);
  if (entityId.startsWith(DROP_TOPIC_PREFIX)) return entityId.slice(DROP_TOPIC_PREFIX.length);
  return entityId;
};

const readTopics = (): Topic[] => {
  if (typeof window === "undefined") return initialTopics;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialTopics;
    const parsed = JSON.parse(raw) as Topic[];
    return Array.isArray(parsed) ? parsed : initialTopics;
  } catch {
    return initialTopics;
  }
};

const saveTopics = (topics: Topic[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
};

const formatDueDate = (iso: string) => {
  if (!iso) return "No due date";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
};

const toDateTimeLocal = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
};

const toIsoDate = (local: string) => {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};

const splitByStatus = (topics: Topic[]) => ({
  todo: topics.filter((t) => !t.done),
  done: topics.filter((t) => t.done),
});

const joinByStatus = (todo: Topic[], done: Topic[]) => [...todo, ...done];

const dedupeTopicsById = (topics: Topic[]) => {
  const seen = new Set<string>();
  return topics.filter((topic) => {
    if (seen.has(topic.id)) return false;
    seen.add(topic.id);
    return true;
  });
};

const reorderVisible = (list: Topic[], visibleIds: string[], sourceId: string, targetId: string) => {
  const ids = visibleIds.filter((id, i, all) => all.indexOf(id) === i);
  const from = ids.indexOf(sourceId);
  const to = ids.indexOf(targetId);
  if (from < 0 || to < 0 || from === to) return list;

  const nextIds = [...ids];
  const [moved] = nextIds.splice(from, 1);
  nextIds.splice(to, 0, moved);

  const byId = new Map(list.map((t) => [t.id, t]));
  const reorderedVisible = nextIds.map((id) => byId.get(id)).filter((t): t is Topic => Boolean(t));
  const visibleSet = new Set(ids);

  let cursor = 0;
  return list.map((t) => (visibleSet.has(t.id) ? (reorderedVisible[cursor++] ?? t) : t));
};

const moveAcrossStatus = (
  topics: Topic[],
  sourceId: string,
  targetStatus: TopicStatus,
  targetTopicId: string | null,
  updatedAt: string
) => {
  const { todo, done } = splitByStatus(topics);
  const nextTodo = [...todo];
  const nextDone = [...done];

  const idxTodo = nextTodo.findIndex((t) => t.id === sourceId);
  const idxDone = nextDone.findIndex((t) => t.id === sourceId);
  let source: Topic | undefined;

  if (idxTodo >= 0) source = nextTodo.splice(idxTodo, 1)[0];
  else if (idxDone >= 0) source = nextDone.splice(idxDone, 1)[0];
  if (!source) return topics;

  const moved: Topic = { ...source, done: targetStatus === "done", updatedAt };

  if (targetStatus === "todo") {
    const insertAt = targetTopicId ? nextTodo.findIndex((t) => t.id === targetTopicId) : -1;
    nextTodo.splice(insertAt >= 0 ? insertAt : nextTodo.length, 0, moved);
  } else {
    const insertAt = targetTopicId ? nextDone.findIndex((t) => t.id === targetTopicId) : -1;
    nextDone.splice(insertAt >= 0 ? insertAt : nextDone.length, 0, moved);
  }

  return dedupeTopicsById(joinByStatus(nextTodo, nextDone));
};

const matchesFilter = (topic: Topic, statusFilter: TopicFilter, search: string) => {
  const matchStatus = statusFilter === "all" ? true : statusFilter === "done" ? topic.done : !topic.done;
  if (!matchStatus) return false;
  if (!search) return true;
  const s = search.toLowerCase();
  return topic.title.toLowerCase().includes(s) || topic.description.toLowerCase().includes(s);
};
type CardProps = {
  topic: Topic;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
};

const SortableTopicCard = ({ topic, onEdit, onRequestDelete, onToggleDone }: CardProps) => {
  const { ref: dragRef, handleRef, isDragSource } = useDraggable({
    id: getDragTopicId(topic.id),
    data: { topicId: topic.id, status: topic.done ? "done" : "todo" },
  });
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: getDropTopicId(topic.id),
    data: { topicId: topic.id, status: topic.done ? "done" : "todo" },
  });

  const setRefs = (element: Element | null) => {
    dragRef(element);
    dropRef(element);
  };

  return (
    <motion.article
      ref={setRefs}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`rounded-2xl border p-4 transition ${
        isDropTarget ? "border-[var(--sf-300)] bg-[var(--sf-800)]/42" : "border-[var(--sf-700)] bg-[var(--sf-900)]/35"
      } ${isDragSource ? "opacity-75" : "opacity-100"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--sf-400)]">Topic #{topic.id}</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--sf-200)]">{topic.title}</h3>
        </div>
        <span
          className={
            topic.done
              ? "rounded-full border border-emerald-300/50 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-200"
              : "rounded-full border border-amber-300/50 bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-200"
          }
        >
          {topic.done ? "Done" : "To do"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--sf-300)]">{topic.description || "No description."}</p>

      <div className="mt-3 rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/30 px-3 py-2 text-xs text-[var(--sf-300)]">
        Due: <span className="text-[var(--sf-200)]">{formatDueDate(topic.dueDate)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          ref={handleRef}
          className="rounded-lg border border-[var(--sf-600)] bg-[var(--sf-800)]/55 px-2.5 py-1.5 text-[var(--sf-300)] transition hover:text-[var(--sf-200)]"
        >
          Drag
        </button>
        <button
          type="button"
          onClick={() => onToggleDone(topic.id)}
          className="rounded-lg border border-[var(--sf-600)] bg-[var(--sf-800)]/55 px-2.5 py-1.5 text-[var(--sf-300)] transition hover:text-[var(--sf-200)]"
        >
          {topic.done ? "Mark as to do" : "Mark as done"}
        </button>
        <button
          type="button"
          onClick={() => onEdit(topic.id)}
          className="rounded-lg border border-[var(--sf-600)] bg-[var(--sf-800)]/55 px-2.5 py-1.5 text-[var(--sf-300)] transition hover:text-[var(--sf-200)]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRequestDelete(topic.id)}
          className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-2.5 py-1.5 text-rose-200 transition hover:bg-rose-500/25"
        >
          Delete
        </button>
      </div>
    </motion.article>
  );
};

type TopicCardsProps = {
  topics: Topic[];
  emptyMessage: string;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
};

const TopicCards = ({ topics, emptyMessage, onEdit, onRequestDelete, onToggleDone }: TopicCardsProps) => {
  if (!topics.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="rounded-2xl border border-[var(--sf-700)] bg-[var(--sf-900)]/35 p-6 text-sm text-[var(--sf-300)]"
      >
        {emptyMessage}
      </motion.div>
    );
  }

  return (
    <div className="grid gap-3">
      {topics.map((topic) => (
        <SortableTopicCard
          key={topic.id}
          topic={topic}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
          onToggleDone={onToggleDone}
        />
      ))}
    </div>
  );
};

type TopicsColumnProps = {
  title: string;
  zoneId: string;
  topics: Topic[];
  emptyMessage: string;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
};

const TopicsColumn = ({ title, zoneId, topics, emptyMessage, onEdit, onRequestDelete, onToggleDone }: TopicsColumnProps) => {
  const { ref, isDropTarget } = useDroppable({ id: zoneId, data: { zoneId } });

  return (
    <section
      ref={ref}
      className={`rounded-2xl border p-3 transition ${
        isDropTarget
          ? "border-[var(--sf-300)] bg-[var(--sf-800)]/28 backdrop-blur-xl"
          : "border-[var(--sf-700)] bg-[var(--sf-900)]/22 backdrop-blur-xl"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-300)]">{title}</h2>
        <span className="rounded-full border border-[var(--sf-600)] bg-[var(--sf-800)]/40 px-2 py-1 text-xs text-[var(--sf-300)]">{topics.length}</span>
      </div>

      <TopicCards
        topics={topics}
        emptyMessage={emptyMessage}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
        onToggleDone={onToggleDone}
      />
    </section>
  );
};

type DropPayload = {
  sourceId: string;
  targetId: string;
  sourceStatus?: TopicStatus;
  targetStatus?: TopicStatus;
};

type DragMonitorProps = { onDrop: (payload: DropPayload) => void };

const TopicsDragMonitor = ({ onDrop }: DragMonitorProps) => {
  useDragDropMonitor({
    onDragEnd: (event) => {
      if (event.canceled) return;
      const sourceEntityId = parseEntityId(event.operation.source?.id);
      const targetEntityId = parseEntityId(event.operation.target?.id);
      const sourceData = event.operation.source?.data as { topicId?: string; status?: TopicStatus } | undefined;
      const targetData = event.operation.target?.data as
        | { topicId?: string; status?: TopicStatus; zoneId?: string }
        | undefined;

      const sourceId = sourceData?.topicId ?? parseTopicIdFromEntityId(sourceEntityId);
      const targetId = targetData?.topicId ?? parseTopicIdFromEntityId(targetEntityId);
      if (!sourceId || !targetId) return;

      const targetStatusFromData =
        targetData?.status ??
        (targetData?.zoneId === TODO_ZONE_ID
          ? "todo"
          : targetData?.zoneId === DONE_ZONE_ID
            ? "done"
            : undefined);

      onDrop({
        sourceId,
        targetId,
        sourceStatus: sourceData?.status,
        targetStatus: targetStatusFromData,
      });
    },
  });

  return null;
};
const TopicsPage = () => {
  const [topics, setTopics] = useState<Topic[]>(() => readTopics());
  const [statusFilter, setStatusFilter] = useState<TopicFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [form, setForm] = useState<TopicFormState>(() => emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Ready");

  const filteredTopics = useMemo(
    () => topics.filter((t) => matchesFilter(t, statusFilter, searchTerm.trim().toLowerCase())),
    [topics, statusFilter, searchTerm]
  );
  const filteredTodo = useMemo(() => filteredTopics.filter((t) => !t.done), [filteredTopics]);
  const filteredDone = useMemo(() => filteredTopics.filter((t) => t.done), [filteredTopics]);

  const totalTopics = topics.length;
  const totalTodo = topics.filter((t) => !t.done).length;
  const totalDone = topics.filter((t) => t.done).length;
  const topicPendingDelete = deletingTopicId ? topics.find((t) => t.id === deletingTopicId) ?? null : null;

  const updateTopics = (updater: (prev: Topic[]) => Topic[]) => {
    setTopics((prev) => {
      const next = dedupeTopicsById(updater(prev));
      saveTopics(next);
      return next;
    });
  };

  const openCreateEditor = () => {
    setEditorMode("create");
    setEditingTopicId(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const openEditEditor = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    if (!topic) return;
    setEditorMode("edit");
    setEditingTopicId(id);
    setForm({
      title: topic.title,
      description: topic.description,
      dueDateLocal: toDateTimeLocal(topic.dueDate),
      status: topic.done ? "done" : "todo",
    });
    setFormError(null);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditingTopicId(null);
    setForm(emptyForm());
    setFormError(null);
  };

  const handleSaveTopic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const title = form.title.trim();
    const description = form.description.trim();
    if (!title) {
      setFormError("Title is required.");
      return;
    }

    const dueDate = toIsoDate(form.dueDateLocal);
    if (form.dueDateLocal && !dueDate) {
      setFormError("Due date is invalid.");
      return;
    }

    const now = new Date().toISOString();

    if (editorMode === "create") {
      const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now());
      const created: Topic = { id, title, description, dueDate, done: form.status === "done", createdAt: now, updatedAt: now };
      updateTopics((prev) => [created, ...prev]);
      setFeedback("Topic created locally (ready to map to POST /api/topics).");
      closeEditor();
      return;
    }

    if (editorMode === "edit" && editingTopicId) {
      updateTopics((prev) =>
        prev.map((t) =>
          t.id === editingTopicId ? { ...t, title, description, dueDate, done: form.status === "done", updatedAt: now } : t
        )
      );
      setFeedback("Topic updated locally (ready to map to PUT/PATCH /api/topics/:id).");
      closeEditor();
    }
  };

  const handleToggleDone = (id: string) => {
    const now = new Date().toISOString();
    updateTopics((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done, updatedAt: now } : t)));
    setFeedback("Topic status updated locally (ready to map to PATCH /api/topics/:id).");
  };

  const handleDrop = ({ sourceId, targetId, sourceStatus: sourceHint, targetStatus: targetHint }: DropPayload) => {
    const source = topics.find((t) => t.id === sourceId);
    if (!source) return;

    const targetTopic = topics.find((t) => t.id === targetId) ?? null;
    const targetStatus: TopicStatus | null =
      targetHint ??
      (targetId === TODO_ZONE_ID
        ? "todo"
        : targetId === DONE_ZONE_ID
          ? "done"
          : targetTopic
            ? targetTopic.done
              ? "done"
              : "todo"
            : null);
    if (!targetStatus) return;

    const sourceStatus: TopicStatus = sourceHint ?? (source.done ? "done" : "todo");
    if (sourceId === targetId && sourceStatus === targetStatus) return;

    if (statusFilter !== "all") {
      if (sourceStatus !== targetStatus) return;
      const visibleIds = filteredTopics.map((t) => t.id);
      updateTopics((prev) => {
        const { todo, done } = splitByStatus(prev);
        return sourceStatus === "todo"
          ? joinByStatus(reorderVisible(todo, visibleIds, sourceId, targetId), done)
          : joinByStatus(todo, reorderVisible(done, visibleIds, sourceId, targetId));
      });
      setFeedback("Order updated locally.");
      return;
    }

    if (sourceStatus === targetStatus) {
      const visibleIds = sourceStatus === "todo" ? filteredTodo.map((t) => t.id) : filteredDone.map((t) => t.id);
      updateTopics((prev) => {
        const { todo, done } = splitByStatus(prev);
        return sourceStatus === "todo"
          ? joinByStatus(reorderVisible(todo, visibleIds, sourceId, targetId), done)
          : joinByStatus(todo, reorderVisible(done, visibleIds, sourceId, targetId));
      });
      setFeedback("Order updated locally.");
      return;
    }

    updateTopics((prev) => moveAcrossStatus(prev, sourceId, targetStatus, targetTopic?.id ?? null, new Date().toISOString()));
    setFeedback(targetStatus === "done" ? "Topic moved to Done." : "Topic moved to To do.");
  };

  const handleConfirmDelete = () => {
    if (!deletingTopicId) return;
    updateTopics((prev) => prev.filter((t) => t.id !== deletingTopicId));
    setFeedback("Topic removed locally (ready to map to DELETE /api/topics/:id).");
    if (editingTopicId === deletingTopicId) closeEditor();
    setDeletingTopicId(null);
  };

  return (
    <section className="relative h-screen overflow-hidden bg-[var(--sf-900)]/75 text-[var(--sf-200)]">
      <AntigravityBackground className="absolute inset-0 opacity-90" />

      <div className="relative z-10 mx-auto flex h-screen w-full max-w-[1480px] flex-col px-4 py-4 sm:px-6">
        <header className="rounded-2xl border border-[var(--sf-700)] bg-[var(--sf-900)]/22 px-4 py-3 shadow-[0_30px_80px_-50px_var(--sf-900)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--sf-400)]">StudyFlow</p>
              <h1 className="mt-1 text-xl font-semibold text-[var(--sf-200)]">Topics</h1>
              <p className="mt-1 text-xs text-[var(--sf-300)]">{feedback}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link to="/my-account" className="rounded-xl border border-[var(--sf-600)] bg-[var(--sf-800)]/50 px-3 py-2 text-[var(--sf-300)] transition hover:text-[var(--sf-200)]">My account</Link>
              <Link to="/login" className="rounded-xl border border-[var(--sf-600)] bg-[var(--sf-800)]/50 px-3 py-2 text-[var(--sf-300)] transition hover:text-[var(--sf-200)]">Login</Link>
            </div>
          </div>
        </header>

        <div className="mt-4 rounded-2xl border border-[var(--sf-700)] bg-[var(--sf-900)]/22 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setStatusFilter("all")} className={`rounded-xl border px-3 py-2 text-sm transition ${statusFilter === "all" ? "border-[var(--sf-300)] bg-[var(--sf-700)]/45 text-[var(--sf-200)]" : "border-[var(--sf-600)] bg-[var(--sf-800)]/35 text-[var(--sf-300)] hover:text-[var(--sf-200)]"}`}>All ({totalTopics})</button>
            <button type="button" onClick={() => setStatusFilter("todo")} className={`rounded-xl border px-3 py-2 text-sm transition ${statusFilter === "todo" ? "border-[var(--sf-300)] bg-[var(--sf-700)]/45 text-[var(--sf-200)]" : "border-[var(--sf-600)] bg-[var(--sf-800)]/35 text-[var(--sf-300)] hover:text-[var(--sf-200)]"}`}>To do ({totalTodo})</button>
            <button type="button" onClick={() => setStatusFilter("done")} className={`rounded-xl border px-3 py-2 text-sm transition ${statusFilter === "done" ? "border-[var(--sf-300)] bg-[var(--sf-700)]/45 text-[var(--sf-200)]" : "border-[var(--sf-600)] bg-[var(--sf-800)]/35 text-[var(--sf-300)] hover:text-[var(--sf-200)]"}`}>Done ({totalDone})</button>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filter by title or description" className="ml-auto w-full min-w-[240px] max-w-md rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/35 px-4 py-2.5 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40" />
            <button type="button" onClick={openCreateEditor} className="rounded-xl bg-[var(--sf-300)] px-4 py-2.5 text-sm font-semibold text-[var(--sf-900)] transition hover:bg-[var(--sf-200)]">New topic</button>
          </div>
        </div>

        {editorMode && (
          <form onSubmit={handleSaveTopic} className="mt-4 rounded-2xl border border-[var(--sf-700)] bg-[var(--sf-900)]/35 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--sf-200)]">{editorMode === "create" ? "Create topic" : "Edit topic"}</h2>
              <button type="button" onClick={closeEditor} className="rounded-lg border border-[var(--sf-600)] bg-[var(--sf-800)]/50 px-3 py-1.5 text-xs text-[var(--sf-300)] transition hover:text-[var(--sf-200)]">Cancel</button>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-2"><label htmlFor="topicTitle" className="text-sm text-[var(--sf-300)]">Title</label><input id="topicTitle" type="text" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Ex: Estudar TypeScript" className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/35 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40" /></div>
              <div className="space-y-2 lg:col-span-2"><label htmlFor="topicDescription" className="text-sm text-[var(--sf-300)]">Description</label><textarea id="topicDescription" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Describe this study topic" rows={3} className="w-full resize-none rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/35 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40" /></div>
              <div className="space-y-2"><label htmlFor="topicDueDate" className="text-sm text-[var(--sf-300)]">Due date</label><input id="topicDueDate" type="datetime-local" value={form.dueDateLocal} onChange={(e) => setForm((c) => ({ ...c, dueDateLocal: e.target.value }))} className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/35 px-4 py-3 text-sm text-[var(--sf-200)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40" /></div>
              <div className="space-y-2"><label htmlFor="topicStatus" className="text-sm text-[var(--sf-300)]">Status</label><select id="topicStatus" value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value === "done" ? "done" : "todo" }))} className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/35 px-4 py-3 text-sm text-[var(--sf-200)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"><option value="todo">To do</option><option value="done">Done</option></select></div>
            </div>
            {formError && <p className="mt-3 rounded-xl border border-rose-300/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{formError}</p>}
            <button type="submit" className="mt-4 rounded-xl bg-[var(--sf-300)] px-4 py-3 text-sm font-semibold text-[var(--sf-900)] transition hover:bg-[var(--sf-200)]">{editorMode === "create" ? "Create topic" : "Save changes"}</button>
          </form>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--sf-700)] bg-[var(--sf-900)]/22 p-3 shadow-[0_40px_90px_-50px_var(--sf-900)] backdrop-blur-xl">
          <DragDropProvider>
            <TopicsDragMonitor onDrop={handleDrop} />
            <div className="h-full overflow-y-auto pr-1">
              {statusFilter === "all" ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  <TopicsColumn title="To do" zoneId={TODO_ZONE_ID} topics={filteredTodo} emptyMessage="No to-do topics for this filter." onEdit={openEditEditor} onRequestDelete={setDeletingTopicId} onToggleDone={handleToggleDone} />
                  <TopicsColumn title="Done" zoneId={DONE_ZONE_ID} topics={filteredDone} emptyMessage="No done topics for this filter." onEdit={openEditEditor} onRequestDelete={setDeletingTopicId} onToggleDone={handleToggleDone} />
                </div>
              ) : (
                <TopicsColumn title={statusFilter === "todo" ? "To do" : "Done"} zoneId={statusFilter === "todo" ? TODO_ZONE_ID : DONE_ZONE_ID} topics={filteredTopics} emptyMessage="No topics found for this filter." onEdit={openEditEditor} onRequestDelete={setDeletingTopicId} onToggleDone={handleToggleDone} />
              )}
            </div>
          </DragDropProvider>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(topicPendingDelete)}
        title="Delete topic?"
        description={topicPendingDelete ? `This will permanently remove "${topicPendingDelete.title}".` : undefined}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setDeletingTopicId(null)}
        onConfirm={handleConfirmDelete}
        danger
      />
    </section>
  );
};

export default TopicsPage;
