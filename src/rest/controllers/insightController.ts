import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import InsightFacade from "../../controller/InsightFacade";
import { NotFoundError } from "../../controller/IInsightFacade";

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
    query: async (req: any, res: any) => {
		try {

			// Handle the query
			const query = req.body;

			const facade = new InsightFacade();
			const insightResults = await facade.performQuery(query);

			res.status(StatusCodes.OK).json({ result: insightResults });
		} catch (err) {
			// More detailed error handling
			Log.error("Error in query:", err);
			const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
			res.status(StatusCodes.BAD_REQUEST).json({
				error: `Failed to add dataset: ${errorMessage}`,
			});
		}
	},
    removeDataset: async (req: any, res: any) => {
		try {
			const { id } = req.params;

			const facade = new InsightFacade();
			const idOfDatasetRemoved = await facade.removeDataset(id);

			res.status(StatusCodes.OK).json({ result: idOfDatasetRemoved });
		} catch (err) {
			// More detailed error handling

			Log.error("Error in removeDataset:", err);
			const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            
            if (err instanceof NotFoundError) {
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Failed to remove dataset: ${errorMessage}`,
                });
            }

            if (err instanceof NotFoundError) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: `Failed to add dataset: ${errorMessage}`,
                });
            }

            res.status(StatusCodes.BAD_REQUEST).json({
				error: `Failed to add dataset: ${errorMessage}`,
			});
		}
	},
};
