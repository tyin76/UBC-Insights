import Section from "./Section";

class Dataset {
	private sections: Section[];

	constructor(sections: Section[]) {
		this.sections = sections;
	}

	public getSections(): Section[] {
		return this.sections;
	}
}

export default Dataset;
