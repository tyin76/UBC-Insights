import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";

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
    }
}