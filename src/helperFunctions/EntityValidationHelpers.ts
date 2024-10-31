import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { isFieldValidRoomField } from "./RoomValidationHelper";
import { isFieldValidSectionField } from "./SectionValidationHelper";
import { doesQueryContainTransformations } from "./TransformationsHelper";

const seperatedArrayLengths = 2;

export function validateAndExtractEntityFieldAndComparisonValue(
	object: any,
	isStringOnlyValue: boolean,
	kind: InsightDatasetKind
): any[] {
	const operators = Object.keys(object);

	if (operators.length !== 1) {
		throw new InsightError("Object should have exactly one condition key.");
	}

	const conditionKey = operators[0];

	// Remember that the condition key is formatted like this "sections_dept", thus splitting at _, dept should be at index 1
	const entityFieldToBeEvaluated = conditionKey.split("_")[1];

	if (kind === InsightDatasetKind.Sections) {
		if (!isFieldValidSectionField(entityFieldToBeEvaluated)) {
			throw new InsightError("Invalid condition Key");
		}
	} else {
		if (!isFieldValidRoomField(entityFieldToBeEvaluated)) {
			throw new InsightError("Invalid condition Key");
		}
	}

	const comparisonValue = object[conditionKey];

	validateEntityFieldTypeSameAsComparisonValue(comparisonValue, isStringOnlyValue);

	return [entityFieldToBeEvaluated, comparisonValue];
}

function validateEntityFieldTypeSameAsComparisonValue(comparisonValue: any, isStringOnlyValue: boolean): void {
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

export function validateOptionsAndGetSingleDataset(query: any): string {
	// We intialize a set, remember, a set cannot hold duplicate values
	const nameSet = new Set<string>();
	let datasetName = "";

	for (const column of query.OPTIONS.COLUMNS) {

		// Skip past the custom keys created (it won't have an underscore)
		if (!column.includes("_")) {
			continue;
		}

		const columnParts = column.split("_");

		// Check if the column contains a dataset name
		if (!doesQueryContainTransformations(query)) {
			if (columnParts.length !== seperatedArrayLengths) {
				throw new InsightError("Invalid column key, keys without underscores are only allowed when transformation is present.");
			}
		} else {
		//	validateTransformation(query);
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
