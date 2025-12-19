export const startTimer = (duration, onExpire) => {
    const timeout = setTimeout(onExpire, duration);
    return () => clearTimeout(timeout);
};