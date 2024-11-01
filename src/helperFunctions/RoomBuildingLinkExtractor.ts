export function findBuildingLinks(indexHTM: any): string[] {
	const links = new Set<string>();
	// Helper function to check if node is a td with views-field class
	function isViewsFieldTd(node: any): boolean {
		return (
			node.nodeName === "td" &&
			node.attrs?.some((attr: any) => attr.name === "class" && attr.value.includes("views-field"))
		);
	}

	// Recursive function to traverse the node tree
	function traverse(node: any): any {
		if (!node) {
			return;
		}

		if (isViewsFieldTd(node)) {
			// If found a td with views-field class, look for anchor tags within it
			if (node.childNodes) {
				node.childNodes.forEach((child: any) => {
					const href = findHrefInNode(child);
					if (href?.includes(".htm")) {
						links.add(href);
					} else {
						traverse(child);
					}
					// Continue traversing in case there are nested elements
				});
			}
		} else if (node.childNodes) {
			node.childNodes.forEach((child: any) => traverse(child));
		}
	}

	traverse(indexHTM);
	const setToArray = Array.from(links);
	return setToArray;
}

// Helper function to find href in anchor tags
function findHrefInNode(node: any): string | null {
	if (node.nodeName === "a" && node.attrs) {
		const hrefAttr = node.attrs.find((attr: any) => attr.name === "href");
		return hrefAttr?.value || null;
	}
	return null;
}
