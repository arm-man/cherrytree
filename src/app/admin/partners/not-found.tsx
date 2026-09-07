import Link from "next/link";

export default function PartnerNotFound() {
  return (
    <>
      <h1>Spouse not found.</h1>
      <p>The requested Spouse does not exist.</p>
      <Link href="/admin/people">Return to Cherry Kin &amp; Spouses</Link>
    </>
  );
}
