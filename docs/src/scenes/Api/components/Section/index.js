import React from 'react';
import styles from './styles.scss';

const Method = ({ name, reference }) => {
  console.log('reference.tags:', reference.tags);
  const tags = reference.tags;

  if (!tags) return null;
  if (!tags[0]) return null;
  if (tags[0].title !== 'method') return null;

  tags.shift();

  return (
    <div className={styles.method}>
      <h2>{name}#{reference.tags[0].name}</h2>
    </div>
  );
};

const Section = ({ name, references }) => (
  <div className={styles.wrapper}>
    <h1 className={styles.heading}>{name}</h1>
    {references.map(reference =>
      <Method name={name} reference={reference} />
    )}
  </div>
);

export default Section;
