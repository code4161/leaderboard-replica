import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; /** A change of this value (the route) clears a caught error. */ resetKey?: string };
type State = { failed: boolean; resetKey?: string };

/** What the boundary does with an error, and when it lets go of it. Kept apart from React so it can be tested. */
export const boundaryState = {
  initial: (resetKey?: string): State => ({ failed: false, resetKey }),
  caught: (): Partial<State> => ({ failed: true }),
  next: (props: Pick<Props, "resetKey">, state: State): Partial<State> | null =>
    props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey },
};

/**
 * Keeps one page's exception from unmounting the whole app. It renders its children untouched until one
 * of them throws while rendering or in an effect; then it shows a short notice until the route changes.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = boundaryState.initial(this.props.resetKey);

  static getDerivedStateFromError(): Partial<State> {
    return boundaryState.caught();
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return boundaryState.next(props, state);
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("A page failed to render:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="page-error">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">This page could not be shown.</p>
          <a href="/" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">View Leaderboard</a>
        </div>
      </div>
    );
  }
}
