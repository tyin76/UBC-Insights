import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

function testStringArrayContents(stringArr: string[], toInclude: string): void {
	expect(stringArr).to.deep.include(toInclude);
}

function testStringNotInArrayContents(stringArr: string[], toNotInclude: string): void {
	expect(stringArr).to.not.deep.include(toNotInclude);
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let rooms: string;

	describe("listDatasets", function () {
		before(async function () {
			// This block runs once and loads the datasets.
			sections = await getContentFromArchives("validSmall.zip");

			// Just in case there is anything hanging around from a previous run of the test suite
			await clearDisk();
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should list out all datasets with correct ids [listDatasets]", async function () {
			try {
				await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);

				await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);
				const datasetArray = await facade.listDatasets();

				expect(datasetArray[0].id).be.equal("ubc1");
				expect(datasetArray[1].id).be.equal("ubc2");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should list out all datasets with correct ids when adding both sections and rooms [listDatasets]", async function () {
			try {
				const validRooms = await getContentFromArchives("campus.zip");

				await facade.addDataset("rooms", validRooms, InsightDatasetKind.Rooms);

				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				const datasetArray = await facade.listDatasets();

				expect(datasetArray[0].id).be.equal("rooms");
				expect(datasetArray[1].id).be.equal("sections");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should list out all datasets with correct ids with different instance of facade [listDatasets]", async function () {
			try {
				await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);

				await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);

				const newFacade = new InsightFacade();

				const datasetArray = await newFacade.listDatasets();

				expect(datasetArray[0].id).be.equal("ubc1");
				expect(datasetArray[1].id).be.equal("ubc2");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should list out all datasets with correct kinds [listDatasets]", async function () {
			try {
				await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);

				await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);
				const datasetArray = await facade.listDatasets();

				expect(datasetArray[0].kind).to.equal(InsightDatasetKind.Sections);
				expect(datasetArray[1].kind).to.equal(InsightDatasetKind.Sections);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should list out all datasets with correct row [listDatasets]", async function () {
			try {
				const rowsInDataset = 18;

				await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);

				await facade.addDataset("ubc2", sections, InsightDatasetKind.Sections);
				const datasetArray = await facade.listDatasets();

				expect(datasetArray[0].numRows).to.equal(rowsInDataset);
				expect(datasetArray[1].numRows).to.equal(rowsInDataset);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should list out all section datasets with correct row after adding room datasets [listDatasets]", async function () {
			try {
				const validRooms = await getContentFromArchives("campus.zip");

				const rowsInDataset = 18;

				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);

				await facade.addDataset("rooms", validRooms, InsightDatasetKind.Rooms);

				await facade.addDataset("sections2", sections, InsightDatasetKind.Sections);

				const datasetArray = await facade.listDatasets();

				const positionOfSections2 = 2;

				expect(datasetArray[0].numRows).to.equal(rowsInDataset);
				expect(datasetArray[positionOfSections2].numRows).to.equal(rowsInDataset);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should list out all datasets with correct kinds when adding room and section datasets [listDatasets]", async function () {
			try {
				const validRooms = await getContentFromArchives("campus.zip");

				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);

				await facade.addDataset("rooms", validRooms, InsightDatasetKind.Rooms);

				const datasetArray = await facade.listDatasets();

				expect(datasetArray[0].kind).to.equal(InsightDatasetKind.Sections);
				expect(datasetArray[1].kind).to.equal(InsightDatasetKind.Rooms);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});
	});

	describe("addDatasetRooms", function () {
		before(async function () {
			// This block runs once and loads the datasets.
			rooms = await getContentFromArchives("campus.zip");

			// Just in case there is anything hanging around from a previous run of the test suite
			await clearDisk();
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		// adding VALID building/room dataset
		it("adding a VALID dataset rooms/building [addDatasetRooms]", async function () {
			try {
				const validRooms = await getContentFromArchives("campus.zip");
				await facade.addDataset("ValidDataSet", validRooms, InsightDatasetKind.Rooms);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		// adding invalid data (missing index.htm file)
		it("adding invalid data, missing index.htm [addDatasetRooms]", async function () {
			try {
				const invalidMissingHtm = await getContentFromArchives("invalidCampusMissingHtm.zip");
				await facade.addDataset("invalid dataset missing index.htm", invalidMissingHtm, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding invalid data with no Tables
		it("adding invalid data with no Tables [addDatasetRooms]", async function () {
			try {
				const invalidNoTables = await getContentFromArchives("invalidCampusNoTables.zip");
				await facade.addDataset("invalid dataset with no Tables", invalidNoTables, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding valid building/room data with INVALID id
		it("adding a VALID dataset rooms/building with INVALID whitespace id [addDatasetRooms]", async function () {
			try {
				const validRooms = await getContentFromArchives("campus.zip");
				await facade.addDataset("    ", validRooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding a valid room dataset but putting SECTIONS as the KIND
		it("adding a valid room dataset but putting SECTIONS as the KIND [addDatasetRooms]", async function () {
			try {
				await facade.addDataset("validID", rooms, InsightDatasetKind.Sections);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding a valid sections dataset but putting ROOMS as the KIND
		it("adding a valid sections dataset but putting ROOMS as the KIND [addDatasetRooms]", async function () {
			try {
				await facade.addDataset("validID", sections, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// invalid NULL id with valid room data
		it("invalid NULL id with valid room data [addDatasetRooms]", async function () {
			try {
				await facade.addDataset(null as any, rooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding invalid data set that has NO VALID ROOMS
		it("adding invalid data set that has NO VALID ROOMS [addDatasetRooms]", async function () {
			try {
				const noValidRooms = await getContentFromArchives("noValidRoom.zip");
				await facade.addDataset("validID", noValidRooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding invalid id with invalid room data
		it("adding invalid id with invalid room data [addDatasetRooms]", async function () {
			try {
				const noValidRooms = await getContentFromArchives("noValidRoom.zip");
				await facade.addDataset("_", noValidRooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding invalid data, invalid, id, and incorrect kind
		it("adding invalid data, invalid, id, and incorrect kind [addDatasetRooms]", async function () {
			try {
				const noValidRooms = await getContentFromArchives("noValidRoom.zip");
				await facade.addDataset("_", noValidRooms, InsightDatasetKind.Sections);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding valid room data with invalid id and incorrect kind
		it("adding valid room data with invalid id and incorrect kind [addDatasetRooms]", async function () {
			try {
				await facade.addDataset("_", rooms, InsightDatasetKind.Sections);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		// adding valid id, with invalid room data
		it("adding valid id, with invalid room data [addDatasetRooms]", async function () {
			try {
				const invalidRooms = await getContentFromArchives("invalidCampusNoTables.zip");
				await facade.addDataset("validID", invalidRooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject adding a VALID room dataset when a section dataset with the same ID already exists", async function () {
			try {
				const validRooms = await getContentFromArchives("campus.zip");
				await facade.addDataset("duplicate", sections, InsightDatasetKind.Sections);
				await facade.addDataset("duplicate", validRooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject adding a VALID sections dataset when a room dataset with the same ID already exists", async function () {
			try {
				const validRooms = await getContentFromArchives("campus.zip");
				await facade.addDataset("duplicate", validRooms, InsightDatasetKind.Rooms);
				await facade.addDataset("duplicate", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	describe("removeDataset", function () {
		before(async function () {
			// This block runs once and loads the datasets.
			sections = await getContentFromArchives("validSmall.zip");

			// Just in case there is anything hanging around from a previous run of the test suite
			await clearDisk();
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject with an empty dataset id [removeDataset]", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an null dataset id [removeDataset]", async function () {
			try {
				await facade.removeDataset(null as any);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with only whitespace dataset id [removeDataset]", async function () {
			try {
				await facade.removeDataset(" 		 ");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with underscores in id for [removeDataset]", async function () {
			try {
				await facade.removeDataset("notValid_");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject if no such id exists [removeDataset]", async function () {
			try {
				await facade.removeDataset("validIdButDoesNotExist");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should not reject if id exists [removeDataset]", async function () {
			try {
				const idToUse = "validId";
				await facade.addDataset(idToUse, sections, InsightDatasetKind.Sections);
				await facade.removeDataset(idToUse);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should delete the dataset (add dataset then delete it twice, should produce error) [removeDataset]", async function () {
			try {
				const idToUse = "validId";
				await facade.addDataset(idToUse, sections, InsightDatasetKind.Sections);
				await facade.removeDataset(idToUse);
				await facade.removeDataset(idToUse);
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should return promise that resolves to string that is equal to the ID of the dataset to delete [removeDataset]", async function () {
			try {
				const idToUse = "validId";
				await facade.addDataset(idToUse, sections, InsightDatasetKind.Sections);
				const promiseString = await facade.removeDataset(idToUse);
				expect(promiseString).to.equal(idToUse);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should delete dataset successfully when using different InsightFacade for adding and deleting because of the cache [removeDataset]", async function () {
			try {
				const idToUse = "validId";
				await facade.addDataset(idToUse, sections, InsightDatasetKind.Sections);

				const newfacade = new InsightFacade();

				await newfacade.removeDataset(idToUse);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should reject deletion of dataset when id case does not match [removeDataset]", async function () {
			try {
				const idToUse = "validId";
				await facade.addDataset(idToUse, sections, InsightDatasetKind.Sections);

				await facade.removeDataset("ValidId");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should successfully add and delete multiple datasets consecutively [removeDataset]", async function () {
			try {
				await facade.addDataset("1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("2", sections, InsightDatasetKind.Sections);
				await facade.addDataset("3", sections, InsightDatasetKind.Sections);

				await facade.removeDataset("2");

				await facade.addDataset("2", sections, InsightDatasetKind.Sections);

				await facade.removeDataset("2");
				await facade.removeDataset("1");
				await facade.removeDataset("3");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should successfully delete the correct dataset [removeDataset]", async function () {
			try {
				await facade.addDataset("1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("2", sections, InsightDatasetKind.Sections);
				await facade.addDataset("3", sections, InsightDatasetKind.Sections);

				await facade.removeDataset("2");

				const stringArray = await facade.addDataset("4", sections, InsightDatasetKind.Sections);
				testStringArrayContents(stringArray, "1");
				testStringArrayContents(stringArray, "3");
				testStringArrayContents(stringArray, "4");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should successfully delete room dataset and section data when adding both room and section data", async function () {
			try {
				await facade.addDataset("section1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				await facade.addDataset("section2", sections, InsightDatasetKind.Sections);

				await facade.removeDataset("rooms");
				await facade.removeDataset("section1");

				const stringArray = await facade.addDataset("4", sections, InsightDatasetKind.Sections);
				testStringArrayContents(stringArray, "section2");
				testStringArrayContents(stringArray, "4");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should successfully delete room dataset and section data when adding both room and section data with new facade", async function () {
			try {
				await facade.addDataset("section1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				await facade.addDataset("section2", sections, InsightDatasetKind.Sections);

				const newFacade = new InsightFacade();

				await newFacade.removeDataset("rooms");
				await newFacade.removeDataset("section1");

				const stringArray = await newFacade.addDataset("4", sections, InsightDatasetKind.Sections);
				testStringArrayContents(stringArray, "section2");
				testStringArrayContents(stringArray, "4");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should successfully delete everything (mix of rooms and sections data)", async function () {
			try {
				await facade.addDataset("section1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				await facade.addDataset("section2", sections, InsightDatasetKind.Sections);

				await facade.removeDataset("rooms");
				await facade.removeDataset("section1");
				await facade.removeDataset("section2");

				const stringArray = await facade.addDataset("4", sections, InsightDatasetKind.Sections);
				testStringArrayContents(stringArray, "4");
				testStringNotInArrayContents(stringArray, "rooms");
				testStringNotInArrayContents(stringArray, "section1");
				testStringNotInArrayContents(stringArray, "section2");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should successfully delete everything (mix of rooms and sections data) with new facade", async function () {
			try {
				await facade.addDataset("section1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				await facade.addDataset("section2", sections, InsightDatasetKind.Sections);

				const newFacade = new InsightFacade();

				await newFacade.removeDataset("rooms");
				await newFacade.removeDataset("section1");
				await newFacade.removeDataset("section2");

				const stringArray = await newFacade.addDataset("4", sections, InsightDatasetKind.Sections);
				testStringArrayContents(stringArray, "4");
				testStringNotInArrayContents(stringArray, "rooms");
				testStringNotInArrayContents(stringArray, "section1");
				testStringNotInArrayContents(stringArray, "section2");
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});
	});

	describe("addDatasetSections", function () {
		before(async function () {
			// This block runs once and loads the datasets.
			sections = await getContentFromArchives("validSmall.zip");

			// Just in case there is anything hanging around from a previous run of the test suite
			await clearDisk();
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject with an empty dataset id [addDataset]", async function () {
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should not add dataset twice successfully when using different InsightFacade for adding because of the cache [addDataset]", async function () {
			try {
				const idToUse = "validId";
				await facade.addDataset(idToUse, sections, InsightDatasetKind.Sections);

				const newfacade = new InsightFacade();

				await newfacade.addDataset(idToUse, sections, InsightDatasetKind.Sections);
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a whitespace id [addDataset]", async function () {
			try {
				await facade.addDataset(" 	  	", sections, InsightDatasetKind.Sections);

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a null id [addDataset]", async function () {
			try {
				await facade.addDataset(null as any, sections, InsightDatasetKind.Sections);

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with null sections [addDataset]", async function () {
			try {
				await facade.addDataset("validid", null as any, InsightDatasetKind.Sections);

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with null InsightDataKind [addDataset]", async function () {
			try {
				await facade.addDataset("validid", sections, null as any);

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject an id with an underscore [addDataset]", async function () {
			try {
				await facade.addDataset("hi__", sections, InsightDatasetKind.Sections);

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should not add any datasets with same id twice [addDataset]", async function () {
			try {
				await facade.addDataset("fakeId", sections, InsightDatasetKind.Sections);
				await facade.addDataset("fakeId", sections, InsightDatasetKind.Sections);
				expect.fail("Second dataset should not have been added successfully. (no duplicate ids)");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should add datasets with different ids [addDataset]", async function () {
			try {
				await facade.addDataset("id1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("id2", sections, InsightDatasetKind.Sections);
				await facade.addDataset("id3", sections, InsightDatasetKind.Sections);
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should add datasets with different ids and resolve a promise containing string array with all 3 ids [addDataset]", async function () {
			try {
				const stringArray1 = await facade.addDataset("id1", sections, InsightDatasetKind.Sections);
				testStringArrayContents(stringArray1, "id1");
				//expect(stringArray1.includes("id1")).to.be.true;
				const stringArray2 = await facade.addDataset("id2", sections, InsightDatasetKind.Sections);
				testStringArrayContents(stringArray2, "id1");
				testStringArrayContents(stringArray2, "id2");
				//expect(stringArray2.includes("id1")).to.be.true;
				//expect(stringArray2.includes("id2")).to.be.true;

				const stringArray3 = await facade.addDataset("id3", sections, InsightDatasetKind.Sections);

				testStringArrayContents(stringArray3, "id1");
				testStringArrayContents(stringArray3, "id2");
				testStringArrayContents(stringArray3, "id3");
				//expect(stringArray3.includes("id1")).to.be.true;
				//expect(stringArray3.includes("id2")).to.be.true;
				//expect(stringArray3.includes("id3")).to.be.true;
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should return a string array [addDataset]", async function () {
			try {
				const stringArr = await facade.addDataset("3324", sections, InsightDatasetKind.Sections);

				if (!Array.isArray(stringArr)) {
					expect.fail("String array should be an array.");
				}

				expect(stringArr.length).to.be.greaterThan(0);

				for (const str of stringArr) {
					expect(str).to.be.a("string");
				}
			} catch (err) {
				const errorMessage = (err as Error).message;
				expect.fail(`The test should not reach the catch block. Error: ${errorMessage}`);
			}
		});

		it("should not add dataset successfully when using different InsightFacade for adding and adding again because of the cache [addDataset]", async function () {
			try {
				const idToUse = "validId";
				await facade.addDataset(idToUse, sections, InsightDatasetKind.Sections);

				const newfacade = new InsightFacade();

				await newfacade.addDataset(idToUse, sections, InsightDatasetKind.Sections);

				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an invalid dataset and course [addDataset]", async function () {
			try {
				const invalidSections = await getContentFromArchives("invalidDatasetAndCourseSmall.zip");

				await facade.addDataset("validId", invalidSections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an invalid section json [addDataset]", async function () {
			try {
				const invalidSections = await getContentFromArchives("invalidSectionSmall.zip");

				await facade.addDataset("validId", invalidSections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	describe("PerformQuery", function () {
		function getInsightResultValue(input: string, insightResult: InsightResult): string | number {
			const keys = Object.keys(insightResult);

			// Here we get the correct key whose text beyond the _ matches the input
			const matchingKey = keys.find((key) => key.split("_")[1] === input);

			// If no matching key is found, throw an error
			if (!matchingKey) {
				throw new Error("Invalid input: No matching key found.");
			}

			const value = insightResult[matchingKey];

			if (value === undefined) {
				throw new Error("Invalid input");
			}

			// If numeber return number, else return string
			return typeof value === "number" ? Number(value) : String(value);
		}

		function checkSortedQuery(expected: InsightResult[], result: InsightResult[], keySortedAgainst: string): void {
			for (let i = 0; i < result.length - 1; i++) {
				const currentValue = getInsightResultValue(keySortedAgainst, result[i]);

				const expectedCurrentValue = getInsightResultValue(keySortedAgainst, expected[i]);
				if (currentValue !== expectedCurrentValue) {
					expect.fail("Sorted incorrectly!"); // The result is not sorted correctly
				}
			}
		}

		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context, keySortedAgainst: null | string = null): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[];
			try {
				result = await facade.performQuery(input);
				if (errorExpected) {
					expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
				}
				expect(expected).to.have.deep.members(result);
				if (keySortedAgainst !== null) {
					checkSortedQuery(expected, result, keySortedAgainst);
				}
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}

				if (expected === "InsightError") {
					expect(err).to.be.instanceOf(InsightError);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				} else {
					expect.fail(`performQuery threw error that's not ResultTooLargeError or InsightError: ${err}`);
				}
			}
		}

		before(async function () {
			facade = new InsightFacade();

			sections = await getContentFromArchives("pair.zip");

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it(
			"[valid/simple.json] should return all depts whose average is greater than 97 in ascending order of average",
			checkQuery
		);
		it("[invalid/invalid.json] should fail since query is missing WHERE", checkQuery);
		it("[invalid/whereNullTest.json] should fail since WHERE is null", checkQuery);
		it("[invalid/whereArrayTest.json] should fail since WHERE is an array", checkQuery);
		it("[valid/sectionAvgEq97.json] should get all depts whose averge is exactly equal to 97", checkQuery);
		it("[invalid/twoKeysInWhere.json] should fail since WHERE contains two keys", checkQuery);
		it("[invalid/invalidKeyTypeInWhere.json] should fail since WHERE contains an invalid key", checkQuery);
		it("[invalid/emptyColumnArray.json] should fail since COLOUMNS is an empty array", checkQuery);
		it("[invalid/emptyOptions.json] should fail since OPTIONS is empty", checkQuery);
		it("[invalid/missingOptions.json] should fail since OPTIONS is missing", checkQuery);
		it("[invalid/missingWhere.json] should fail since WHERE is missing", checkQuery);
		it("[invalid/invalidQueryString.json] should fail since query is an invalid query string", checkQuery);
		it("[valid/wildcardStartWithCps.json] should return all dept that start with cps", checkQuery);
		it("[valid/wildcardEndWithCps.json] should return all dept that end with cps", checkQuery);
		it("[valid/wildcardContainCps.json] should return all dept that contain with cps", checkQuery);
		it("[valid/isEqualToApsc.json] should return all dept that equal Apsc", checkQuery);
		it("[invalid/wildcardAsterisksMiddle.json] should fail since asteriks is in the middle for wildcard", checkQuery);
		it("[invalid/orderKeyNotInColumns.json] should fail since order key is not in the columns", checkQuery);
		it(
			"[invalid/bodyWithNoFilter.json] should fail since there is no filter it will get more than 5000 courses",
			checkQuery
		);
		it("[invalid/invalidKeyInIs.json] should fail since there is an invalid key in IS", checkQuery);
		it(
			"[valid/equalSectionPass100.json] should return specified info regarding all sections who have exactly 100 people who pass the course",
			checkQuery
		);
		it(
			"[valid/zeroReturnedSections.json] should return zero courses since no course is named after an empty string",
			checkQuery
		);
		it("[invalid/ISHasTwoKeys.json] should fail since IS has two keys and can only have one", checkQuery);
		it(
			"[invalid/EQSectionsDeptString.json] should fail since EQ sections_dept has been given a string when it should only be given a number",
			checkQuery
		);
		it(
			"[invalid/EQSectionsDeptBoolean.json] should fail since EQ sections_dept has been given a boolean when it should only be given a number",
			checkQuery
		);
		it(
			"[invalid/GTSectionsDeptString.json] should fail since GT sections_dept has been given a string when it should only be given a number",
			checkQuery
		);
		it(
			"[invalid/LTSectionsDeptString.json] should fail since LT sections_dept has been given a string when it should only be given a number",
			checkQuery
		);
		it(
			"[valid/AndOperationOnDeptOnInstructor.json] should return all sections that match the specified dept and has an instructor with the wildcard name",
			checkQuery
		);
		it(
			"[invalid/QueryDifferentDataset.json] should fail we attempt to query different dataset than provided",
			checkQuery
		);
		it(
			"[valid/NOTApscAndInstructorJohn.json] should return all sections that is not Apsc and has the instructor named john",
			checkQuery
		);
		it(
			"[valid/ShowAllColumnData.json] should return all sections that is not Apsc and has the instructor named john and all the column data",
			checkQuery
		);
		it("[invalid/ANDIsEmptyArray.json] should fail since AND is an empty array", checkQuery);
		it("[invalid/ORIsEmptyArray.json] should fail since OR is an empty array", checkQuery);
		it(
			"[valid/ORAvgIs100Or99Or98or97or96.json] should return all sections with average of exactly 100, 99, 98, 97, 97",
			checkQuery
		);
		it("[valid/duplicateKeysInColumns.json] should still return values.", checkQuery);
		it("[valid/ComplexNestedAndOrsNotArrays.json] should return all sections with avg greater than 70 that is not cpsc whose instructor is named johnson or whose section year is not before 2018 AND whose pass count is exactly 100 whose department is not math and whose instructor is not named smith AND sections whose department is stat whose average is greater than 85 whose number of failures is not less than 10. Ordered by sections_avg", async function () {
			await checkQuery.call(this, "avg");
		});
		it("[invalid/invalidKeyInOptions.json] should fail as there is invalid key in OPTIONS", checkQuery);
		it("[invalid/invalidTypeInOrder.json] should fail as there is an invalid type for ORDER", checkQuery);
		it(
			"[invalid/invalidDatasetReferencedInOrder.json] should fail as we reference an invalid dataset in ORDER",
			checkQuery
		);
		it(
			"[invalid/invalidDatasetReferencedInColumns.json] should fail as we reference an invalid dataset in COLUMNS",
			checkQuery
		);
		it("[invalid/invalidKeyInColumns.json] should fail as we have sections_invalid as a key in COLUMNS", checkQuery);
		it(
			"[invalid/invalidKeyInWhereOperator.json] should fail as we have sections_invalid as a key in the EQ operator of WHERE",
			checkQuery
		);
		it("[invalid/noUnderscoreOnKey.json] should fail as we have a key without an underscore", checkQuery);
		it("[invalid/invalidKeyInQuery.json] should fail as we have an invalid key in the Query", checkQuery);
		it("[invalid/keyInISisNull.json] should fail as we have an invalid key in IS", checkQuery);
		it(
			"[invalid/eqKeyValueIsNumber.json] should fail as we have a string representation of a number in IS",
			checkQuery
		);
		it(
			"[invalid/invalidWhereIsEmptyRetunsTooBig.json] should fail as we return more than 5000 sections",
			checkQuery
		);
		it("[valid/sortedWithAudit.json] should pass when we sort with audit", async function () {
			await checkQuery.call(this, "audit");
		});

		it("[valid/sortedWithUuid.json] should pass when we sort with uuid", async function () {
			await checkQuery.call(this, "uuid");
		});

		it("[valid/sortedWithTitle.json] should pass when we sort with title", async function () {
			await checkQuery.call(this, "title");
		});

		it("[valid/sortedWithInstructor.json] should pass when we sort with instructor", async function () {
			await checkQuery.call(this, "instructor");
		});

		it("[valid/sortedWithDept.json] should pass when we sort with dept", async function () {
			await checkQuery.call(this, "dept");
		});

		it("[valid/sortedWithYear.json] should pass when we sort with year", async function () {
			await checkQuery.call(this, "year");
		});

		it("[valid/sortedWithAvg.json] should pass when we sort with avg", async function () {
			await checkQuery.call(this, "avg");
		});

		it("[valid/sortedWithPass.json] should pass when we sort with pass", async function () {
			await checkQuery.call(this, "pass");
		});

		it("[valid/sortedWithFail.json] should pass when we sort with fail", async function () {
			await checkQuery.call(this, "fail");
		});

		it("[valid/sortedWithId.json] should pass when we sort with id", async function () {
			await checkQuery.call(this, "id");
		});
	});
});
