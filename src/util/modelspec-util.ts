
export interface ModelSpecField {
    component: string;
    fieldname: string;
    val: number;
    ptype: string;
    dist: string;
    // "(0.009000000000000001, 0.011000000000000001, 0.01)"
    dist_params: string;
    // "(0.009000000000000001, 0.011000000000000001, 0.01)"
    default_dist_params: string;
    direction: null;
    lower_bound: number;
    upper_bound: number;
    is_constant: boolean,
    name: string;
    description: string | null;
    _split_fieldname?: SplitCoralFieldname;
}

/**
 * Pivoted Coral modelspec fields.
 * i.e. arborescent_Acropora_1_1_*
 */
export interface CoralData {
    name: string;
    mean_colony_diameter_m: ModelSpecField;
    growth_rate: ModelSpecField;
    fecundity: ModelSpecField;
    mb_rate: ModelSpecField;
    dist_mean: ModelSpecField;
    dist_std: ModelSpecField;
}

interface SplitCoralFieldname {
    // {kind}_{num}
    prefix: string;
    // large_massives
    kind: string;
    // 6_4
    num: string;
    // growth_rate
    metric: string;
}

const coralFieldnameRE = /^([^\d]+)_(\d_\d)_([\w]+)/

export function splitCoralFieldName(val: string): SplitCoralFieldname | undefined {
    const foo = coralFieldnameRE.exec(val);
    if (foo == null) {
        return undefined;
    }

    return {
        prefix: `${foo[1]}_${foo[2]}`,
        kind: foo[1],
        num: foo[2],
        metric: foo[3]
    }
}

/**
 * Rotate Coral groups by split fieldname prefix.
 * @param rows
 * @returns
 */
export function pivotCoralRows(rows: Array<ModelSpecField>): Array<CoralData> {
    // filter-out rows where fieldname failed to split.
    rows = rows.filter((row) => {
        const splitFieldname = splitCoralFieldName(row.fieldname);
        if (splitFieldname === undefined) {
            console.warn(`Split fieldname error "${row.fieldname}"`, row);
            return false;
        }

        row._split_fieldname = splitFieldname;
        return true;
    });

    const groups = Map.groupBy(rows, (row) => row._split_fieldname!.prefix);


    const data: Array<CoralData> = [];
    groups.forEach((group, key) => {
        const row: any = {
            name: key
        };
        for (let field of group) {
            row[field._split_fieldname!.metric] = field;
        }
        data.push(row);
    });

    return data;
}
