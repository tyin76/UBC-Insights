import { InsightError } from "../controller/IInsightFacade";

const seperatedArrayLengths = 2;

function isFieldValidSectionNumberField(field: string): boolean {
	return ["year", "avg", "pass", "fail", "audit"].includes(field);
}

function isFieldValidSectionStringField(param: string): boolean {
	return ["uuid", "id", "title", "instructor", "dept"].includes(param);
}

export function isFieldValidSectionField(param: string): boolean {
	return isFieldValidSectionNumberField(param) || isFieldValidSectionStringField(param);
}

export function validateAndExtractSectionFieldAndComparisonValue(object: any, isStringOnlyValue: boolean): any[] {
	const operators = Object.keys(object);

	if (operators.length !== 1) {
		throw new InsightError("Object should have exactly one condition key.");
	}

	const conditionKey = operators[0];

	// Remember that the condition key is formatted like this "sections_dept", thus splitting at _, dept should be at index 1
	const sectionFieldToBeEvaluated = conditionKey.split("_")[1];

	if (!isFieldValidSectionField(sectionFieldToBeEvaluated)) {
		throw new InsightError("Invalid condition Key");
	}

	const comparisonValue = object[conditionKey];

	validateSectionFieldTypeSameAsComparisonValue(comparisonValue, isStringOnlyValue);

	return [sectionFieldToBeEvaluated, comparisonValue];
}

function validateSectionFieldTypeSameAsComparisonValue(comparisonValue: any, isStringOnlyValue: boolean): void {
	if (typeof comparisonValue !== "number" && typeof comparisonValue !== "string") {
		throw new InsightError("condition value is of an invalid type, not number or a string!");
	}

	if (typeof comparisonValue === "number" && isStringOnlyValue) {
		throw new InsightError("condition value is of the wrong type!");
	}

	if (typeof comparisonValue === "string" && !isStringOnlyValue) {
		throw new InsightError("condition value is of the wrong type!");
	}
}

export function validateOptionsAndGetSingleDataset(options: any): string {
	// We intialize a set, remember, a set cannot hold duplicate values
	const nameSet = new Set<string>();
	let datasetName = "";

	for (const column of options.COLUMNS) {
		const columnParts = column.split("_");

		// Check if the column contains a dataset name
		if (columnParts.length !== seperatedArrayLengths) {
			throw new InsightError("Invalid column name format. Should be 'datasetName_param'.");
		}

		datasetName = columnParts[0];
		nameSet.add(datasetName);

		// Ensure that only one dataset name is allowed
		if (nameSet.size !== 1) {
			throw new InsightError("You can only use one dataset in the query");
		}
	}

	return datasetName;
}
