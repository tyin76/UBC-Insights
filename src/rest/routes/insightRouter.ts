const express = require("express");
const insightRouter = express.Router();
const controller = require('../controllers/insightController.ts');

insightRouter.post('/echo/:msg', controller.echo);

export default insightRouter;