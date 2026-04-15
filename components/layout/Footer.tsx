import Link from "next/link";
import { Container } from "@/components/layout/Container";

export function Footer() {
  return (
    <footer className="border-t border-outline/50 bg-surface-container-lowest">
      <Container>
        <div className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <p className="display-copy text-2xl text-foreground">
              SweetBook Studio
            </p>
            <p className="editorial-copy mt-3 text-sm">
              소중한 순간을 한 권의 포토북으로 간직하세요.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="section-label mb-4">플로우</p>
              <ul className="space-y-3 text-sm text-secondary">
                <li><Link href="/studio/new" className="hover:text-foreground transition-colors">템플릿 선택</Link></li>
                <li><span className="text-outline-strong">에디터</span></li>
                <li><span className="text-outline-strong">결제</span></li>
                <li><span className="text-outline-strong">주문 확인</span></li>
              </ul>
            </div>
            <div>
              <p className="section-label mb-4">서비스</p>
              <ul className="space-y-3 text-sm text-secondary">
                <li><span className="text-outline-strong">고객센터</span></li>
                <li><span className="text-outline-strong">이용약관</span></li>
                <li><span className="text-outline-strong">개인정보처리방침</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-outline/50 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">
            SweetBook Studio — 나만의 포토북 제작 서비스
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">
            © SweetBook Studio
          </p>
        </div>
      </Container>
    </footer>
  );
}
