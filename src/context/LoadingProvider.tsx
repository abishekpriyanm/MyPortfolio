import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Loading from "../components/Loading";

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
  completeLoading: () => Promise<void>;
}

export const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);

  const loadingRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCompletedRef = useRef(false);

  const updateLoading = (val: number) => {
    loadingRef.current = val;
    setLoading(val);
  };

  const completeLoading = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (isCompletedRef.current && loadingRef.current >= 100) {
        resolve();
        return;
      }
      isCompletedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (loadingRef.current < 100) {
          updateLoading(loadingRef.current + 1);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          resolve();
        }
      }, 5);
    });
  }, []);

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    }

    const isSmallScreen = window.innerWidth <= 1024;

    if (isSmallScreen) {
      // Mobile and Tablet: progress ticks from 0% to 100% in ~1.2-1.4s
      intervalRef.current = setInterval(() => {
        if (loadingRef.current < 100) {
          const step = Math.floor(Math.random() * 4) + 2; // +2% to +5%
          const next = Math.min(100, loadingRef.current + step);
          updateLoading(next);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          isCompletedRef.current = true;
        }
      }, 35);
    } else {
      // Desktop: start progress right away from 0% to ~85%
      intervalRef.current = setInterval(() => {
        if (loadingRef.current < 85) {
          const step = Math.floor(Math.random() * 3) + 1; // +1% to +3%
          const next = Math.min(85, loadingRef.current + step);
          updateLoading(next);
        }
      }, 40);

      // Safety timeout for desktop: ensure loader completes even if 3D model takes too long
      const fallbackTimer = setTimeout(() => {
        if (!isCompletedRef.current) {
          completeLoading();
        }
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        clearTimeout(fallbackTimer);
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [completeLoading, isLoading]);

  const value: LoadingType = {
    isLoading,
    setIsLoading,
    setLoading: updateLoading,
    completeLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {isLoading && <Loading percent={loading} />}
      <main className="main-body">{children}</main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
