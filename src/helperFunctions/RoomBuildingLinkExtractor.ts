function getFirstHtmTagInTable(table: string): string {
	const start = table.indexOf("<");
	const end = table.indexOf(">") + ">".length;
	return table.substring(start, end);
}

function doesTagHaveBuildingLink(htmTag: string): boolean {
	const start = htmTag.indexOf("./campus/discover/buildings-and-classrooms");
	const end = htmTag.indexOf(".htm");

	return !(start === -1 || end === -1);
}

function getFirstBuildingLinkInTag(htmTag: string): string {
	const start = htmTag.indexOf("./campus/discover/buildings-and-classrooms");
	const end = htmTag.indexOf(".htm") + ".htm".length;
	return htmTag.substring(start, end);
}

function removeFirstHtmTagFromTable(table: string): string {
	const end = table.indexOf(">") + ">".length;
	return table.substring(end, table.length);
}

function doesTableHaveHtmTag(htm: string): boolean {
	const start = htm.indexOf("<");
	const end = htm.indexOf(">");

	if (start === -1 || end === -1) {
		return false;
	}
	return true;
}

function getFirstTableInHTM(htm: string): string {
	const start = htm.indexOf("<tbody>");
	const end = htm.indexOf("</tbody>") + "</tbody>".length;
	return htm.substring(start, end);
}

function removeFirstTableFromHTM(htm: string): string {
	const end = htm.indexOf("</tbody>") + "</tbody>".length;
	return htm.substring(end, htm.length + 1);
}

function doesHTMHaveTable(htm: string): boolean {
	const start = htm.indexOf("<tbody>");
	const end = htm.indexOf("</tbody>");

	if (start === -1 || end === -1) {
		return false;
	}
	return true;
}

export function findBuildingLinks(indexHtm: string): string[] {
	const buildingLinks = new Set<string>();

	const tables: string[] = [];

	const htmTags: string[] = [];

	while (doesHTMHaveTable(indexHtm)) {
		tables.push(getFirstTableInHTM(indexHtm));
		indexHtm = removeFirstTableFromHTM(indexHtm);
	}

	for (let table of tables) {
		while (doesTableHaveHtmTag(table)) {
			htmTags.push(getFirstHtmTagInTable(table));
			table = removeFirstHtmTagFromTable(table);
		}
	}

	for (const htmTag of htmTags) {
		if (doesTagHaveBuildingLink(htmTag)) {
			buildingLinks.add(getFirstBuildingLinkInTag(htmTag));
		}
	}

	return [...buildingLinks];
}
