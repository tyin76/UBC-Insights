import Decimal from "decimal.js";
import { InsightError, InsightResult } from "../controller/IInsightFacade";
import { isFieldValidRoomNumberField, isFieldValidRoomStringField } from "./RoomValidationHelper";
import { isFieldValidSectionNumberField, isFieldValidSectionStringField } from "./SectionValidationHelper";
import { recursiveInsightResultCompare } from "./InsightResultSortHelper";
import { avgForGroupHelper } from "./TransformationEngineHelpers";

export function transformEngine(insightResults: InsightResult[], query: any): InsightResult[] {
	if (insightResults.length === 0) {
		return [];
	}

	const transformInstructions = getTransformInstructions(query);

	// { [key: string]: InsightResult }
	const transformationInsightResults: Record<string, InsightResult> = {};

	if (transformInstructions.length === 0) {
		return groupOnly(transformationInsightResults, insightResults, query);
	}

	const indexOfCustomFieldName = 0;
	const indexOfTransformOperator = 1;
	const indexOfFieldToTransform = 2;

	for (const instruction of transformInstructions) {
		transform(
			transformationInsightResults,
			insightResults,
			query,
			instruction[indexOfCustomFieldName],
			instruction[indexOfTransformOperator],
			instruction[indexOfFieldToTransform]
		);
	}

	const filteredInsightResults = columnFilteredInsightResults(query, Object.values(transformationInsightResults));

	return sortInsightResults(query, filteredInsightResults);
}

function sortInsightResults(query: any, insightResults: InsightResult[]): InsightResult[] {
	if (query.OPTIONS.ORDER !== null && query.OPTIONS.ORDER !== undefined) {
		if (typeof query.OPTIONS.ORDER === "string") {
			sortInsightResultsUsingKey([query.OPTIONS.ORDER], insightResults);
		} else {
			sortInsightResultsUsingKey(query.OPTIONS.ORDER.keys, insightResults, query.OPTIONS.ORDER.dir);
		}
	}
	return insightResults;
}

function sortInsightResultsUsingKey(
	conditionKeys: string[],
	insightResultsToSort: InsightResult[],
	direction = "UP"
): void {
	insightResultsToSort.sort((x, y) => recursiveInsightResultCompare(conditionKeys, x, y));

	if (direction === "DOWN") {
		insightResultsToSort.reverse();
	} else if (direction !== "UP") {
		throw new InsightError("Invalid dir key");
	}
}

function columnFilteredInsightResults(query: any, insightResults: InsightResult[]): InsightResult[] {
	const columns = query.OPTIONS.COLUMNS;

	const newInsightToReturn: InsightResult[] = [];

	for (const result of insightResults) {
		const newInsightResult: InsightResult = {};
		for (const key of Object.keys(result)) {
			if (columns.includes(key)) {
				newInsightResult[key] = result[key];
			}
		}
		newInsightToReturn.push(newInsightResult);
	}
	return newInsightToReturn;
}

function transform(
	//{ [key: string]: InsightResult }
	transformationInsightResults: Record<string, InsightResult>,
	insightResults: InsightResult[],
	query: any,
	customField: string,
	transformationOperator: string,
	fieldToTransform: string
): InsightResult[] {
	switch (transformationOperator) {
		case "MAX":
			return getMaxForGroup(transformationInsightResults, insightResults, query, customField, fieldToTransform);
		case "MIN":
			return getMinForGroup(transformationInsightResults, insightResults, query, customField, fieldToTransform);
		case "AVG":
			return getAvgForGroup(transformationInsightResults, insightResults, query, customField, fieldToTransform);
		case "SUM":
			return getSumForGroup(transformationInsightResults, insightResults, query, customField, fieldToTransform);
		case "COUNT":
			return getCountForGroup(transformationInsightResults, insightResults, query, customField, fieldToTransform);
	}
	throw new InsightError("Invalid transformation operator");
}

function groupOnly(
	//{ [key: string]: InsightResult }
	transformationInsightResults: Record<string, InsightResult>,
	insightResults: InsightResult[],
	query: any
): InsightResult[] {
	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	for (const result of insightResults) {
		let currGroupId = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}

		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}
	}
	return Object.values(transformationInsightResults);
}

function getTransformInstructions(query: any): string[][] {
	const toTransform = [];

	const apply = query.TRANSFORMATIONS.APPLY;

	// Use a for loop to iterate over each object in the data array
	for (const key of apply) {
		const item = key; // Get the current object

		const customFieldName = Object.keys(item)[0];
		const transformationOperator = Object.keys(item[customFieldName])[0];
		const fieldToTransform = item[customFieldName][transformationOperator];

		// Push the new array into the transformedArray
		toTransform.push([customFieldName, transformationOperator, fieldToTransform]);
	}
	return toTransform;
}

function validateFieldIsStringOrNumberType(fieldToCount: string): void {
	const parsedField = fieldToCount.split("_")[1];
	if (
		!(
			isFieldValidRoomNumberField(parsedField) ||
			isFieldValidSectionNumberField(parsedField) ||
			isFieldValidRoomStringField(parsedField) ||
			isFieldValidSectionStringField(parsedField)
		)
	) {
		throw new InsightError("Field provided is of the wrong type for transformation");
	}
}

