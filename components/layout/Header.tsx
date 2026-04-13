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
            <p className="section-label hidden md:block">에디토리얼 스튜디오</p>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Button href="/#demo" variant="ghost">
              쇼케이스
            </Button>
            <Button href="/studio/new">새 프로젝트</Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
