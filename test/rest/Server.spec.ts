import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import Server from "../../src/rest/Server"; // Adjust path based on your project structure
import { getContentFromArchives } from "../TestUtil";
import { InsightDatasetKind } from "../../src/controller/IInsightFacade";

describe("Facade C3", function () {
	let serverInstance: Server;
	let validZipFile: string;
	const SERVER_URL = "http://localhost:4321"; // Replace with your actual server URL

	before(async function () {
		try {
			Log.info("Starting server...");
			validZipFile = await getContentFromArchives("pair.zip"); // getContentFromArchives already returns to base64
			//console.log(typeof validZipFile);
			serverInstance = new Server(4321); // Initialize the server instance with the appropriate port
			await serverInstance.start(); // Start the server
			Log.info("Server started successfully.");
		} catch (error) {
			Log.error("Error starting server:", error);
			throw error; // Fail the tests if the server cannot start
		}
	});

	after(async function () {
		try {
			Log.info("Stopping server...");
			await serverInstance.stop(); // Stop the server gracefully
			Log.info("Server stopped successfully.");
		} catch (error) {
			Log.error("Error stopping server:", error);
		}
	});

	beforeEach(function () {
		Log.info("Starting a new test...");
	});

	afterEach(function () {
		Log.info("Finished a test.");
	});

	// Sample on how to format PUT requests
	it("PUT test for courses dataset", function () {
		const id = "validID"; // Specify actual dataset ID
		const kind = InsightDatasetKind.Sections; // Specify actual kind
		const ENDPOINT_URL = `/dataset/${id}/${kind}`;
		const ZIP_FILE_DATA = validZipFile;

		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				})
				.catch(function () {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			Log.error(err);
			// and some more logging here!
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
