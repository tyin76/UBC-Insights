const express = require("express");
const insightRouter = express.Router();
const controller = require("../controllers/insightController.ts");

insightRouter.post("/echo/:msg", controller.echo);
insightRouter.put("/dataset/:id/:kind", controller.addDataset);
insightRouter.delete("/dataset/:id", controller.removeDataset);
insightRouter.get("/datasets", controller.listDatasets);

export default insightRouter;
