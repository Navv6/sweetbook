import { Card } from "@/components/ui/Card";

export function DemoCard({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-xl bg-surface-container-low p-8 shadow-none">
      <p className="display-copy text-3xl text-foreground">
        {`0${index}.`}
      </p>
      <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
      <p className="editorial-copy mt-4 text-sm">{description}</p>
    </Card>
  );
}
