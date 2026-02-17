import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

type RouteEntry = {
  path: string;
  element: ReactNode;
};

const KeepAlive = ({ routes }: { routes: RouteEntry[] }) => {
  const location = useLocation();
  const [mountedPaths, setMountedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMountedPaths((prev) => {
      if (prev.has(location.pathname)) return prev;
      const next = new Set(prev);
      next.add(location.pathname);
      return next;
    });
  }, [location.pathname]);

  return (
    <>
      {routes.map(({ path, element }) => {
        const isActive = location.pathname === path;
        const isMounted = mountedPaths.has(path);
        if (!isMounted) return null;
        return (
          <div
            key={path}
            style={{ display: isActive ? "block" : "none" }}
          >
            {element}
          </div>
        );
      })}
    </>
  );
};

export default KeepAlive;
