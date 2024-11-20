const express = require("express");
const insightRouter = express.Router();
const controller = require("../controllers/insightController.ts");

insightRouter.post("/echo/:msg", controller.echo);
insightRouter.put("/dataset/:id/:kind", controller.addDataset);
insightRouter.post("/query", controller.query);
insightRouter.delete("/dataset/:id", controller.removeDataset);

export default insightRouter;
