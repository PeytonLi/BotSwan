export interface NotebookCell {
  code: string;
  output: string;
}

interface NotebookOutput {
  output_type: "stream";
  name: "stdout";
  text: string[];
}

interface NotebookCodeCell {
  cell_type: "code";
  metadata: Record<string, never>;
  source: string[];
  outputs: NotebookOutput[];
  execution_count: number | null;
}

interface NotebookDocument {
  nbformat: number;
  nbformat_minor: number;
  metadata: {
    kernelspec: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info: {
      name: string;
      version: string;
    };
  };
  cells: NotebookCodeCell[];
}

export function generateNotebook(cells: NotebookCell[]): string {
  const notebook: NotebookDocument = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: {
        name: "python",
        version: "3.11.0",
      },
    },
    cells: cells.map((cell, index) => ({
      cell_type: "code",
      metadata: {},
      source: cell.code.split("\n").map((line, i, arr) =>
        i < arr.length - 1 ? `${line}\n` : line,
      ),
      outputs: cell.output
        ? [
            {
              output_type: "stream",
              name: "stdout",
              text: cell.output.split("\n").map((line, i, arr) =>
                i < arr.length - 1 ? `${line}\n` : line,
              ),
            },
          ]
        : [],
      execution_count: cell.output ? index + 1 : null,
    })),
  };

  return JSON.stringify(notebook, null, 2);
}
