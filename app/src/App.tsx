import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { useReferral } from "@/pages/leaderboard/referral";

const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const KalshiLeaderboard = lazy(() => import("@/pages/kalshi-leaderboard"));
const Battle = lazy(() => import("@/pages/battle"));
const TraderProfile = lazy(() => import("@/pages/trader-profile"));
const ApiDocs = lazy(() => import("@/pages/api-docs"));
const Submit = lazy(() => import("@/pages/submit"));
const Terms = lazy(() => import("@/pages/terms"));

export default function App() {
  useReferral();
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/">{() => <Leaderboard platform="all" />}</Route>
        <Route path="/polymarket">{() => <Leaderboard platform="polymarket" />}</Route>
        <Route path="/kalshi" component={KalshiLeaderboard} />
        <Route path="/battle" component={Battle} />
        <Route path="/account/:wallet">{(p) => <TraderProfile id={p.wallet} />}</Route>
        <Route path="/api-docs" component={ApiDocs} />
        <Route path="/submit" component={Submit} />
        <Route path="/terms" component={Terms} />
        <Route>{() => <Leaderboard platform="all" />}</Route>
      </Switch>
    </Suspense>
  );
}
