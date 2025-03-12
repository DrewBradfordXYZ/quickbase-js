const quickbase = require('./dist/umd/quickbase.umd.js'); const qb = quickbase({ realm: 'example', userToken: 'your-token' }); console.log(qb);
