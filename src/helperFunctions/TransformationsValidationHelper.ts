import { InsightError } from "../controller/IInsightFacade";

export function doesQueryContainTransformations(query: any): boolean {
	if (!query.TRANSFORMATIONS) {
		return false;
	}
	return true;
}

export function validateTransformationsAndGetSingleDataset(query: any): string {
	const customKeysInColumn: string[] = [];
	const nonCustomKeysInColumn: string[] = [];

	for (const key of query.OPTIONS.COLUMNS) {
		if (key.includes("_")) {
			nonCustomKeysInColumn.push(key);
		} else {
			customKeysInColumn.push(key);
		}
	}

	checkDoesEveryNonCustomKeyAppearInGroup(query, nonCustomKeysInColumn);
	checkAreTransformationOperatorsValid(query);
	checkNoCustomKeysAppearInGroup(query, customKeysInColumn);
	const datasetName = getAndCheckTransformationReferencesSingleDataset(query);
	checkDoesEveryCustomKeyAppearInApply(query, customKeysInColumn);
	checkTransformationNotUsedOnCustomKeys(query, customKeysInColumn);

	return datasetName;
}

function getAndCheckTransformationReferencesSingleDataset(query: any): string {
	const datasetNameSet: Set<string> = new Set();

	const objects = query.TRANSFORMATIONS.APPLY;

	const objectsInApply: Object[] = [];

	const objectValuesInApply: Object[] = [];

	const toBeTransformedFieldsInApply: string[] = [];

	for (const obj of objects as Object[]) {
		objectsInApply.push(obj);
	}

	for (const obj of objectsInApply) {
		objectValuesInApply.push(Object.values(obj)[0]);
	}

	for (const obj of objectValuesInApply) {
		toBeTransformedFieldsInApply.push(Object.values(obj)[0]);
	}

	for (const datasetName of toBeTransformedFieldsInApply) {
		datasetNameSet.add(datasetName.split("_")[0]);
		if (datasetNameSet.size > 1) {
			throw new InsightError("Transformation references more than one dataset");
		}
	}

	const allFieldsInGroup = query.TRANSFORMATIONS.GROUP;

	for (const datasetName of allFieldsInGroup) {
		datasetNameSet.add(datasetName.split("_")[0]);
		if (datasetNameSet.size > 1) {
			throw new InsightError("Transformation references more than one dataset");
		}
	}

	return [...datasetNameSet][0];
}

function checkTransformationNotUsedOnCustomKeys(query: any, customKeysInColumn: string[]): void {
	const objects = query.TRANSFORMATIONS.APPLY;

	const objectsInApply: Object[] = [];

	const objectValuesInApply: Object[] = [];

	const toBeTransformedFieldsInApply: string[] = [];

	for (const obj of objects as Object[]) {
		objectsInApply.push(obj);
	}

	for (const obj of objectsInApply) {
		objectValuesInApply.push(Object.values(obj)[0]);
	}

	for (const obj of objectValuesInApply) {
		toBeTransformedFieldsInApply.push(Object.values(obj)[0]);
	}

	for (const field of toBeTransformedFieldsInApply) {
		if (customKeysInColumn.includes(field)) {
			throw new InsightError("Cannot use transformation operators on custom keys");
		}
	}
}

function checkNoCustomKeysAppearInGroup(query: any, customKeys: string[]): void {
	for (const key of customKeys) {
		if (query.TRANSFORMATIONS.GROUP.includes(key)) {
			throw new InsightError("No custom keys are allowed in GROUP");
		}
	}
}

function checkAreTransformationOperatorsValid(query: any): void {
	const objects = query.TRANSFORMATIONS.APPLY;

	const objectsInApply: Object[] = [];

	const objectValuesInApply: Object[] = [];

	const transformationOperatorsInApply: string[] = [];

	for (const obj of objects as Object[]) {
		objectsInApply.push(obj);
	}

	for (const obj of objectsInApply) {
		objectValuesInApply.push(Object.values(obj)[0]);
	}

	for (const obj of objectValuesInApply) {
		transformationOperatorsInApply.push(Object.keys(obj)[0]);
	}

	for (const operator of transformationOperatorsInApply) {
		validateTranformationOperator(operator);
	}
}

function validateTranformationOperator(operator: string): void {
	if (!["MAX", "MIN", "AVG", "COUNT", "SUM"].includes(operator)) {
		throw new InsightError("Invalid transformation operator in apply.");
	}
}

function checkDoesEveryCustomKeyAppearInApply(query: any, customKeys: string[]): void {
	const objects = query.TRANSFORMATIONS.APPLY;

	const keysInApply: string[] = [];

	for (const obj of objects as Object[]) {
		keysInApply.push(Object.keys(obj)[0]);
	}

	for (const key of customKeys) {
		if (!keysInApply.includes(key)) {
			throw new InsightError("All custom keys in column must appear in APPLY");
		}
	}
}

function checkDoesEveryNonCustomKeyAppearInGroup(query: any, nonCustomKeys: string[]): void {
	for (const key of nonCustomKeys) {
		const keysInGroup: string[] = query.TRANSFORMATIONS.GROUP;
		if (!keysInGroup.includes(key)) {
			throw new InsightError("All non custom keys in column must appear in GROUP");
		}
	}
}
