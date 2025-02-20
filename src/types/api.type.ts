export interface ResultSetInfo {
  id: string;
  title: string;
  datapkg_name: string;
  invoke_time: string;
  // TODO finish_time, calculate runtime
  model_name: string;
  model_version: string;
  n_scenarios: number;
  n_locations: number;
  n_timesteps: number;
  start_year: number;
  end_year: number;
  // Published properties
  // FUTURE extend type, or sub-property
  creator?: string;
  desc?: string;
  publish_date?: Date;
  handle_id?: string;
  // Mock, need to add to ADRIA ResultSet
  runtime?: string;
}

export interface DataFrame {
  columns: Array<Array<any>>;
  colindex: {
    lookup: Record<string, number>;
    names: Array<string>;
  };
  metadata: any; // null
  colmetadata: any; // null
  allnotemetadata: boolean;
}

export interface ModelParamDesc {
  name: string,
  third_param_flag: boolean;
  lower: number;
  upper: number;
  optional_third: number;
}

export interface ModelScenariosDesc {
  run_name: string;
  num_scenarios: number;
  model_params: Array<ModelParamDesc>;
}
