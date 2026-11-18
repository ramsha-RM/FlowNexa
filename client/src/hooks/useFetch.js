import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/format.js";

export const useFetch = (fetcher, deps = []) => {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });
  const fetcherRef = useRef(fetcher);
  const key = JSON.stringify([...deps, tick]);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;

    fetcherRef
      .current()
      .then((data) => {
        if (active) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (active) setResult({ key, data: null, error: getErrorMessage(error) });
      });

    return () => {
      active = false;
    };
  }, [key]);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  return {
    data: result.key === key ? result.data : null,
    error: result.key === key ? result.error : "",
    loading: result.key !== key,
    reload,
  };
};
