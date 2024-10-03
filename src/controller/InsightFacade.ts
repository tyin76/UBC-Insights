import DataCollection from "../objects/DataCollection";
import Dataset from "../objects/Dataset";
import Section from "../objects/Section";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
const JSZip = require("jszip");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	private datasetCollection = new DataCollection();

	private async getResultsJsonArray(content: string): Promise<any[]> {
		var zip = new JSZip();

		const zipData = await zip.loadAsync(content, { base64: true });

		const firstFileName = Object.keys(zipData.files)[0]; // Get the name of the first file

		if (firstFileName !== "courses/") {
			throw new InsightError("no folder 'courses' in zip file");
		}

		const resultsJson: any[] = []; // To store the results from each file as a Json

		for (const path in zipData.files) {
			if (path !== "courses/") {
				const fileData = await zipData.file(path)?.async("string"); // Read the file

				if (fileData) {
					try {
						const resultJson = JSON.parse(fileData); // Parse the JSON string into resultsJsonObject
						resultsJson.push(resultJson); // Store the object in the resultsJson
					} catch (error) {
						throw new InsightError("Invalid json");
					}
				} else {
					throw new InsightError("Invalid json, path not found for some reason");
				}
			}
		}
		return resultsJson;
	}

	private turnResultJsonToSectionArray(sectionJsonArray: any[]): Section[] {
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
				section.Audit
			);

			sectionArray.push(newSection);
		}

		return sectionArray;
	}

	private turnResultJsonArrayToSectionArray(resultJsonArray: any[]): Section[] {
		const sectionArray: Section[] = [];

		for (const resultJson of resultJsonArray) {
			const { result } = resultJson;
			sectionArray.push(...this.turnResultJsonToSectionArray(result));
		}

		return sectionArray;
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// TODO: Remove this once you implement the methods!

		// jsonContents now contains all the parsed JSON objects from the files

		if (id === null || id.trim() === "" || typeof id !== "string" || id.includes("_")) {
			throw new InsightError("Invalid id");
		}

		if (this.datasetCollection.getDataset(id) !== undefined) {
			throw new InsightError("id already exists");
		}

		const resultJsonArray: any[] = await this.getResultsJsonArray(content);

		const sectionArray = this.turnResultJsonArrayToSectionArray(resultJsonArray);

		const newDataset = new Dataset(sectionArray);

		if (sectionArray.length === 0) {
			throw new InsightError("Invalid dataset, no sections");
		}

		this.datasetCollection.addDataset(id, newDataset);

		return this.datasetCollection.getIds();
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		const regex = /^[^_]+$/;

		// checks if id is valid, otherwise throws error
		if (!regex.test(id) || id === null || id.trim() === "" || typeof id !== "string" || id.includes("_")) {
			throw new InsightError("Invalid id (removeDataset)");
		}

		if (!this.datasetCollection.getIds().includes(id)) {
			throw new NotFoundError("ID submitted is not found (removeDataset)");
		}

		this.datasetCollection.removeDataset(id);
		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
