import styles from './Toast.module.css';

const Toast = ({ show, msg }) => (
  <div className={`${styles.toast} ${show ? styles.show : ''}`}>
    <div className={styles.icon}>
      <div className={styles.tick} />
    </div>
    <span>{msg}</span>
  </div>
);

export default Toast;