import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import birthcake from "../../../../public/birthcake.jpg";
import styles from "./admin.module.css";

export const runtime = "nodejs";

export default function AdminPeopleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className={`page-shell ${styles.admin}`}>
      <Link href="/" className="wordmark" aria-label="Cherry Tree home">
        <Image src={birthcake} alt="" className="wordmark-icon" />
        <span className="wordmark-label">
          Cherry <span>Tree</span>
        </span>
      </Link>
      {children}
    </main>
  );
}
