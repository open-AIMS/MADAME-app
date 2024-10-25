export interface ModelRun {
  id: string;
  title: string;
  desc: string;
  handleId?: string;
  startDate: Date;
  // TODO calculate from (finishDate - startDate)
  runtime?: string;
  publishDate?: Date;
  creator?: string;
  modelName: string;
}
