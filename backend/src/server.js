import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Watchtower API running at http://${HOST}:${PORT}`);
});