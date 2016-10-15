import 'normalize.css';
import 'styles/base.scss';

import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { Icon } from 'react-fa';
import logo from 'assets/logo.svg';
import styles from './styles.scss';

const App = ({ children }) => (
  <div className={styles.wrapper}>
    <div className={styles.nav}>
      <div className={styles.navBrand}>
        <img src={logo} role="presentation" />
      </div>
      <div className={styles.navItem}>
        <Link
          className={styles.navLink}
          activeClassName={styles.isActive}
          to="/about"
        >
          About
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
      <div className={styles.outletHeader}>
        <div>
          <strong>Redink</strong>
        </div>
        <div>
          <Icon name="github" />
        </div>
      </div>
      <div className={styles.outletBody}>
        <div className={styles.outletWidth}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

App.propTypes = {
  children: PropTypes.any,
};

export default App;
