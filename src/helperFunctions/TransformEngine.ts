import Decimal from "decimal.js";
import { InsightDatasetKind, InsightError, InsightResult } from "../controller/IInsightFacade";
import { isFieldValidRoomNumberField, isFieldValidRoomStringField } from "./RoomValidationHelper";
import { isFieldValidSectionNumberField, isFieldValidSectionStringField } from "./SectionValidationHelper";

export function transformEngine(insightResults: InsightResult[], query: any): InsightResult[] {
	if (insightResults.length === 0) {
		return [];
	}

	const groups: (string | number)[][] = getGroups(insightResults, query);
	const fieldsToGroupBy = getFieldsToGroupBy(query);

	const transformInstructions = getTransformInstructions(query);

	const newInsightAggregateResults: InsightResult[] = [];

	console.log(groups.length)
	let count = 0;
	for (const group of groups) {
		const newInsightAggregate: InsightResult = {};

		for (let i = 0; i < fieldsToGroupBy.length; i++) {
			newInsightAggregate[fieldsToGroupBy[i]] = group[i];
		}
		console.log(count);
		count++;
		for (const instruction of transformInstructions) {
			const aggregation = transform(group, insightResults, query, instruction[1], instruction[2]);
			newInsightAggregate[instruction[0]] = aggregation;
		}

		newInsightAggregateResults.push(newInsightAggregate);
	}
	return newInsightAggregateResults;
}

function transform(
	group: (string | number)[],
	insightResults: InsightResult[],
	query: any,
	transformationOperator: string,
	fieldToTransform: string
): number {
	switch (transformationOperator) {
		case "MAX":
			return getMaxForGroup(group, insightResults, query, fieldToTransform);
		case "MIN":
			return getMinForGroup(group, insightResults, query, fieldToTransform);
		case "AVG":
			return getAvgForGroup(group, insightResults, query, fieldToTransform);
		case "SUM":
			return getSumForGroup(group, insightResults, query, fieldToTransform);
		case "COUNT":
			return getCountForGroup(group, insightResults, query, fieldToTransform);
	}
	throw new InsightError("Invalid transformation operator");
}

function getTransformInstructions(query: any): string[][] {
	const toTransform = [];

	const apply = query.TRANSFORMATIONS.APPLY;

	// Use a for loop to iterate over each object in the data array
	for (let i = 0; i < apply.length; i++) {
		const item = apply[i]; // Get the current object

		const customFieldName = Object.keys(item)[0];
		const transformationOperator = Object.keys(item[customFieldName])[0];
		const fieldToTransform = item[customFieldName][transformationOperator];

		// Push the new array into the transformedArray
		toTransform.push([customFieldName, transformationOperator, fieldToTransform]);
	}
	return toTransform;
}

function getCountForGroup(
	group: (string | number)[],
	insightResults: InsightResult[],
	query: any,
	fieldToCount: string
): number {

    const parsedField = fieldToCount.split("_")[1];

    if (!(isFieldValidRoomNumberField(parsedField) || isFieldValidSectionNumberField(parsedField) || isFieldValidRoomStringField(parsedField) || isFieldValidSectionStringField(parsedField))) {
		throw new InsightError("Field provided is of the wrong type for transformation");
	}

	const countSet: Set<number | string> = new Set();

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	for (const result of insightResults) {
		const currGroup: (string | number)[] = [];
		for (const field of fieldsToGroupBy) {
			currGroup.push(result[field]);
		}
		if (JSON.stringify(currGroup) === JSON.stringify(group)) {
			countSet.add(result[fieldToCount]);
		}
	}

	return countSet.size;
}

function getMinForGroup(
	group: (string | number)[],
	insightResults: InsightResult[],
	query: any,
	fieldToFindMin: string
): number {
	checkIfFieldTypeOfNumber(fieldToFindMin);

    

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	let min = insightResults[0][fieldToFindMin] as number;

	for (const result of insightResults) {
		const currGroup: (string | number)[] = [];
		for (const field of fieldsToGroupBy) {
			currGroup.push(result[field]);
		}
		if (JSON.stringify(currGroup) === JSON.stringify(group)) {
			min = Math.min(min.valueOf(), result[fieldToFindMin] as number);
		}
	}

	return min;
}

function checkIfFieldTypeOfNumber(field: string): void {

    const parsedField = field.split("_")[1];

    if (isFieldValidRoomNumberField(parsedField) || isFieldValidSectionNumberField(parsedField)) {
        return;
    }

		throw new InsightError("Field provided is of the wrong type for transformation");
}

function getMaxForGroup(
	group: (string | number)[],
	insightResults: InsightResult[],
	query: any,
	fieldToFindMax: string
): number {
	checkIfFieldTypeOfNumber(fieldToFindMax);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	let max = insightResults[0][fieldToFindMax] as number;

	for (const result of insightResults) {
		const currGroup: (string | number)[] = [];
		for (const field of fieldsToGroupBy) {
			currGroup.push(result[field]);
		}
		if (JSON.stringify(currGroup) === JSON.stringify(group)) {
			max = Math.max(max.valueOf(), result[fieldToFindMax] as number);
		}
	}

	return max;
}

function getSumForGroup(
	group: (string | number)[],
	insightResults: InsightResult[],
	query: any,
	fieldToSum: string
): number {
	checkIfFieldTypeOfNumber(fieldToSum);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	const total = new Decimal(0);

	for (const result of insightResults) {
		const currGroup: (string | number)[] = [];
		for (const field of fieldsToGroupBy) {
			currGroup.push(result[field]);
		}
		if (JSON.stringify(currGroup) === JSON.stringify(group)) {
			total.add(result[fieldToSum]);
		}
	}

	const result = Number(total.toFixed(2));

	return result;
}

function getAvgForGroup(
	group: (string | number)[],
	insightResults: InsightResult[],
	query: any,
	fieldToAverage: string
): number {
	checkIfFieldTypeOfNumber(fieldToAverage);

	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);

	const total = new Decimal(0);
	let numRows = 0;

	for (const result of insightResults) {
		const currGroup: (string | number)[] = [];
		for (const field of fieldsToGroupBy) {
			currGroup.push(result[field]);
		}
		if (JSON.stringify(currGroup) === JSON.stringify(group)) {
			numRows++;
			total.add(result[fieldToAverage]);
		}
	}

	let avg = total.toNumber() / numRows;
	const result = Number(avg.toFixed(2));

	return result;
}

// each group name will represent one object
function getGroups(insightResults: InsightResult[], query: any): (string | number)[][] {
	const fieldsToGroupBy: string[] = getFieldsToGroupBy(query);
	const groups: Set<string> = new Set();

	for (const result of insightResults) {
		const group: (string | number)[] = []; // Use an array to build the group

		for (const field of fieldsToGroupBy) {
			group.push(result[field]); // Push values into the group array
		}

		// Convert the array to a string to ensure uniqueness in the Set
		groups.add(JSON.stringify(group)); // Add the stringified array to the Set
	}

	// Convert the Set back to an array of arrays
	return Array.from(groups).map((item) => convertJsonToGroup(item));
}

function convertJsonToGroup(json: any): (string | number)[] {
	return JSON.parse(json) as (string | number)[];
}

function getFieldsToGroupBy(query: any): string[] {
	return query.TRANSFORMATIONS.GROUP;
}
