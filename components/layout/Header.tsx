import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="glass-panel sticky top-0 z-40 shadow-[0_20px_40px_rgba(13,27,52,0.06)]">
      <Container>
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-6">
            <p className="display-copy text-[1.75rem] italic text-foreground">
              SweetBook Studio
            </p>
            <div className="hidden h-4 w-px bg-outline md:block" />
            <p className="section-label hidden md:block">
              {"\uC5D0\uB514\uD1A0\uB9AC\uC5BC \uBAA8\uB178\uADF8\uB798\uD504 \uBAA8\uB4DC"}
            </p>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Button href="/#demo" variant="ghost">
              {"\uC1FC\uCF00\uC774\uC2A4"}
            </Button>
            <Button href="/studio/new">
              {"\uC0C8 \uD504\uB85C\uC81D\uD2B8"}
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
