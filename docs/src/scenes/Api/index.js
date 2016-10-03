import React from 'react';
import api from 'api/api.json';
import { Section } from './components';
import styles from './styles.scss';

const Api = () => (
  <div className={styles.wrapper}>
    {Object.keys(api).map(className =>
      <Section key={className} name={className} references={api[className]} />
    )}
  </div>
);

export default Api;
