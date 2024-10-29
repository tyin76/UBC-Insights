import JSZip from "jszip";
import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { getAllCachedDatasetIds } from "../objects/FileManagement";
import Section from "../objects/Section";
import Dataset from "../objects/Dataset";
import { createRoomsDataSetFromContent } from "./RoomHelpers";

export function validateDatasetParameters(id: string, content: string, kind: InsightDatasetKind): void {
	if (id === null || id === undefined || id.trim() === "" || typeof id !== "string" || id.includes("_")) {
		throw new InsightError("Invalid id");
	}

	if (kind === null || kind === undefined) {
		throw new InsightError("Invalid InsightDatasetKind, its either null or undefined");
	}

	if (content === null || content === undefined) {
		throw new InsightError("Invalid content, its either null or undefined");
	}
}

export async function checkThatIdDoesNotAlreadyExistInCache(id: string): Promise<void> {
	const idsThatExistInCacheSoFar = await getAllCachedDatasetIds();

	if (idsThatExistInCacheSoFar.includes(id)) {
		throw new InsightError("id already exists");
	}
}

async function extractCourseResultsFromZip(content: string): Promise<any[]> {
	const zip = new JSZip();

	const zipData = await zip.loadAsync(content, { base64: true });

	const firstFileName = Object.keys(zipData.files)[0]; // Get the name of the first file

	if (firstFileName !== "courses/") {
		throw new InsightError("no folder 'courses' in zip file");
	}

	const resultsJson: any[] = []; // To store the results from each file as a Json

	const promises = Object.keys(zipData.files).map(async (path) => {
		if (path !== "courses/") {
			const fileData = await zipData.file(path)?.async("string"); // Read the file
			if (fileData) {
				try {
					const resultJson = JSON.parse(fileData); // Parse the JSON string into resultsJson Object
					resultsJson.push(resultJson); // Store the object in the resultsJson
				} catch (_error) {
					throw new InsightError("Invalid json");
				}
			} else {
				throw new InsightError("Invalid json, path not found for some reason");
			}
		}
	});

	// wait for all promises to finish
	await Promise.all(promises);
	return resultsJson;
}

function mapJsonToSections(sectionJsonArray: any[]): Section[] {
	const sectionArray: Section[] = [];

	for (const section of sectionJsonArray) {
		const newSection = new Section(
			section.id,
			section.Course,
			section.Title,
			section.Professor,
			section.Subject,
			section.Year,
			section.Avg,
			section.Pass,
			section.Fail,
			section.Audit,
			section.Section
		);

		sectionArray.push(newSection);
	}

	return sectionArray;
}

function mapResultsToSectionArray(resultJsonArray: any[]): Section[] {
	const sectionArray: Section[] = [];

	for (const resultJson of resultJsonArray) {
		const { result } = resultJson;
		sectionArray.push(...mapJsonToSections(result));
	}

	return sectionArray;
}

export async function createSectionsDatasetFromContent(content: string, kind: InsightDatasetKind): Promise<Dataset> {
	const resultJsonArray: any[] = await extractCourseResultsFromZip(content);

	const sectionArray = mapResultsToSectionArray(resultJsonArray);

	const newDataset = new Dataset(sectionArray, kind);

	if (sectionArray.length === 0) {
		throw new InsightError("Invalid dataset, no sections");
	}

	return newDataset;
}

export async function createDatasetFromContent(content: string, kind: InsightDatasetKind): Promise<Dataset> {
	if (kind === InsightDatasetKind.Rooms) {
		return createRoomsDataSetFromContent(content);
	} else if (kind === InsightDatasetKind.Sections) {
		return createSectionsDatasetFromContent(content, kind);
	} else {
		throw new InsightError();
	}
}
