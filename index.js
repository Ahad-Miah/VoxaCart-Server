const express = require('express');
const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('Backend er ma re noman chude!');
});

app.listen(port, () => {
  console.log(`Example app listeninggggggg on port ${port}`);
});