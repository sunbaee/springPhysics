const express = require('express');
const app = express();
const port = 3000;

const router = require('./router.js');

app.use(express.static(__dirname + '/Public'));

app.get('/', router.index);

app.listen(port, (req, res) => {
    console.log(`>>> Listening on http://localhost:${port}`);
    console.log("\nRunning...");
});