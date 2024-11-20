import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "./rest/Server";

/**
 * Main app class that is run with the node command. Starts the server.
 */
export class App {

	private serverInstance: Server | null = null;

	public async initServer(port: number): Promise<void> {
		Log.info(`App::initServer( ${port} ) - start`);

		this.serverInstance = new Server(port);
		return this.serverInstance
			.start()
			.then(() => {
				Log.info("App::initServer() - started");
			})
			.catch((err: Error) => {
				Log.error(`App::initServer() - ERROR: ${err.message}`);
			});
	}

	public async stopServer(): Promise<void> {

		if (!this.serverInstance) {
			Log.warn("App::stopServer() - No server instance to stop");
			return Promise.resolve(); // Nothing to stop
		}

		return this.serverInstance	
		.stop() // Assuming the `Server` class has a `stop` method
		.then(() => {
			Log.info("App::stopServer() - stopped");
			this.serverInstance = null; // Clear the server instance
		})
		.catch((err: Error) => {
			Log.error(`App::stopServer() - ERROR: ${err.message}`);
		});
	}
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
const app = new App();

export function startApp(): void {
	Log.info("App - starting");
	const port = 4321;
	(async (): Promise<void> => {
		await app.initServer(port);
	})();
}

export function stopApp(): void {
	app.stopServer();
}

startApp();
