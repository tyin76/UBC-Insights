import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import InsightFacade from "../../controller/InsightFacade";

function performEcho(msg: string): string {
	if (typeof msg !== "undefined" && msg !== null) {
		return `${msg}...${msg}`;
	} else {
		return "Message not provided";
	}
}

module.exports = {
	echo: async (req: any, res: any) => {
		try {
			Log.info(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = performEcho(req.params.msg);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: err });
		}
	},
	addDataset: async (req: any, res: any) => {
		try {
			// Log.info(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const { id, kind } = req.parms;
			const content = req.body;
			// assuming that the zip content is already base64
			// IF NOT, uncomment the below line
			// const contentToBase64 = content.toString("base64");
			const facade = new InsightFacade();
			const arrayOfID = facade.addDataset(id, content, kind);
			//const response = performEcho(req.params.msg);
			res.status(StatusCodes.OK).json({ result: arrayOfID });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: err });
		}
	},
};
