if (location.pathname.startsWith('/dev/simulator')) void import('./simulator-ui');
else if (location.pathname.startsWith('/editor')) void import('./app');
else void import('./home');
export {};
