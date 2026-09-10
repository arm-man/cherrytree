import Link from "next/link";

export default function AncestorNotFound() {
  return (
    <>
      <h1>Ancestor not found.</h1>
      <p>The requested Ancestor does not exist.</p>
      <Link href="/admin/people">Return to admin list</Link>
    </>
  );
}
