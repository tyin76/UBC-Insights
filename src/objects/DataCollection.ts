import Dataset from "./Dataset";

class DataCollection {
	private datasets: { [id: string]: Dataset } = {};

	constructor() {
		return; // do nothing I guess
	}

	public addDataset(id: string, dataset: Dataset): void {
		this.datasets[id] = dataset;
	}

	public getDatasets(): { [id: string]: Dataset } {
		return this.datasets;
	}

	public getDataset(id: string): Dataset {
		return this.datasets[id];
	}

	public removeDataset(id: string): void {
		delete this.datasets[id];
	}

	public getIds(): string[] {
		return Object.keys(this.datasets);
	}
}

export default DataCollection;
