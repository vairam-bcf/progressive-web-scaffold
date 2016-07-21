/* eslint-env node */
/* eslint-disable import/no-commonjs */

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

const common = require('./common')

const filterDirectories = (items) => {
    return Promise.map(items, (item) => {
        return fs.statAsync(path.join(common.APP_CONTAINER_DIR, item))
            .then((stats) => { return stats.isDirectory() ? item : null })
    })
        .then(common.clearNulls)
}

const filterReducers = (dirs) => {
    return Promise.map(dirs, (dir) => {
        return fs.statAsync(path.join(common.APP_CONTAINER_DIR, dir, 'reducer.js'))
            .then((stats) => { return stats.isFile() ? dir : null })
            .catch(() => null)
    }).then(common.clearNulls)
}

const containersFromDirs = (dirs) => dirs.map((directory) => {
    return {
        directory,
        identifier: common.dashed2Camel(directory)
    }
})

const getContainers = () => {
    return fs.readdirAsync(common.APP_CONTAINER_DIR)
        .then(filterDirectories)
        .then(filterReducers)
        .then(containersFromDirs)
}

const generateRootReducer = () => {
    return Promise.resolve()
        .then(common.step('Finding container directories', getContainers))
        .then(common.step(
            'Generating root reducer program text\n',
            (containers) => common.transformFile(
                'reducers.template.js',
                {containers},
                common.container('reducers.js')
            )
        ))
}

module.exports = generateRootReducer

// run the code if we're called from the command line
if (require.main === module) {
    generateRootReducer()
        .then(() => common.greenWrite('Finished successfully\n'))
}