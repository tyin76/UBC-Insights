import { InsightError } from "../controller/IInsightFacade";

export function doesQueryContainTransformations(query: any): boolean {
    if (!query.TRANSFORMATIONS) {
        return false;
    }
    return true
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
        //checkDoesEveryCustomKeyAppearInApply(query, customKeysInColumn);

        return '';
}

function checkDoesEveryNonCustomKeyAppearInGroup(query: any, nonCustomKeys: string[]) {
    for (const key of nonCustomKeys) {
        const keysInGroup: string[] = query.TRANSFORMATIONS.GROUP;
        if (!keysInGroup.includes(key)) {
            throw new InsightError("All non custom keys in column must appear in GROUP");
        }
    }
}