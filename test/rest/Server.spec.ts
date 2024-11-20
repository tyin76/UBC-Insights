import { expect } from "chai";
import request, { Response } from "supertest";
import { StatusCodes } from "http-status-codes";
import Log from "@ubccpsc310/folder-test/build/Log";
import { startApp, stopApp } from "../../src/App";
import { InsightDatasetKind } from "../../src/controller/IInsightFacade";
import { getContentFromArchives } from "../TestUtil";
import * as fs from "fs-extra";
import { buffer } from "stream/consumers";

async function getContent(name: string): Promise<Buffer> {
	const buffer = await fs.readFile("test/resources/archives/" + name);
	return buffer;
}

describe("Facade C3", function () {
	before(function () {
		// TODO: start server here once and handle errors properly
		//startApp();
	});

	after(function () {
		// TODO: stop server here once!
		stopApp();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	it("PUT test for adding sections dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const id = "valid123";
		const kind = InsightDatasetKind.Sections;
		const ENDPOINT_URL = `/dataset/${id}/${kind}`;
		const ZIP_FILE_DATA = await getContent("validSmall.zip");

		try {
			return await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				});
		} catch (err) {
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	it("DELETE test for delete sections dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const id = "valid123";
		const ENDPOINT_URL = `/dataset/${id}`;

		try {
			return await request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.OK);
				});
		} catch (err) {
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});
	it("DELETE test for delete sections dataset again (not found)", async function () {
		const SERVER_URL = "http://localhost:4321";
		const id = "valid123";
		const ENDPOINT_URL = `/dataset/${id}`;

		try {
			return await request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.NOT_FOUND);
				});
		} catch (err) {
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});
	it("DELETE invalid id", async function () {
		const SERVER_URL = "http://localhost:4321";
		const id = "vali___d123";
		const ENDPOINT_URL = `/dataset/${id}`;

		try {
			return await request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
				});
		} catch (err) {
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});
	it("PUT test for adding invalid sections dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const id = "valid123";
		const kind = InsightDatasetKind.Sections;
		const ENDPOINT_URL = `/dataset/${id}/${kind}`;
		const ZIP_FILE_DATA = await getContent("invalidSectionSmall.zip");

		try {
			return await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
				});
		} catch (err) {
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	it("PUT test for adding valid sections dataset with invalid ID", async function () {
		const SERVER_URL = "http://localhost:4321";
		const id = " ";
		const kind = InsightDatasetKind.Sections;
		const ENDPOINT_URL = `/dataset/${id}/${kind}`;
		const ZIP_FILE_DATA = await getContent("validSmall.zip");

		try {
			return await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(StatusCodes.BAD_REQUEST);
				});
		} catch (err) {
			Log.error(err);
			expect.fail();
			// and some more logging here!
		}
	});

	it("GET test for retrieving dataset list", async function () {
		const SERVER_URL = "http://localhost:4321";
		const ENDPOINT_URL = "/datasets";

		try {
			return await request(SERVER_URL)
				.get(ENDPOINT_URL)
				.set("Accept", "application/json")
				.then(function (res: Response) {
					expect(res.status).to.be.equal(StatusCodes.OK);
					expect(res.body).to.be.an("object"); // Ensure it's an object
					expect(res.body.result).to.be.an("array"); // Check the "result" field contains an array
				});
		} catch (err) {
			Log.error("Error during GET request:", err);
			expect.fail();
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
