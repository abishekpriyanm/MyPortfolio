import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { fallbackPortfolioSnapshot } from "@/features/portfolio-content/fallback";
import { getPortfolioRepository } from "@/features/portfolio-content/supabaseRepository";
import { PortfolioRepositoryError } from "@/features/portfolio-content/repository";
import {
  getPublicationIssues,
  parsePortfolioSnapshot,
  type PortfolioSnapshot,
  type PublicationIssue,
} from "@/features/portfolio-content/schema";
import type { PortfolioVersion } from "@/features/portfolio-content/types";

type DraftContextValue = {
  draft: PortfolioVersion | null;
  content: PortfolioSnapshot;
  history: PortfolioVersion[];
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string;
  canCreateDraft: boolean;
  issues: PublicationIssue[];
  setContent: React.Dispatch<React.SetStateAction<PortfolioSnapshot>>;
  save(): Promise<boolean>;
  publish(): Promise<boolean>;
  rollback(id: string): Promise<boolean>;
  refresh(): Promise<void>;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export const DraftProvider = ({ children }: PropsWithChildren) => {
  const [draft, setDraft] = useState<PortfolioVersion | null>(null);
  const [content, setContentState] = useState<PortfolioSnapshot>(fallbackPortfolioSnapshot);
  const [history, setHistory] = useState<PortfolioVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [canCreateDraft, setCanCreateDraft] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const repository = getPortfolioRepository();
      const [nextDraft, nextHistory] = await Promise.all([
        repository.getDraft(),
        repository.listHistory(),
      ]);
      setDraft(nextDraft);
      setContentState(nextDraft.content);
      setHistory(nextHistory);
      setDirty(false);
      setCanCreateDraft(false);
    } catch (caught) {
      setDraft(null);
      setCanCreateDraft(caught instanceof PortfolioRepositoryError && caught.code === "not-found");
      setError(caught instanceof Error ? caught.message : "Unable to load the working draft.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void refresh(), [refresh]);

  const setContent: React.Dispatch<React.SetStateAction<PortfolioSnapshot>> = useCallback(
    (next) => {
      setContentState((current) => (typeof next === "function" ? next(current) : next));
      setDirty(true);
      setError("");
    },
    []
  );

  const save = async () => {
    if (!draft && !canCreateDraft) return false;
    setSaving(true);
    setError("");
    try {
      const validContent = parsePortfolioSnapshot(content);
      const updated = draft
        ? await getPortfolioRepository().saveDraft(draft.id, validContent, draft.updatedAt)
        : await getPortfolioRepository().createDraft(validContent);
      setDraft(updated);
      setContentState(updated.content);
      setDirty(false);
      setCanCreateDraft(false);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the draft.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!draft) return false;
    const currentIssues = getPublicationIssues(content);
    if (currentIssues.length) {
      setError("The draft has missing case-study fields. Fix the publish checklist first.");
      return false;
    }
    setSaving(true);
    setError("");
    try {
      let currentDraft = draft;
      if (dirty) {
        currentDraft = await getPortfolioRepository().saveDraft(
          draft.id,
          parsePortfolioSnapshot(content),
          draft.updatedAt
        );
      }
      await getPortfolioRepository().publish(currentDraft.id, currentDraft.updatedAt);
      await refresh();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish the draft.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const rollback = async (id: string) => {
    setSaving(true);
    setError("");
    try {
      await getPortfolioRepository().rollback(id);
      await refresh();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to restore that version.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const value = {
    draft,
    content,
    history,
    loading,
    saving,
    dirty,
    error,
    canCreateDraft,
    issues: getPublicationIssues(content),
    setContent,
    save,
    publish,
    rollback,
    refresh,
  };

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
};

export const useDraft = () => {
  const value = useContext(DraftContext);
  if (!value) throw new Error("useDraft must be used within DraftProvider");
  return value;
};
