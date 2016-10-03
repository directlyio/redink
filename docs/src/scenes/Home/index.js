import React from 'react';
import styles from './styles.scss';

const Home = () => (
  <div className={styles.wrapper}>
    <div>
      <h1>Redink</h1>
    </div>
    <div>
      Redink is a RethinkDB ORM with a simple API that makes annoying business-logic less annoying.
    </div>
  </div>
);

export default Home;
