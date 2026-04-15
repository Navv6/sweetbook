import Link from "next/link";

const steps = [
  { label: "템플릿 · 판형", href: "/studio/new" },
  { label: "에디터", href: null },
  { label: "결제", href: null },
];

export function StepIndicator({
  currentStep,
  projectId,
}: {
  currentStep: 1 | 2 | 3;
  projectId?: string;
}) {
  const resolvedSteps = steps.map((step, index) => {
    let href = step.href;
    if (index === 1 && projectId) href = `/projects/${projectId}`;
    if (index === 2 && projectId) href = `/checkout/${projectId}`;
    return { ...step, href };
  });

  return (
    <div className="flex items-center gap-2">
      {resolvedSteps.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        const label = (
          <span
            className={`text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
              isCurrent
                ? "text-foreground"
                : isDone
                  ? "text-secondary"
                  : "text-outline-strong"
            }`}
          >
            {step.label}
          </span>
        );

        return (
          <div key={step.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  isCurrent
                    ? "bg-primary text-white"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-surface-container-high text-secondary"
                }`}
              >
                {isDone ? "✓" : stepNumber}
              </span>
              {isDone && step.href ? (
                <Link href={step.href} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              ) : (
                label
              )}
            </div>
            {index < resolvedSteps.length - 1 && (
              <span className="mx-1 text-outline-strong">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
