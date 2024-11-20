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
			const { id, kind } = req.params;

			// Handle the ZIP content
			const content = req.body;

			const facade = new InsightFacade();
			const arrayOfID = await facade.addDataset(id, content.toString("base64"), kind);

			res.status(StatusCodes.OK).json({ result: arrayOfID });
		} catch (err) {
			// More detailed error handling
			Log.error("Error in addDataset:", err);
			const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
			res.status(StatusCodes.BAD_REQUEST).json({
				error: `Failed to add dataset: ${errorMessage}`,
			});
		}
	},
};
