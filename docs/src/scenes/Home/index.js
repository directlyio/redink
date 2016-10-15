import React from 'react';
import { Gist } from 'components';
import styles from './styles.scss';

const Home = () => (
  <div className={styles.wrapper}>
    <h1 className="heading">
      RethinkDB model layer that makes complex business-logic easy
    </h1>
    <p className="paragraph">
      Redink provides some simple abtractions that make performing complex relationial operations
      easy.
    </p>
    <Gist id="dylnslck/4d4a86b1b58f859479dbe2c17a3c65e2" />
  </div>
);

export default Home;
