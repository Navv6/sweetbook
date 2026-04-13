import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-outline/50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(13,27,52,0.05)]">
      <Container>
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="display-copy text-[1.75rem] text-foreground hover:opacity-75 transition-opacity">
              SweetBook Studio
            </Link>
            <div className="hidden h-4 w-px bg-outline md:block" />
            <p className="section-label hidden md:block">에디토리얼 스튜디오</p>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Button href="/studio/new">새 프로젝트</Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
