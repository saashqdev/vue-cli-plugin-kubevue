const spawnSync = require('child_process').spawnSync;
/**
 * Use spawn inherit to print directly to stdio
 */
module.exports = (command, onError) => {
    [command, ...args] = command.split(/\s+/);
    const result = spawnSync(command, args, { shell: true, stdio: 'inherit' });
    if (result.status) {
        onError && onError(result);
        process.exit(1);
    }
};
