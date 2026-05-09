const chalk = new Proxy({}, {
    get(target, prop) {
        if (prop === 'default' || prop === 'chalk') return chalk;
        if (typeof prop === 'string') return (...args) => args.join(' ');
        return chalk;
    }
});

module.exports = chalk;
