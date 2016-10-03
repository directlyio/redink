import 'normalize.css';
import 'styles/base.scss';

import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import styles from './styles.scss';

const App = ({ children }) => (
  <div className={styles.wrapper}>
    <div className={styles.nav}>
      <div className={styles.navItem}>
        <Link
          className={styles.navLink}
          activeClassName={styles.isActive}
          to="/about"
        >
          Redink
        </Link>
      </div>
      <div className={styles.navItem}>
        <Link
          className={styles.navLink}
          activeClassName={styles.isActive}
          to="/docs"
        >
          Docs
        </Link>
      </div>
      <div className={styles.navItem}>
        <Link
          className={styles.navLink}
          activeClassName={styles.isActive}
          to="/api"
        >
          API
        </Link>
      </div>
    </div>
    <div className={styles.outlet}>
      {children}
    </div>
  </div>
);

App.propTypes = {
  children: PropTypes.any,
};

export default App;
