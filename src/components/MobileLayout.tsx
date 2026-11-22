import type { ReactNode } from "react";

type MobileLayoutProps = {
  children: ReactNode;
};

function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="app-background">
      <div className="mobile-container">
        {children}
      </div>
    </div>
  );
}

export default MobileLayout;