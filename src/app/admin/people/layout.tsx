import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./admin.module.css";

export const runtime = "nodejs";

export default function AdminPeopleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className={`page-shell ${styles.admin}`} data-theme="admin">
      <Link href="/" className="wordmark" aria-label="Cherry Tree home">
        <span className="wordmark-label">
          Cherry <span>Tree</span>
        </span>
      </Link>
      {children}
    </main>
  );
}
