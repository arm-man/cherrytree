import Link from "next/link";

export default function PersonNotFound() {
  return (
    <>
      <h1>Cherry Kin not found.</h1>
      <p>The requested Cherry Kin does not exist.</p>
      <Link href="/admin/people">Return to Cherry Kin &amp; Spouses</Link>
    </>
  );
}