function getCountForGroup(
	//{ [key: string]: InsightResult }
	transformationInsightResults: Record<string, InsightResult>,
	insightResults: InsightResult[],
	query: any,
	customFieldName: string,
	fieldToCount: string
): InsightResult[] {
	validateFieldIsStringOrNumberType(fieldToCount);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	//{ [key: string]: Set<number | string> }
	const countMap: Record<string, Set<number | string>> = {};

	for (const result of insightResults) {
		let currGroupId = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (countMap[currGroupId] === undefined) {
			countMap[currGroupId] = new Set();
			countMap[currGroupId].add(result[fieldToCount]);
		} else {
			countMap[currGroupId].add(result[fieldToCount]);
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}
		if (transformationInsightResults[currGroupId][customFieldName] === undefined) {
			transformationInsightResults[currGroupId][customFieldName] = 0;
		}
	}

	for (const key of Object.keys(countMap)) {
		transformationInsightResults[key][customFieldName] = countMap[key].size;
	}

	return Object.values(transformationInsightResults);
}

function getMinForGroup(
	//{ [key: string]: InsightResult }
	transformationInsightResults: Record<string, InsightResult>,
	insightResults: InsightResult[],
	query: any,
	customField: string,
	fieldToFindMin: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToFindMin);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	for (const result of insightResults) {
		let currGroupId = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}

		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}
		if (transformationInsightResults[currGroupId][customField] !== undefined) {
			const min = Number(transformationInsightResults[currGroupId][customField]);
			const potentialMin = Number(result[fieldToFindMin]);
			if (potentialMin < min) {
				transformationInsightResults[currGroupId][customField] = potentialMin
			}
		} else if (transformationInsightResults[currGroupId][customField] === undefined) {
			transformationInsightResults[currGroupId][customField] = Number(result[fieldToFindMin]);
		}
	}

	return Object.values(transformationInsightResults);
}

function checkIfFieldTypeOfNumber(field: string): void {
	const parsedField = field.split("_")[1];

	if (isFieldValidRoomNumberField(parsedField) || isFieldValidSectionNumberField(parsedField)) {
		return;
	}

	throw new InsightError("Field provided is of the wrong type for transformation");
}

function getMaxForGroup(
	//{ [key: string]: InsightResult }
	transformationInsightResults: Record<string, InsightResult>,
	insightResults: InsightResult[],
	query: any,
	customField: string,
	fieldToFindMax: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToFindMax);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	for (const result of insightResults) {
		let currGroupId = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}
		if (transformationInsightResults[currGroupId][customField] !== undefined) {
			const max = Number(transformationInsightResults[currGroupId][customField]);
			const potentialMax = Number(result[fieldToFindMax]);
			if (potentialMax > max) {
				transformationInsightResults[currGroupId][customField] = potentialMax;
			}
		} else if (transformationInsightResults[currGroupId][customField] === undefined) {
			transformationInsightResults[currGroupId][customField] = Number(result[fieldToFindMax]);
		}
	}

	return Object.values(transformationInsightResults);
}

function getSumForGroup(
	//{ [key: string]: InsightResult }
	transformationInsightResults: Record<string, InsightResult>,
	insightResults: InsightResult[],
	query: any,
	customField: string,
	fieldToSum: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToSum);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	// { [key: string]: Decimal }
	const sumMap: Record<string, Decimal> = {};

	for (const result of insightResults) {
		let currGroupId = "";
		const insightResult: InsightResult = {};
		for (const field of fieldsToGroupBy) {
			currGroupId += result[field];
			insightResult[field] = result[field];
		}
		if (transformationInsightResults[currGroupId] === undefined) {
			transformationInsightResults[currGroupId] = insightResult;
		}
		if (sumMap[currGroupId] !== undefined) {
			sumMap[currGroupId] = (sumMap[currGroupId] as Decimal).add(new Decimal(result[fieldToSum]));
		} else if (sumMap[currGroupId] === undefined) {
			sumMap[currGroupId] = new Decimal(result[fieldToSum]);
		}
	}

	const fixedAmt = 2;

	for (const key of Object.keys(sumMap)) {
		transformationInsightResults[key][customField] = Number(sumMap[key].toFixed(fixedAmt));
	}

	return Object.values(transformationInsightResults);
}

function getAvgForGroup(
	//{ [key: string]: InsightResult }
	transformationInsightResults: Record<string, InsightResult>,
	insightResults: InsightResult[],
	query: any,
	customField: string,
	fieldToAvg: string
): InsightResult[] {
	checkIfFieldTypeOfNumber(fieldToAvg);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	// { [key: string]: { [x: string]: Decimal | number } }
	const avgMap: Record<string, Record<string, Decimal | number>> = {};

	const rowsKeyword = "rows";
	const totalKeyword = "total";

	avgForGroupHelper(
		insightResults,
		fieldsToGroupBy,
		transformationInsightResults,
		avgMap,
		totalKeyword,
		rowsKeyword,
		fieldToAvg
	);

	const fixedAmt = 2;

	for (const key of Object.keys(avgMap)) {
		const total = (avgMap[key][totalKeyword] as Decimal).toNumber();
		const rows = avgMap[key][rowsKeyword] as number;
		const avg = total / rows;
		transformationInsightResults[key][customField] = Number(avg.toFixed(fixedAmt));
	}

	return Object.values(transformationInsightResults);
}

function getFieldsToGroupBy(query: any): string[] {
	return query.TRANSFORMATIONS.GROUP;
}
