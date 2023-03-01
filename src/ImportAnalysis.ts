import { OptimizeEntry } from "./OptimizeEntry";
import { ImportEntry } from "./ImportEntry";
import { ImportLexed } from "./ImportsLexer";

export class ImportAnalysis {
  public importEntries: ImportEntry[] = [];
  constructor(public optimizeEntries: OptimizeEntry[]) {}

  getRewrites(importLexed: ImportLexed) {
    const optimizeEntry = this.optimizeEntries.find(
      (i) => i.moduleName === importLexed.importTarget
    );

    if (!optimizeEntry) {
      return undefined;
    }

    const variableSpecificMatch = optimizeEntry.imports.find(
      (v) => v.importedAs === importLexed.importedAs
    );

    return {
      path: variableSpecificMatch?.rewritePath || optimizeEntry.rewritePath,
      importedAs: variableSpecificMatch?.rewriteExportedAs,
    };
  }

  addEntry(lexedImport: ImportLexed) {
    // Check if we already have an entry for this module
    // If we do, we need to merge the entries
    // If we don't, we need to add a new entry
    // If there is a rewrite configured for the module, we need to
    // separate de importEntry into another entry with the same
    // rewrite for each variable

    const { path: rewritePath, importedAs: rewriteExportedAs } =
      this.getRewrites(lexedImport) || {};

    const existingEntry = this.importEntries.find((i) => {
      if (rewritePath) {
        return i.rewritePath === rewritePath;
      }

      return i.moduleName === lexedImport.importTarget;
    });

    if (!existingEntry) {
      this.importEntries.push({
        rewritePath: rewritePath,
        rewriteExportedAs: rewriteExportedAs,
        moduleName: lexedImport.importTarget,
        lexedImports: [lexedImport],
      });

      return;
    }

    const existingLexedImport = existingEntry.lexedImports.find(
      (i) => i.importedAs === lexedImport.importedAs
    );

    if (existingLexedImport) return;

    existingEntry.lexedImports.push(lexedImport);
  }
}
