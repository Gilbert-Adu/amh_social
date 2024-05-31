function userIdCleaner(rawHeaders) {

    for (i = rawHeaders.length-1; i >= 0; i--) {
        if (rawHeaders[i].includes('http://')) {
            let result = rawHeaders[i].split('/');
            return result[result.length - 1];
            //let result = rawHeaders[i].split('/')
            //return result;

        }
    }

};

module.exports.userIdCleaner = userIdCleaner;