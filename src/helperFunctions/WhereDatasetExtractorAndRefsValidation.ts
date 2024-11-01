import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { getKindFromId } from "../objects/FileManagement";
import { getKeysWithUnderscore } from "./QueryHandler";
import { validateOptionsAndGetSingleDataset } from "./EntityValidationHelpers";
import { isFieldValidSectionField } from "./SectionValidationHelper";
import { isFieldValidRoomField } from "./RoomValidationHelper";
import {
	doesQueryContainTransformations,
	validateTransformationsAndGetSingleDataset,
} from "./TransformationsValidationHelper";

export async function validateDatasetRefsInWhereAndGetSingleDataset(where: any): Promise<string> {
	const datasetNameSet = new Set<string>();
	let datasetName = "";

	// This for loop checks that all keys have dataset names that are referenceing the same dataset, and that all parameters are valid

	const validationPromises = getKeysWithUnderscore(where).map(async (datasetNameField) => {
		const datasetNameAndField = getDatasetNameAndFieldInArray(datasetNameField);

		validateDatasetNameAndFieldFormat(datasetNameAndField);

		datasetName = getDatasetName(datasetNameAndField);

		const field = getDatasetField(datasetNameAndField);

		async function getValidateAndGetKindFromId(datasetNameToGetId: string): Promise<InsightDatasetKind> {
			try {
				return await getKindFromId(datasetNameToGetId);
			} catch (err) {
				throw new InsightError((err as Error).stack);
			}
		}

		validateDatasetField(field, await getValidateAndGetKindFromId(datasetName));
		assertSingleDatasetReference(datasetName, datasetNameSet);
	});

	await Promise.all(validationPromises);

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

function validateDatasetField(field: string, kind: InsightDatasetKind): void {
	// checks to see if filed is valid, remember filed is invalid if it is not one of the following "year", "avg", "pass", "fail", "audit", "uuid", "id", "title", "instructor", "dept"

	if (kind === InsightDatasetKind.Sections) {
		if (!isFieldValidSectionField(field)) {
			throw new InsightError("Dataset field for Section is invalid");
		}
	} else {
		if (!isFieldValidRoomField(field)) {
			throw new InsightError("Dataset field for Room is invalid");
		}
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

export async function getDatasetNameAndValidateQuery(query: any): Promise<string> {
	const { WHERE } = query as any;

	// This looks at the entire query and gets the id/name of the dataset that we need to access, this also validates the WHERE object
	// To ensure that it is formatted correctly
	const datasetNameToQueryFromWhere = await validateDatasetRefsInWhereAndGetSingleDataset(WHERE);

	// This looks at the entire query and gets the id/name of the dataset that we need to access, this also validates the OPTIONS object
	// To ensure that it is formatted correctly
	const datasetNameToQueryFromOptions = validateOptionsAndGetSingleDataset(query);

	let datasetName = datasetNameToQueryFromOptions;

	// This means that WHERE is an empty object ie: {} and does not have the datasetName within it, so we must now find it in the columns portion
	if (
		datasetNameToQueryFromWhere !== "" &&
		datasetNameToQueryFromWhere !== datasetNameToQueryFromOptions &&
		!doesQueryContainTransformations(query)
	) {
		throw new InsightError("WHERE and COLOUMNS does not reference the same dataset");
	} else if (datasetName === undefined || datasetName === null || datasetName === "") {
		datasetName = datasetNameToQueryFromWhere;
	}

	let datasetNameToQueryFromTransformations = "";

	if (doesQueryContainTransformations(query)) {
		datasetNameToQueryFromTransformations = validateTransformationsAndGetSingleDataset(query);

		if (
			datasetNameToQueryFromWhere !== "" &&
			datasetNameToQueryFromWhere !== datasetNameToQueryFromOptions &&
			datasetNameToQueryFromWhere !== datasetNameToQueryFromTransformations &&
			datasetNameToQueryFromOptions !== datasetNameToQueryFromTransformations
		) {
			throw new InsightError("WHERE and COLOUMNS and TRANSFORMATIONS does not reference the same dataset");
		}
	}

	// Gets the dataset to query
	return datasetName;
}
