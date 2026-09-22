import type { Metadata } from "next";
import Image from "next/image";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About Cherry Tree",
  description: "The family dedication behind Cherry Tree",
};

const dedications = [
  {
    image: "/grandma-dedication.jpg",
    name: "Virginia Pearl Salyer Cherry",
    years: "1917-2013",
  },
  {
    image: "/dad-dedication.png",
    name: "Ronald Wade Cherry",
    years: "1939-2024",
  },
];

export default function AboutPage() {
  return (
    <main className="page-shell">
      <article className={styles.content}>
        <header className={styles.introduction}>
          <h1>About Cherry Tree</h1>
          <p>Created for our family and dedicated to</p>
          <p className={styles.dedicationNames}>
            Virginia Cherry &amp; Ronald Cherry
          </p>
        </header>

        <div className={styles.portraits}>
          {dedications.map((dedication) => (
            <figure className={styles.portrait} key={dedication.name}>
              <Image
                className={styles.portraitImage}
                src={dedication.image}
                alt={dedication.name}
                width={200}
                height={200}
                priority
              />
              <figcaption>
                <span className={styles.portraitName}>{dedication.name}</span>
                <span className={styles.years}>{dedication.years}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true">
          <span />
          <Image src="/cherrytree.png" alt="" width={45} height={65} />
          <span />
        </div>

        <div className={styles.story}>
          <p>
            With 11 children, 42 grandchildren, and 104 great-grandchildren at
            the time of her death, Virginia Pearl Salyer Cherry is where the
            Cherry Tree genealogy begins. She lived to the age of 95, and her
            legacy continues through the generations of family who knew and
            loved her. With a family this large, remembering every name,
            birthday, and connection is no small task.
          </p>
          <p>
            That is why Ronald Wade Cherry created the original Cherry Tree
            website&mdash;a place dedicated to preserving and sharing the history
            of
            the Cherry family. The colors, layout, and imagery of this site are
            inspired by the original Cherry Tree page he created many years
            ago. My father enjoyed building and maintaining that site, and
            today I am proud to follow in his footsteps by continuing what he
            started.
          </p>
        </div>
      </article>
    </main>
  );
}
