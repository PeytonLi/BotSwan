import { describe, expect, it } from "vitest";
import { generateNotebook } from "../src/notebook.js";

describe("generateNotebook", () => {
  it("returns valid JSON with code and output cells", () => {
    const json = generateNotebook([
      { code: "import pandas as pd", output: "" },
      { code: "df = pd.read_csv('data.csv')", output: "   col\n0    1" },
    ]);

    const notebook = JSON.parse(json);

    expect(notebook.nbformat).toBe(4);
    expect(notebook.nbformat_minor).toBe(5);
    expect(notebook.metadata.kernelspec.language).toBe("python");
    expect(notebook.cells).toHaveLength(2);
    expect(notebook.cells[0].cell_type).toBe("code");
    expect(notebook.cells[0].source).toContain("import pandas as pd");
    expect(notebook.cells[1].outputs[0].output_type).toBe("stream");
    expect(notebook.cells[1].outputs[0].text.join("")).toContain("col");
  });
});
