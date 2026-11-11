// Says plainly that this is a hiring-assignment replica. The parity evals hide it (declared waiver W1 in docs/EVALS_PLAN.md).
export function ReplicaNotice() {
  return (
    <p data-replica-notice className="mt-6 text-center text-[11px] text-muted-foreground">
      Replica built for a hiring assignment. Not affiliated with predicting.top. Data from its public API.
    </p>
  );
}
