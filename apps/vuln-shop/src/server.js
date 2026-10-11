const { createApp } = require("./app");

const port = Number(process.env.PORT || 3000);
const { app } = createApp();

app.listen(port, () => {
  console.log(`vuln-shop listening on http://localhost:${port}`);
});
