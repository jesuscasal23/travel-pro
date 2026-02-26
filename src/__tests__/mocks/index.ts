import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Create a fresh QueryClient wrapper for tests using React Query hooks. */
export function createTestQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

/** Shared framer-motion mock — handles all motion.* elements via Proxy. */
export function mockFramerMotion() {
  return {
    motion: new Proxy(
      {},
      {
        get:
          (_target: object, tag: string) =>
          ({
            children,
            ...rest
          }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
            const {
              animate,
              initial,
              exit,
              transition,
              variants,
              custom,
              whileInView,
              viewport,
              whileHover,
              whileTap,
              layout,
              ...htmlProps
            } = rest as Record<string, unknown>;
            void animate;
            void initial;
            void exit;
            void transition;
            void variants;
            void custom;
            void whileInView;
            void viewport;
            void whileHover;
            void whileTap;
            void layout;
            return React.createElement(
              tag,
              htmlProps as React.HTMLAttributes<HTMLElement>,
              children
            );
          },
      }
    ),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
}

/** Shared next/link mock — renders as plain <a>. */
export function mockNextLink() {
  return {
    default: ({
      children,
      href,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
      children?: React.ReactNode;
    }) => React.createElement("a", { href, ...props }, children),
  };
}

/** Shared Navbar mock — renders nothing. */
export function mockNavbar() {
  return { Navbar: () => null };
}
