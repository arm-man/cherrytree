import Link from "next/link";

export default function PersonNotFound() {
  return (
    <>
      <h1>Person not found.</h1>
      <p>The requested Person does not exist.</p>
      <Link href="/admin/people">Return to People</Link>
    </>
  );
}
