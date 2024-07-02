import { ModelRun } from "../types/model-run.type";

export const MODEL_RUNS: Array<ModelRun> = [
    {
        id: "1",
        title: "Alternative Coral Class Study 2022",
        desc: "Hello descr",
        startDate: new Date(2024, 7, 1, 11),
        finishDate: new Date(2024, 7, 1, 14),
        publishDate: new Date(2024, 7, 3),
        creator: "Takuya",
        modelName: "CoralBlox v1.1",
        runtime: "22m 30s"
    },
    {
        id: "2",
        title: "EcoBlox Default Run",
        desc: "Default run for EcoBlox release.",
        startDate: new Date(2024, 7, 10, 11),
        finishDate: new Date(2024, 7, 10, 12),
        publishDate: new Date(2024, 7, 11),
        creator: "Takuya",
        modelName: "CoralBlox v1.2",
        runtime: "15m 10s"
    }
];
