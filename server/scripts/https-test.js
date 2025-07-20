const https = require('https');

const options = {
    protocol: 'https:',
    hostname: 'cop4331iscool.xyz',
    port: 443,
    method: 'POST',
    path: '/api/login',
    headers: {
        'Content-Type': 'application/json',
    }
};

const postBody = {
    "userLogin": "Post body",
    "userPassword" : "password"
}

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log(body)
        // if (res.statusCode / 2 === 100 ) {
        //     console.log('success')
        // }
        // else {
        //     console.log('failed')
        // }
    });
    res.on('error', () => {
        console.log('error');
        reject(Error('HTTP call failed'));
    });
});

req.write(JSON.stringify(postBody));
req.end();