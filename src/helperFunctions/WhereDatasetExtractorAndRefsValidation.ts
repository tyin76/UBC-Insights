import { InsightError } from "../controller/IInsightFacade";
import { getKeysWithUnderscore } from "./QueryHandler";
import { isFieldValidSectionField } from "./ValidationHelpers";

export function validateDatasetRefsInWhereAndGetSingleDataset(where: any): string {
	const datasetNameSet = new Set<string>();
	let datasetName = "";

	// This for loop checks that all keys have dataset names that are referenceing the same dataset, and that all parameters are valid
	for (const datasetNameField of getKeysWithUnderscore(where)) {
		const datasetNameAndField = getDatasetNameAndFieldInArray(datasetNameField);

		validateDatasetNameAndFieldFormat(datasetNameAndField);

		datasetName = getDatasetName(datasetNameAndField);

		const field = getDatasetField(datasetNameAndField);

		validateDatasetField(field);
		assertSingleDatasetReference(datasetName, datasetNameSet);
	}
	return datasetName;
}

function assertSingleDatasetReference(datasetName: string, datasetNameSet: Set<string>): void {
	// Add datasetName to datasetNameSet
	datasetNameSet.add(datasetName);

	// If the nameSet is larger than 1, this must mean that the query has keys such as "dataset1_dept" and "dataset2_dept",
	// which is not allowed because you can only query from one dataset at a time
	if (datasetNameSet.size !== 1) {
		throw new InsightError("You can only reference one dataset in the query");
	}
}

function validateDatasetField(field: string): void {
	// checks to see if filed is valid, remember filed is invalid if it is not one of the following "year", "avg", "pass", "fail", "audit", "uuid", "id", "title", "instructor", "dept"
	if (!isFieldValidSectionField(field)) {
		throw new InsightError("Dataset field is invalid");
	}
}

function getDatasetNameAndFieldInArray(datasetName_field: string): string[] {
	return datasetName_field.split("_");
}

function getDatasetName(datasetNameAndField: string[]): string {
	return datasetNameAndField[0];
}

function getDatasetField(datasetNameAndField: string[]): string {
	return datasetNameAndField[1];
}

function validateDatasetNameAndFieldFormat(datasetNameAndField: string[]): void {
	// Keys with underscores look like this "datasetName_param" for example "sections_dept", if we split at the underscore "_",
	// and the length of the array is not 2, then either there are too many underscores in the key, or the key does not contain both
	// the dataset name, and the parameter

	const correctArrayLength = 2;
	if (datasetNameAndField.length !== correctArrayLength) {
		throw new InsightError("Missing dataset name, or parameter");
	}
}
